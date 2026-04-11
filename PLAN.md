# Piano di sviluppo PocketBloom

## Stato attuale

- Pagina `Impostazioni` disponibile nella sidebar
- Impostazioni persistenti tramite store Pinia e localStorage
- Valute di default supportate: `EUR`, `CHF`
- Possibilità di scegliere la valuta base e le valute disponibili in `Impostazioni`
- Backup cloud configurabile: `Google Drive`, `Dropbox`, `OneDrive`
- Backup locale già supportato con esportazione/importazione JSON

## Componenti principali implementati

- `Dashboard`
- `Conti` (gestione conti multi-valuta)
- `Entrate` (registrazione entrate multi-valuta)
- `Investimenti` (gestione asset multi-valuta)
- `Impostazioni` (base currency, valute supportate, provider cloud, backup automatico)
- `Backup` (esportazione/importazione JSON)

## Prossimi passi

1. Implementare sincronizzazione cloud reale per provider selezionati
2. Aggiungere gestione delle categorie personalizzate
3. Supportare conversione automatica tra valute
4. Aggiungere grafici di andamento e riepiloghi finanziari
5. Test di integrazione e copertura automatica
