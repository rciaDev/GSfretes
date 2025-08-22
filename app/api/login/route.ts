// import { NextResponse } from "next/server"

// export async function POST(request: Request) {
//   const body = await request.json()

//   // Mock simples: aceita qualquer login e senha que não sejam vazios
//   if (body.login && body.senha) {
//     return NextResponse.json({
//       erro: 0,
//       mensagem: "Usuário autenticado com sucesso",
//       token: "fakeToken123",
//       codigo: "1",
//       cnpj: "17.589.266/0001-14",
//       nome: "HRSOFT SISTEMAS LTDA",
//     })
//   }

//   return NextResponse.json(
//     { erro: 1, mensagem: "Credenciais inválidas" },
//     { status: 400 }
//   )
// }
