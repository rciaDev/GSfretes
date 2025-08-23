"use client"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function FormAlterarSenha() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [senha, setSenha] = useState("")
  const [confirmasenha, setConfirmasenha] = useState("")
  const [mensagem, setMensagem] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const resp = await fetch("/api/alterar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha, confirmasenha }),
    })
    const data = await resp.json()
    setMensagem(data.mensagem)
  }

  if (!token) return <p>Token inválido.</p>

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow rounded bg-white">
      <h1 className="text-xl font-bold mb-4">Redefinir Senha</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmasenha}
          onChange={(e) => setConfirmasenha(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-green-600 text-white p-2 rounded">
          Alterar senha
        </button>
      </form>
      {mensagem && <p className="mt-4">{mensagem}</p>}
    </div>
  )
}
