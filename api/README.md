# Yahoo Finance Proxy

Semplice funzione serverless per Vercel che fa da proxy verso Yahoo Finance e evita 429/CORS.

## Installazione

```bash
cd yahoo-proxy
npm install
```

## Esecuzione locale

```bash
npm run dev
```

## Endpoints

`GET /api/yahoo?ticker=EIMI.MI`

## Deploy su Vercel

```bash
npm i -g vercel
vercel
```

Dopo il deploy avrai un URL del tipo:

`https://tuo-progetto.vercel.app/api/yahoo?ticker=EIMI.MI`
