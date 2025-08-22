import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // garante que slug é array de strings
    const { slug } = req.query;
    const slugArray = Array.isArray(slug) ? slug : [slug].filter(Boolean);

    const backendUrl = `http://api-gsfretes.rcia.com.br/${slugArray.join("/")}`;

    // transforma req.headers em Record<string, string>
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }
    headers["host"] = "api-gsfretes.rcia.com.br";
    if (req.method !== "GET") headers["content-type"] = "application/json";

    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch {
      res.status(response.status).send(text);
    }
  } catch (err) {
    console.error("Erro no proxy:", err);
    res.status(500).json({ error: "Erro no proxy" });
  }
}
