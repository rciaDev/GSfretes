"use client"

import { Suspense } from "react"
import FormAlterarSenha from "./recuperarSenha"

export default function Page() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <FormAlterarSenha />
    </Suspense>
  )
}
