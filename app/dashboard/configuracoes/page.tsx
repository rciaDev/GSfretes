"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/app/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// Função utilitária para obter o token
function getAuthToken(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem("gsfretes_user") || "{}")
    return user?.token || null
  } catch {
    return null
  }
}

export default function AlterarSenhaPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [senha, setSenha] = useState("")
  const [confirmaSenha, setConfirmaSenha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!senha || !confirmaSenha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    if (senha !== confirmaSenha) {
      toast({
        title: "Erro",
        description: "As senhas não conferem.",
        variant: "destructive",
      })
      return
    }

    const token = getAuthToken()
    console.log("token",token)

    if (!token) {
      toast({
        title: "Erro",
        description: "Token não encontrado. Faça login novamente.",
        variant: "destructive",
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

      const { erro, mensagem } = response.data

      if (erro === 0) {
        toast({
          title: "Sucesso",
          description: mensagem || "Senha alterada com sucesso!",
        })
        router.push("/")
      } else {
        toast({
          title: "Erro",
          description: mensagem || "Não foi possível alterar a senha.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erro de servidor",
        description: "Não foi possível conectar à API de alteração de senha.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>Digite sua nova senha abaixo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-[300px]">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Digite a nova senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmasenha">Confirmar Senha</Label>
            <Input
              id="confirmasenha"
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Alterando..." : "Alterar Senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
