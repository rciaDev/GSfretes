import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = searchParams.get("cep")?.replace(/\D/g, "");

  if (!cep || cep.length !== 8) {
    return NextResponse.json(
      { error: "CEP inválido." },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      `https://viacep.com.br/ws/${cep}/json/`
    );
    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Erro ao buscar CEP:", err.message);
    return NextResponse.json(
      { error: "Erro ao buscar CEP." },
      { status: 500 }
    );
  }
}
