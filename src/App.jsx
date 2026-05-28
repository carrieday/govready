export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { type, ...body } = req.body;

  if (type === 'sam') {
    const { apiKey, fromStr, toStr } = body;
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${apiKey}&limit=50&postedFrom=${fromStr}&postedTo=${toStr}&naics=541611&active=true`;
    const r = await fetch(url);
    const text = await r.text();
    res.status(r.status).send(text);
    return;
  }

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  res.status(200).json(data);
}
