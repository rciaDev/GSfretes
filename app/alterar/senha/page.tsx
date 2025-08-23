"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import api from "@/app/services/api"

export default function AlterarSenhaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [senha, setSenha] = useState("")
  const [confirmaSenha, setConfirmaSenha] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setMensagem("Token inválido ou não informado.")
      return
    }

    if (senha !== confirmaSenha) {
      setMensagem("As senhas não coincidem.")
      return
    }

    try {
      setLoading(true)
      const response = await api.post("/alterar-senha", {
        token,
        senha,
        confirmasenha: confirmaSenha,
      })

      if (response.data.erro === 0) {
        setMensagem("Senha alterada com sucesso!")
      } else {
        setMensagem(response.data.mensagem || "Erro ao alterar senha.")
      }
    } catch (error: any) {
      setMensagem(error.response?.data?.mensagem || "Erro inesperado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">Alterar Senha</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmaSenha}
          onChange={(e) => setConfirmaSenha(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Alterando..." : "Confirmar"}
        </button>
      </form>
      {mensagem && <p className="mt-4 text-center">{mensagem}</p>}
    </div>
  )
}


// "use client"

// import { Suspense } from "react"
// import FormAlterarSenha from "./recuperarSenha"

// export default function Page() {
//   return (
//     <Suspense fallback={<p>Carregando...</p>}>
//       <FormAlterarSenha />
//     </Suspense>
//   )
// }
