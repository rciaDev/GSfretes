"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Package, Users, FileText } from "lucide-react"
import LoginForm from "@/components/auth/LoginForm"
import RegisterForm from "@/components/auth/RegisterForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">GsFretes</h1>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            Sistema Completo de Gestão de Fretes
          </h2>

          <p className="text-xl text-gray-600 leading-relaxed">
            Controle total dos seus fretes, clientes e mercadorias em uma plataforma moderna e intuitiva.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Package className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Gestão de Produtos</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Users className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Controle de Clientes</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <FileText className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Romaneios Digitais</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Truck className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Controle de Fretes</span>
            </div>
          </div>
        </div>

        {/* Login/Register Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
            <CardDescription>Entre ou cadastre-se para começar a usar o GsFretes</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
