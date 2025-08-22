"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Truck, Package, Users, FileText, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/app/services/api"

type Frete = {
  id: string | number
  cliente?: string
  origem?: string
  destino?: string
  seqfin?: string | number
  valor?: number
  status?: "pago" | "pendente" | string
  data?: string
}
type FreteAPI = {
  codigo: string | number
  nome?: string
  origem?: string
  destino?: string
  seqfin?: string | number
  valor?: string | number
  formapg?: string
  data?: string
}
type Recebimento = {
  codigo?: string
  parcela?: string
  item?: string
  data?: string // "DD.MM.YYYY"
  recebido?: string | number
  acrescimo?: string | number
  multa?: string | number
  juros?: string | number
  descontos?: string | number
  obs?: string
}

function parseNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(",", "."); // só troca vírgula por ponto
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function parseDotDate(d?: string): Date | null {
  if (!d) return null
  const m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return isNaN(dt.getTime()) ? null : dt
}
function isSameMonthDotDate(d?: string): boolean {
  const dt = parseDotDate(d)
  if (!dt) return false
  const now = new Date()
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recentFretes, setRecentFretes] = useState<Frete[]>([])
  const [totalFretes, setTotalFretes] = useState<number>(0)
  const [fretesAtivos, setFretesAtivos] = useState<number>(0) // = recebimentos.length
  const [totalClientes, setTotalClientes] = useState<number>(0) // mantém card; se não tiver endpoint, fica 0
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rawUser = localStorage.getItem("gsfretes_user") || "{}"
        const { token } = JSON.parse(rawUser)
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined

        const fretesRes = await api.post(
          "/api/fretes-lista",
          { condicao: "", ordem: "CODIGO" },
          { headers }
        )
        
        console.log("freteres", fretesRes)

        const dadosFrete: FreteAPI[] = Array.isArray(fretesRes?.data)
          ? fretesRes.data
          : fretesRes?.data?.itens ?? []

          console.log("dadosfrete", dadosFrete)

        // mapeia igual seu exemplo
        const fretesMapped: Frete[] = dadosFrete.map((f) => ({
          id: f.codigo,
          cliente: f.nome,
          origem: f.origem,
          destino: f.destino,
          seqfin: f.seqfin,
          valor: parseNumber(f.valor),
          status: f.formapg === "PRAZO" ? "pago" : "pendente",
          data: f.data,
        }))

        const parseCodigo = (x: FreteAPI | Frete) =>
          Number(String("codigo" in x ? x.codigo : x.id).replace(/\D/g, "")) || 0
        fretesMapped.sort((a, b) => parseCodigo(b as any) - parseCodigo(a as any))

        let recs: Recebimento[] = []
        try {
          const r1 = await api.post(
            "/api/recebimentos-lista",
            { condicao: "", ordem: "CODIGO" },
            { headers }
          )
          recs = Array.isArray(r1?.data) ? r1.data : r1?.data?.itens ?? []
        } catch {
          const r2 = await api.get(
            "/api/recebimentos-lista",
            { headers }
          )
          recs = Array.isArray(r2?.data) ? r2.data : r2?.data?.itens ?? []
        }

        let totalCli = 0
        try {
          const { token } = JSON.parse(localStorage.getItem("gsfretes_user") || "{}")
          const headers = token ? { Authorization: `Bearer ${token}` } : undefined

          const resp = await api.post(
            "/api/cliente-lista",                 
            { condicao: "ID>0", ordem: "NOME" },  
            { headers }
          )

          const payload = resp?.data
          const itens = Array.isArray(payload) ? payload : (payload?.itens ?? [])
          totalCli = itens.length      

        } catch (e) {
          console.error("clientes-lista erro:",e)
          totalCli = 0
        }

        setTotalClientes(totalCli)


        if (!mounted) return
        setRecentFretes(fretesMapped.slice(0, 5))
        setTotalFretes(fretesMapped.length)
        setRecebimentos(recs)
        setFretesAtivos(recs.length)
        setTotalClientes(totalCli)
      } catch (e: any) {
        console.error(e)
        if (!mounted) return
        const msg =
          e?.response?.data?.mensagem ||
          e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar dados do dashboard."
        setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])
  function parseMoney(v: unknown): number {
    if (v === null || v === undefined) return 0
    if (typeof v === "number") return v
    const s = String(v).trim()

    if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s)

    if (/^\d+(,\d+)?$/.test(s)) return parseFloat(s.replace(",", "."))

    return Number(s.replace(/\./g, "").replace(",", ".")) || 0
  }


  const faturamentoMes = useMemo(() => {
    if (!recebimentos?.length) return 0
    return recebimentos
      .filter((r) => isSameMonthDotDate(r.data))  
      .reduce((acc, r) => acc + parseMoney(r.recebido), 0)
  }, [recebimentos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio de fretes</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/fretes/novo">
            <Truck className="mr-2 h-4 w-4" />
            Novo Frete
          </Link>
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fretes</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : totalFretes.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Número acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fretes Recebidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : fretesAtivos.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Total de recebimentos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : totalClientes.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : `R$ ${faturamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground">Soma dos recebimentos do mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
          <Link href="/dashboard/fretes/novo">
            <Truck className="h-6 w-6 mb-2" />
            Novo Frete
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
          <Link href="/dashboard/produtos">
            <Package className="h-6 w-6 mb-2" />
            Gerenciar Produtos
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
          <Link href="/dashboard/clientes">
            <Users className="h-6 w-6 mb-2" />
            Gerenciar Clientes
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
          <Link href="/dashboard/romaneios">
            <FileText className="h-6 w-6 mb-2" />
            Gerar Romaneio
          </Link>
        </Button>
      </div>

      {/* Fretes Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Fretes Recentes</CardTitle>
          <CardDescription>Últimos fretes cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentFretes.map((f, idx) => {
                const cliente = f.cliente ?? "—"
                const destino = f.destino ?? "—"
                const valor = f.valor ?? 0
                const codigo = String(f.id ?? idx)

                return (
                  <div key={codigo} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{cliente}</p>
                      <p className="text-sm text-muted-foreground">{destino}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">
                        R$ {Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {/* você pode reativar a badge se voltar a usar STATUS */}
                    </div>
                  </div>
                )
              })}
              {!recentFretes.length && (
                <p className="text-sm text-muted-foreground">Nenhum frete encontrado.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
