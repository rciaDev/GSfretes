"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type User = {
    token: string
    codigo: string
    cnpj: string
    nome: string
    email: string
} | null

type AuthContextType = {
    user: User
    login: (userData: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(null)
    const router = useRouter()

    // Carregar usuário do localStorage ao iniciar
    useEffect(() => {
        const storedUser = localStorage.getItem("gsfretes_user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    // Função para login
    const login = (userData: User) => {
        if (!userData) return
        setUser(userData)
        localStorage.setItem("gsfretes_user", JSON.stringify(userData))
    }

    // Função para logout
    const logout = () => {
        setUser(null)                      // Reseta estado do contexto
        localStorage.removeItem("gsfretes_user") // Remove dados salvos do localStorage
        Cookies.remove("token")            // Remove o cookie usado pelo middleware
        router.push("/")              // Redireciona para tela de login
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook para usar o contexto
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider")
    }
    return context
}
