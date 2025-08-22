"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import api from "@/app/services/api"
import { useAuth } from "@/context/AuthContext"
import Cookies from "js-cookie"

export default function LoginForm() {
  const [loginData, setLoginData] = useState({ email: "", senha: "" })
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await api.post("/api/login", {
        login: loginData.email,
        senha: loginData.senha,
      })

      console.log(response);

      const data = response.data

      if (data.erro === 0) {
        login({
          token: data.token,
          codigo: data.codigo,
          cnpj: data.cnpj,
          nome: data.nome,
          email: loginData.email,
        })

        console.log("login", data)
        Cookies.set("token", data.token, { expires: 7 })

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        })

        router.push("/dashboard")
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Falha na autenticação",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de servidor",
        description: "Não foi possível conectar à API de login.",
      })
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          placeholder="••••••••"
          value={loginData.senha}
          onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Entrar
      </Button>
      <Link
        href="/esqueceuSenha"
        className="inline-block text-sm underline-offset-0 hover:underline ml-auto text-right"
      >
        Esqueceu sua senha?
      </Link>
    </form>
  )
}
