"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast" // ajuste conforme sua implementação de toast
import api from "@/app/services/api"

export default function AlterarSenhaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()

  const [senha, setSenha] = useState("")
  const [confirmaSenha, setConfirmaSenha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (senha !== confirmaSenha) {
      toast({
        title: "Erro",
        description: "As senhas não conferem.",
      })
      return
    }

    setLoading(true)

    try {
      const response = await api.post("/api/alterar-senha", {
        token,
        senha,
        confirmasenha: confirmaSenha,
      })

      const data = response.data

      if (data.erro === 0) {
        toast({
          title: "Sucesso",
          description: data.mensagem || "Senha alterada com sucesso!",
        })
        router.push("/login")
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível alterar a senha.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de servidor",
        description: "Não foi possível conectar à API de alteração de senha.",
      })
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
    </div>
  )
}
