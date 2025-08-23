import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || null

  // Rotas públicas
  const publicRoutes = ["/", "/esqueceuSenha", "/alterar/senha"]

  // Se a rota não é pública e não tem token → redireciona para login
  if (!publicRoutes.includes(request.nextUrl.pathname) && !token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protege todas as rotas, exceto api e arquivos estáticos
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
