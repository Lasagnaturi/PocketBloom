# PocketBloom

PocketBloom è una web app per la gestione del patrimonio personale con supporto multi-currency, conti, entrate, investimenti e backup.

## Esecuzione locale

```bash
npm install
npm start
```

Per usare comunque il comando diretto di Vite:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Lint e formattazione

```bash
npm run lint
npm run format
```

## Impostazioni e supporto valute

- Le valute supportate sono impostate in `Impostazioni` nella barra laterale.
- Di default sono abilitate `EUR` e `CHF`.
- La valuta base può essere scelta tra le valute abilitate.
- Il backup cloud può essere configurato con Google Drive, Dropbox o OneDrive.

## Istruzioni backup cloud

<details>
<summary>Dropbox</summary>

1. Vai su https://www.dropbox.com/developers/apps.
2. Clicca su `Create app`.
3. Scegli `Scoped access`.
4. Scegli `App folder` se vuoi limitare l'accesso a una cartella, oppure `Full Dropbox` se vuoi accesso a tutto l'account.
5. Dai un nome alla tua app e clicca `Create app`.
6. Nella sezione `Permissions`, abilita i permessi `files.content.read` e `files.content.write`.
7. Salva le modifiche.
8. Vai nella sezione `Settings` o `OAuth 2` dell'app.
9. Nella sezione `Generated access token`, crea un `Access Token`.
10. Copia il token generato.
11. Nelle impostazioni di PocketBloom seleziona `Dropbox`, incolla l'`Access Token` e imposta il `Percorso backup` (es. `/pocketbloom-backup.json`).
12. Vai su `Backup` per caricare o scaricare i dati da Dropbox.
13. Se abiliti `Backup automatico`, PocketBloom invierà i dati a Dropbox ad ogni salvataggio.

> Nota: Dropbox usa un access token che può rimanere valido a lungo, ma se lo revoci o lo disabiliti dovrai generarne uno nuovo.
</details>

<details>
<summary>Google Drive</summary>

1. Vai su https://console.cloud.google.com e crea un nuovo progetto.
2. Abilita l'API `Google Drive API` per il progetto.
3. Crea credenziali OAuth 2.0: `OAuth client ID`.
   - Tipo app: `Desktop app` o `Web application`.
   - Inserisci un redirect URI se richiesto (per il Playground puoi usare `https://developers.google.com/oauthplayground`).
4. Salva `Client ID` e `Client Secret`.
5. Usa Google OAuth Playground: https://developers.google.com/oauthplayground
   - In `Step 1` seleziona `Drive API v3` -> `https://www.googleapis.com/auth/drive.file`.
   - Clicca `Authorize APIs` e accedi con il tuo account Google.
   - Clicca `Exchange authorization code for tokens`.
6. Copia il valore di `Access token` e `Refresh token`.
7. Nelle impostazioni di PocketBloom seleziona `Google Drive`, incolla `Access Token`, `Refresh Token`, `Client ID`, e `Client Secret`.
8. Imposta il `Percorso backup` con il nome del file in Drive, ad esempio `/pocketbloom-backup.json`.
9. Usa la pagina `Backup` per scaricare o caricare i dati.

> Nota: l'`Access Token` scade dopo poco tempo. PocketBloom userà il `Refresh Token` e il `Client ID` (eventualmente il `Client Secret`) per recuperare un nuovo access token automaticamente.
</details>

<details>
<summary>OneDrive</summary>

1. Vai su https://portal.azure.com e registra un'app nella sezione `App registrations`.
2. Crea un `Web` o `Public client/native` app.
3. Aggiungi le autorizzazioni delegated:
   - `Files.ReadWrite.All`
   - `offline_access`
   - `openid`
   - `profile`
   - `email`
4. Genera un `Client secret` se necessario.
5. Usa un flusso OAuth 2.0 per ottenere token:
   - Usa l'URL di autorizzazione Microsoft per ottenere un codice di autorizzazione.
   - Scambia il codice con `access_token` e `refresh_token` usando il token endpoint Microsoft.
6. Nelle impostazioni di PocketBloom seleziona `OneDrive`, incolla `Access Token`, `Refresh Token`, `Client ID` e `Client Secret`.
7. Imposta il `Percorso backup` come `pocketbloom-backup.json` o simile.
8. Vai su `Backup` per scaricare o caricare i dati.

> Nota: PocketBloom rinnoverà automaticamente l'access token con il refresh token quando disponibile.
</details>
