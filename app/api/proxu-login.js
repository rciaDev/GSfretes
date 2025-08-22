import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const response = await fetch('http://api-gsfretes.rcia.com.br/api/login', {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'api-gsfretes.rcia.com.br', // opcional
      },
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no proxy' });
  }
}
