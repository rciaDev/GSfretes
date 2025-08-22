"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"
import axios from "axios"
import api from "@/app/services/api"
import { formataCelular } from "@/app/global/funcoes"

export default function RegisterForm() {
    const [registerData, setRegisterData] = useState({
        cnpj: "",
        nome: "",
        fantasia: "",
        email: "",
        celular: "",
        senha: "",
    })
    const router = useRouter()
    const { toast } = useToast()
    const [showPassword, setShowPassword] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await api.post("/api/cadastro", {
                cnpj: registerData.cnpj,  // remove máscara
                nome: registerData.nome.trim().toUpperCase(),
                fantasia: registerData.fantasia.trim().toUpperCase(),
                email: registerData.email.trim().toLowerCase(),
                senha: registerData.senha,
                celular: registerData.celular.replace(/\D/g, ""), // remove máscara
            });


            console.log("response", response)

            const data = response.data

            console.log("data", data)

            if (data.erro === 0) {
                toast({
                    title: "Sucesso",
                    description: data.mensagem || "Empresa cadastrada com sucesso!",
                })
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);

            } else {
                toast({
                    title: "Erro",
                    description: data.mensagem || "Erro ao cadastrar empresa.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao conectar à API de cadastro.",
            })
        }
    }

    const buscaDadosReceita = async () => {
        const doc = registerData.cnpj.replace(/\D/g, "");

        if (doc.length !== 11 && doc.length !== 14) return;

        try {
            const res = await fetch(`/api/cnpj?cnpj=${doc}`);
            const data = await res.json();

            // Caso CPF → manual
            if (data.tipo === "CPF") {
                toast({
                    title: "CPF detectado",
                    description: "Cadastro via CPF, preencha manualmente os campos.",
                });
                return;
            }

            // Caso aviso (CNPJ não encontrado na BrasilAPI)
            if (data.aviso) {
                toast({
                    title: "Aviso",
                    description: data.aviso,
                });
                return;
            }

            // **Só preenche se realmente houver razão social ou nome fantasia**
            if (data.razao_social || data.nome_fantasia) {
                setRegisterData((prev) => ({
                    ...prev,
                    nome: data.razao_social || prev.nome,
                    fantasia: data.nome_fantasia || prev.fantasia,
                }));

                toast({
                    title: "Dados carregados",
                    description: "Informações do CNPJ preenchidas automaticamente.",
                });
            } else {
                // Se não veio dado nenhum, mostra aviso
                toast({
                    title: "Aviso",
                    description: "Nenhuma informação encontrada para este CNPJ. Preencha manualmente.",
                });
            }
        } catch (err) {
            toast({
                title: "Erro",
                description: "Não foi possível buscar dados do documento.",
            });
        }
    };




    return (
        <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ/CPF</Label>
                <Input
                    id="cnpj"
                    placeholder="CPF ou CNPJ"
                    value={registerData.cnpj}
                    onChange={(e) => setRegisterData({ ...registerData, cnpj: e.target.value })}
                    required
                    onBlur={buscaDadosReceita}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                    id="nome"
                    placeholder="Razão Social"
                    value={registerData.nome}
                    onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="fantasia">Nome Fantasia</Label>
                <Input
                    id="fantasia"
                    placeholder="Nome Fantasia"
                    value={registerData.fantasia}
                    onChange={(e) => setRegisterData({ ...registerData, fantasia: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                    id="register-email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                    id="celular"
                    placeholder="(00) 00000-0000"
                    value={formataCelular(registerData.celular)} // exibe formatado
                    onChange={(e) =>
                        setRegisterData({
                            ...registerData,
                            celular: e.target.value.replace(/\D/g, ""),
                        })
                    }
                    required
                />

            </div>
            <div className="space-y-2 relative">
                <Label htmlFor="register-senha">Senha</Label>
                <div className="relative">
                    <Input
                        id="register-senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerData.senha}
                        onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                        required
                        className="pr-10" // cria espaço para o botão
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <Button type="submit" className="w-full">
                Cadastrar
            </Button>
        </form>
    )
}
