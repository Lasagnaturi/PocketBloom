const DROPBOX_DOWNLOAD_URL = 'https://content.dropboxapi.com/2/files/download'
const DROPBOX_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload'
const DROPBOX_ACCOUNT_URL = 'https://api.dropboxapi.com/2/users/get_current_account'
const GOOGLE_DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const GOOGLE_DRIVE_ABOUT_URL = 'https://www.googleapis.com/drive/v3/about?fields=user'
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ONEDRIVE_ROOT_URL = 'https://graph.microsoft.com/v1.0/me/drive'
const ONEDRIVE_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

async function requestFormUrlEncoded(url: string, values: Record<string, string>) {
  const body = new URLSearchParams(values)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${url} request failed: ${response.status} ${text}`)
  }

  return response.json()
}

function encodeOneDrivePath(path: string) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return cleanPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export async function downloadDropboxBackup(token: string, path: string): Promise<string> {
  const response = await fetch(DROPBOX_DOWNLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 409 && text.includes('path/not_found')) {
      return ''
    }
    throw new Error(`Dropbox download failed: ${response.status} ${text}`)
  }

  return await response.text()
}

export async function uploadDropboxBackup(token: string, path: string, content: string): Promise<void> {
  const response = await fetch(DROPBOX_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode: 'overwrite',
        autorename: false,
        mute: true,
        strict_conflict: false,
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: content,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Dropbox upload failed: ${response.status} ${text}`)
  }
}

export async function verifyDropboxToken(token: string): Promise<void> {
  const response = await fetch(DROPBOX_ACCOUNT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Dropbox token invalid: ${response.status} ${text}`)
  }
}

async function findGoogleDriveFileId(token: string, name: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${name.replace(/'/g, "\\'")}' and trashed = false`)
  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Google Drive file lookup failed: ${response.status}`)
  }

  const data = await response.json()
  return data.files?.[0]?.id ?? null
}

export async function downloadGoogleDriveBackup(token: string, path: string): Promise<string> {
  const fileName = path.split('/').filter(Boolean).pop() || path
  const fileId = await findGoogleDriveFileId(token, fileName)
  if (!fileId) {
    return ''
  }

  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 404) {
      return ''
    }
    throw new Error(`Google Drive download failed: ${response.status} ${text}`)
  }

  return await response.text()
}

export async function uploadGoogleDriveBackup(token: string, path: string, content: string): Promise<void> {
  const fileName = path.split('/').filter(Boolean).pop() || path
  let fileId = await findGoogleDriveFileId(token, fileName)

  if (!fileId) {
    const createResponse = await fetch(`${GOOGLE_DRIVE_FILES_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: fileName, mimeType: 'application/json' }),
    })

    if (!createResponse.ok) {
      const text = await createResponse.text()
      throw new Error(`Google Drive file creation failed: ${createResponse.status} ${text}`)
    }

    const created = await createResponse.json()
    fileId = created.id
  }

  const uploadResponse = await fetch(`${GOOGLE_DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: content,
  })

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text()
    throw new Error(`Google Drive upload failed: ${uploadResponse.status} ${text}`)
  }
}

export async function verifyGoogleDriveToken(token: string): Promise<void> {
  const response = await fetch(GOOGLE_DRIVE_ABOUT_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Drive token invalid: ${response.status} ${text}`)
  }
}

export async function downloadOneDriveBackup(token: string, path: string): Promise<string> {
  const encodedPath = encodeOneDrivePath(path)
  const url = `${ONEDRIVE_ROOT_URL}/root:/${encodedPath}:/content`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return ''
    }
    const text = await response.text()
    throw new Error(`OneDrive download failed: ${response.status} ${text}`)
  }

  return await response.text()
}

export async function uploadOneDriveBackup(token: string, path: string, content: string): Promise<void> {
  const encodedPath = encodeOneDrivePath(path)
  const url = `${ONEDRIVE_ROOT_URL}/root:/${encodedPath}:/content`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: content,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OneDrive upload failed: ${response.status} ${text}`)
  }
}

export async function verifyOneDriveToken(token: string): Promise<void> {
  const response = await fetch(`${ONEDRIVE_ROOT_URL}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OneDrive token invalid: ${response.status} ${text}`)
  }
}

export async function refreshGoogleDriveToken(
  clientId: string,
  clientSecret: string | undefined,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string }> {
  const values: Record<string, string> = {
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }

  if (clientSecret) {
    values.client_secret = clientSecret
  }

  const response = await requestFormUrlEncoded(GOOGLE_OAUTH_TOKEN_URL, values)
  if (!response.access_token) {
    throw new Error('Google Drive refresh token response missing access_token')
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export async function refreshOneDriveToken(
  clientId: string,
  clientSecret: string | undefined,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string }> {
  const values: Record<string, string> = {
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'offline_access Files.ReadWrite',
  }

  if (clientSecret) {
    values.client_secret = clientSecret
  }

  const response = await requestFormUrlEncoded(ONEDRIVE_TOKEN_URL, values)
  if (!response.access_token) {
    throw new Error('OneDrive refresh token response missing access_token')
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export async function getGoogleDriveAccessToken(config: {
  token?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
}): Promise<{ token: string; refreshToken?: string }> {
  if (config.token) {
    try {
      await verifyGoogleDriveToken(config.token)
      return { token: config.token }
    } catch {
      if (!config.refreshToken || !config.clientId) {
        throw new Error('Google Drive token non valido e refresh token mancanti.')
      }
    }
  }

  if (!config.refreshToken || !config.clientId) {
    throw new Error('Google Drive refresh token e client ID sono richiesti per aggiornare il token.')
  }

  const result = await refreshGoogleDriveToken(config.clientId, config.clientSecret, config.refreshToken)
  return {
    token: result.accessToken,
    refreshToken: result.refreshToken,
  }
}

export async function getOneDriveAccessToken(config: {
  token?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
}): Promise<{ token: string; refreshToken?: string }> {
  if (config.token) {
    try {
      await verifyOneDriveToken(config.token)
      return { token: config.token }
    } catch {
      if (!config.refreshToken || !config.clientId) {
        throw new Error('OneDrive token non valido e refresh token mancanti.')
      }
    }
  }

  if (!config.refreshToken || !config.clientId) {
    throw new Error('OneDrive refresh token e client ID sono richiesti per aggiornare il token.')
  }

  const result = await refreshOneDriveToken(config.clientId, config.clientSecret, config.refreshToken)
  return {
    token: result.accessToken,
    refreshToken: result.refreshToken,
  }
}
