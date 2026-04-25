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
- Il backup cloud può essere configurato con Dropbox tramite login OAuth.

## Istruzioni backup cloud

PocketBloom usa ora un unico flusso Dropbox con login OAuth e refresh token.
Non serve più copiare manualmente un access token.

<details>
<summary>Dropbox</summary>

1. Vai su https://www.dropbox.com/developers/apps.
2. Clicca su `Create app`.
3. Scegli `Scoped access`.
4. Scegli `App folder` se vuoi limitare l'accesso a una cartella dedicata all'app, oppure `Full Dropbox` se vuoi accesso completo.
5. Dai un nome alla tua app e clicca `Create app`.
6. Vai nella sezione `Settings` e aggiungi il redirect URI:
   - `https://pocketbloom.netlify.app/impostazioni`
7. Se usi PocketBloom in locale, aggiungi anche:
   - `http://localhost:5173/impostazioni`
8. Copia l'`App key` della tua app.
9. In PocketBloom vai su `Impostazioni`, incolla l'`App Key Dropbox` e clicca `Connetti a Dropbox`.
10. Autorizza l'app quando richiesto da Dropbox.
11. Imposta il `Percorso backup` (es. `/pocketbloom-backup.json`) e salva.
12. Vai su `Backup` per caricare o scaricare i dati da Dropbox.

> Nota: PocketBloom salverà il `refresh token` e rinnoverà automaticamente l'access token quando scade.
</details>
