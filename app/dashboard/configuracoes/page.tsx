"use client"

import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function Configuracao() {
  const { toast } = useToast()

  // Estado para senha
  const [senha, setSenha] = useState("")
  const [confirmaSenha, setConfirmaSenha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação simples
    if (!senha || !confirmaSenha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    if (senha !== confirmaSenha) {
      toast({
        title: "Erro",
        description: "As senhas não conferem",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Recupera token salvo no localStorage (ajuste se precisar pegar de outro lugar)
      const user = JSON.parse(localStorage.getItem("gsfretes_user") || "{}")
      const token = user?.token

      if (!token) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        })
        return
      }

      // Chamada para API
      const response = await axios.post("/api/alterar-senha", {
        token,
        senha,
        confirmasenha: confirmaSenha,
      })

      const data = response.data

      if (data.erro === 0) {
        toast({
          title: "Sucesso",
          description: data.mensagem,
        })
        setSenha("")
        setConfirmaSenha("")
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível alterar a senha",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao conectar à API de alteração de senha",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tela de configurações</CardTitle>
        <CardDescription>Configure as informações do seu sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-[300px]">
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
