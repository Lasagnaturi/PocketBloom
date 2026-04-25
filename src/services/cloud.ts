const DROPBOX_AUTHORIZE_URL = 'https://www.dropbox.com/oauth2/authorize'
const DROPBOX_TOKEN_URL = 'https://api.dropbox.com/oauth2/token'
const DROPBOX_DOWNLOAD_URL = 'https://content.dropboxapi.com/2/files/download'
const DROPBOX_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload'
const DROPBOX_ACCOUNT_URL = 'https://api.dropboxapi.com/2/users/get_current_account'

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

function base64UrlEncode(buffer: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer))
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  return crypto.subtle.digest('SHA-256', data)
}

function generateCodeVerifier() {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return Array.from(array).map((byte) => ('0' + byte.toString(16)).slice(-2)).join('')
}

async function generateCodeChallenge(codeVerifier: string) {
  const digest = await sha256(codeVerifier)
  return base64UrlEncode(digest)
}

export async function createDropboxAuthUrl(clientId: string, redirectUri: string) {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

  sessionStorage.setItem('dropbox-oauth-code-verifier', codeVerifier)
  sessionStorage.setItem('dropbox-oauth-state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    token_access_type: 'offline',
    force_reapprove: 'true',
    include_granted_scopes: 'none',
    scope: 'account_info.read files.content.write files.content.read',
    state,
  })

  return `${DROPBOX_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeDropboxAuthorizationCode(
  clientId: string,
  code: string,
  redirectUri: string,
  state: string,
) {
  const savedState = sessionStorage.getItem('dropbox-oauth-state')
  const codeVerifier = sessionStorage.getItem('dropbox-oauth-code-verifier')

  if (!savedState || !codeVerifier) {
    throw new Error('Dropbox OAuth state mancante. Riprova la connessione.')
  }
  if (state !== savedState) {
    throw new Error('Dropbox OAuth state non corrispondente.')
  }

  sessionStorage.removeItem('dropbox-oauth-state')
  sessionStorage.removeItem('dropbox-oauth-code-verifier')

  const response = await requestFormUrlEncoded(DROPBOX_TOKEN_URL, {
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })

  if (!response.access_token) {
    throw new Error('Dropbox token exchange failed')
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export async function refreshDropboxAccessToken(clientId: string, refreshToken: string) {
  const response = await requestFormUrlEncoded(DROPBOX_TOKEN_URL, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  })

  if (!response.access_token) {
    throw new Error('Dropbox refresh token failed')
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
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

export async function verifyDropboxToken(token: string): Promise<boolean> {
  const response = await fetch(DROPBOX_ACCOUNT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return false
  }

  return true
}
