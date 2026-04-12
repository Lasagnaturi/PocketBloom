export default async function handler(req, res) {
  const { ticker } = req.query

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker mancante' })
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Errore nella chiamata a Yahoo Finance' })
    }

    const data = await response.json()
    const result = data?.quoteResponse?.result?.[0]

    if (!result) {
      return res.status(404).json({ error: 'Nessun dato trovato' })
    }

    return res.status(200).json({
      symbol: result.symbol,
      price: result.regularMarketPrice,
      currency: result.currency,
      name: result.shortName,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Errore server' })
  }
}
