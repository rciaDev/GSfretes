import type { NextApiRequest, NextApiResponse } from "next";
import fetch, { type RequestInit as NodeFetchRequestInit } from "node-fetch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { slug } = req.query;
    const slugArray = Array.isArray(slug) ? slug : [slug].filter(Boolean);
    const backendUrl = `http://api-gsfretes.rcia.com.br/${slugArray.join("/")}`;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      headers["content-type"] = "application/json";
    }

    const fetchOptions: NodeFetchRequestInit = {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    };

    const response = await fetch(backendUrl, fetchOptions);
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
