
"use client"

import { Suspense } from "react"
import AlterarSenhaPage from "./recuperarSenha"

export default function Page() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <AlterarSenhaPage />
    </Suspense>
  )
}
