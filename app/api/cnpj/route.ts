import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const doc = searchParams.get("cnpj")?.replace(/\D/g, "");

    if (!doc || (doc.length !== 11 && doc.length !== 14)) {
        return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 });
    }

    // Se for CPF
    if (doc.length === 11) {
        return NextResponse.json({ tipo: "CPF", mensagem: "Cadastro via CPF. Preencha manualmente." });
    }

    try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`);
        console.log(res)
        const data = await res.json();

        // Se a BrasilAPI disser que é inválido, mas queremos continuar manual
        if (!res.ok) {
            return NextResponse.json(
                { tipo: "CNPJ", aviso: data.message || "Serviço de CNPJ indisponível. Preencha manualmente." },
                { status: res.status }
            );
        }


        // Retorna dados encontrados
        return NextResponse.json({ tipo: "CNPJ", ...data });
    } catch (error) {
        return NextResponse.json(
            { error: "Erro interno ao consultar CNPJ.", detalhes: String(error) },
            { status: 500 }
        );
    }
}
