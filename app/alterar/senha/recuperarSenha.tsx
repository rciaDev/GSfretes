"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast" // ajuste conforme sua implementação de toast
import api from "@/app/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
                router.push("/")
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

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Alterar senha</CardTitle>
                    <CardDescription>Preencha os campos para alterar seua senha.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4" >
                        <Input
                            type="password"
                            placeholder="Nova senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            // className="w-full border p-2 rounded"
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Confirme a nova senha"
                            value={confirmaSenha}
                            onChange={(e) => setConfirmaSenha(e.target.value)}
                            // className="w-full border p-2 rounded"
                            required
                        />
                        <Button
                            type="submit"
                            disabled={loading}
                            // className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? "Alterando..." : "Confirmar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
