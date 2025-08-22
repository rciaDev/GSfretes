"use client"

import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Informe seu e-mail para continuar.",
      })
      return
    }

    setLoading(true)

    try {
      const response = await axios.post("/api/recuperar-senha", {
        login: email,
      })

      const data = response.data

      if (data.erro === 0) {
        // Sucesso
        setEnviado(true)
      } else {
        // Erro vindo da API
        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível enviar o e-mail de recuperação.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de servidor",
        description: "Estamos com dificuldados internas.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu e-mail para receber o link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!enviado ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Recuperar senha"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Voltar ao login
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-lg font-medium">Solicitação enviada com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Verifique seu e-mail para as instruções de redefinição de senha.
              </p>
              <Button className="mt-4" onClick={() => router.push("/")}>
                Voltar ao login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
