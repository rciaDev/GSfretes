'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import api from '@/app/services/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

/* =========================
   Tipos (contratos do backend)
   ========================= */
interface Receita {
    codigo: string
    parcela: string
    cliente: string
    nome: string
    documento: string
    data: string            // "dd.MM.yyyy HH:mm:ss"
    vencimento: string      // "dd.MM.yyyy"
    valor: string           // numérico em string
    vrbaixado: string       // numérico em string
    obs: string
}

type Recebimento = {
    codigo: string
    parcela: string
    item: string
    data: string            // "dd.MM.yyyy"
    recebido: string        // numérico em string
    acrescimo: string
    multa: string
    juros: string
    descontos: string
    obs: string
}

type RecebimentoEnriquecido = Recebimento & {
    nome?: string
    documento?: string
}

/* =========================
   Utils
   ========================= */
const moedaBR = (v: number | string) =>
    `R$ ${(Number(v || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const hojeISO = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}` // input[type=date]
}

// yyyy-MM-dd -> dd.MM.yyyy
const toBR = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
}

// parse seguro de token
const readToken = () => {
    try {
        const raw = localStorage.getItem('gsfretes_user')
        if (!raw) return ''
        const obj = JSON.parse(raw)
        return obj?.token || ''
    } catch {
        return ''
    }
}

/* =========================
   API helpers
   ========================= */
async function apiReceitasLista(token: string, situacao: 'GERAL' | 'PENDENTES') {
    const cfg = { headers: { Authorization: `Bearer ${token}` } }
    const body = { condicao: '', situacao, ordem: '' }
    const r = await api.post('/api/receitas-lista', body, cfg)
    return Array.isArray(r.data) ? (r.data as Receita[]) : []
}


async function apiRecebimentosRegistra(
    token: string,
    payload: {
        codigo: string
        parcela: string
        item: string
        data: string       // dd.MM.yyyy
        recebido: string   // "123.45"
        acrescimo: string
        multa: string
        juros: string
        descontos: string
        obs: string
    }
) {
    const cfg = { headers: { Authorization: `Bearer ${token}` } };
    const r = await api.post('/api/recebimentos-registra', payload, cfg);
    return r.data;
}

// saldo = valor - vrbaixado (todos vêm como string)
const calcularSaldo = (r: Receita) =>
    Math.max(0, Number(r.valor || 0) - Number(r.vrbaixado || 0))


async function apiRecebimentosLista(token: string, condicao = '', ordem = 'CODIGO') {
    const cfg = { headers: { Authorization: `Bearer ${token}` } }
    const body = { condicao, ordem }
    const r = await api.post('/api/recebimentos-lista', body, cfg)
    return Array.isArray(r.data) ? (r.data as Recebimento[]) : []
}

async function proximoItemRecebimento(token: string, codigo: string) {
    const itens = await apiRecebimentosLista(token, `CODIGO=${codigo}`, 'ITEM')
    const max = itens.reduce((acc, it: any) => Math.max(acc, Number(it.item || 0)), 0)
    return String(max + 1)
}


/* =========================
   Componente
   ========================= */
export default function Financeiro() {
    const { toast } = useToast()

    // dados
    const [geral, setGeral] = useState<Receita[]>([])
    const [pendentes, setPendentes] = useState<Receita[]>([])
    const [recebidos, setRecebidos] = useState<RecebimentoEnriquecido[]>([])
    const [carregando, setCarregando] = useState(true)

    // modal baixa
    const [open, setOpen] = useState(false)
    const [selecionada, setSelecionada] = useState<Receita | null>(null)
    const [valorRecebido, setValorRecebido] = useState<string>('')
    const [dataRecebimento, setDataRecebimento] = useState<string>('')
    const [motivo, setMotivo] = useState<string>('')
    const [salvando, setSalvando] = useState(false)

    const [confOpen, setConfOpen] = useState(false);
    const [rcSelecionado, setRcSelecionado] = useState<RecebimentoEnriquecido | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    const [dataInicio, setDataInicio] = useState<string>('');
    const [dataFim, setDataFim] = useState<string>('');


    async function carregarGeral(searchTerm: string = "") {
        try {
            let condicao = '';
            if (searchTerm.trim()) {
                const termo = searchTerm.toUpperCase();
                condicao = `(NOME LIKE '${termo} OR DOCUMENTO LIKE '${termo}' OR VALOR LIKE '${termo}')`
            }

            const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

            const res = await api.post(
                "/api/receitas-lista",
                { condicao, ordem: "CODIGO DESC" },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )



            const dados: Receita[] = res.data;

            const mapped = dados.map((f) => ({
                codigo: f.codigo,
                cliente: f.cliente,
                data: f.data,
                documento: f.documento,
                nome: f.nome,
                obs: f.obs,
                parcela: f.parcela,
                valor: f.valor,
                vencimento: f.vencimento,
                vrbaixado: f.vrbaixado
            }))


        } catch {

        }
    }


    const handleBuscarGeral = () => {
        carregarGeral(searchTerm);
    }


    // evitar efeito duplo no dev
    const ranOnce = useRef(false)

    // totais
    const totalGeral = useMemo(
        () => geral.reduce((acc, r) => acc + Number(r.valor || 0), 0),
        [geral]
    )
    const totalPend = useMemo(
        () => pendentes.reduce((acc, r) => acc + Number(r.valor || 0), 0),
        [pendentes]
    )
    const totalReceb = useMemo(
        () => recebidos.reduce((acc, rc) => acc + Number(rc.recebido || 0), 0),
        [recebidos]
    )

    async function fetchTudo() {
        try {
            setCarregando(true)
            const token = readToken()
            if (!token) throw new Error('Token não encontrado')

            const [arrGeral, arrPend, arrRec] = await Promise.all([
                apiReceitasLista(token, 'GERAL'),
                apiReceitasLista(token, 'PENDENTES'),
                apiRecebimentosLista(token),
            ])

            setGeral(arrGeral)
            setPendentes(arrPend)

            // índice por "codigo-parcela" com dados de geral + pendentes
            const idx = new Map<string, { nome?: string; documento?: string }>()
            for (const r of [...arrGeral, ...arrPend]) {
                idx.set(`${r.codigo}-${r.parcela}`, { nome: r.nome, documento: r.documento })
            }

            const recebidosEnriquecidos: RecebimentoEnriquecido[] = arrRec.map((rc) => ({
                ...rc,
                ...(idx.get(`${rc.codigo}-${rc.parcela}`) || {}),
            }))

            setRecebidos(recebidosEnriquecidos)
        } catch (e: any) {
            console.error('Financeiro fetchTudo erro:', e?.response?.status, e?.response?.data || e?.message)
            toast({ title: 'Erro', description: 'Falha ao carregar dados do financeiro.', variant: 'destructive' })
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        if (ranOnce.current) return
        ranOnce.current = true
        fetchTudo()
    }, [])

    function abrirConfirmacao(r: Receita) {
        setSelecionada(r)
        const saldo = calcularSaldo(r)
        setValorRecebido(saldo.toFixed(2))       // sugere só o que falta
        setDataRecebimento(hojeISO())
        setMotivo('')
        setOpen(true)
    }

    function Excluir(rc: RecebimentoEnriquecido) {
        setRcSelecionado(rc);
        setConfOpen(true);
    }

    async function apiRecebimentosExclui(token: string, codigo: string, parcela: string, item: string) {
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        const body = { codigo, parcela, item };
        await api.post("/api/recebimentos-exclui", body, cfg);
    }


    async function confirmarExclusao() {
        if (!rcSelecionado) return;
        try {
            setExcluindo(true);
            const token = readToken();
            if (!token) throw new Error("Token não encontrado");

            await apiRecebimentosExclui(token, rcSelecionado.codigo, rcSelecionado.parcela, rcSelecionado.item);
            // Atualiza a lista (removendo localmente pra parecer instantâneo)
            setRecebidos((prev) =>
                prev.filter(
                    (r) =>
                        !(
                            r.codigo === rcSelecionado.codigo &&
                            r.parcela === rcSelecionado.parcela &&
                            r.item === rcSelecionado.item
                        )
                )
            );
            // E atualiza tudo do servidor (garantia de consistência)
            await fetchTudo();

            toast({ title: "Baixa excluída", description: "Operação realizada com sucesso." });
        } catch (e: any) {
            console.error("Excluir baixa erro:", e?.response?.status, e?.response?.data || e?.message);
            toast({
                title: "Erro ao excluir",
                description: e?.response?.data?.mensagem || "Falha na comunicação com o servidor.",
                variant: "destructive",
            });
        } finally {
            setExcluindo(false);
            setConfOpen(false);
            setRcSelecionado(null);
        }
    }

    async function confirmarBaixa() {
        if (!selecionada) return

        const valor = Number(valorRecebido)
        const saldo = calcularSaldo(selecionada)

        if (!(valor > 0)) {
            toast({ title: 'Valor inválido', description: 'Informe um valor maior que zero.', variant: 'destructive' })
            return
        }
        if (valor > saldo) {
            toast({ title: 'Acima do saldo', description: `Valor máximo permitido: R$ ${saldo.toFixed(2)}`, variant: 'destructive' })
            return
        }

        try {
            setSalvando(true)
            const token = readToken()
            if (!token) throw new Error('Token não encontrado')

            // gera item = próximo número de baixa desta receita
            const item = await proximoItemRecebimento(token, selecionada.codigo)

            const payload = {
                codigo: selecionada.codigo,
                parcela: selecionada.parcela,
                item,                                   // <- importante para múltiplas baixas
                data: toBR(dataRecebimento),            // dd.MM.yyyy
                recebido: valor.toFixed(2),
                acrescimo: '0.00',
                multa: '0.00',
                juros: '0.00',
                descontos: '0.00',
                obs: (motivo?.trim() || 'RECEBIMENTO MANUAL VIA SISTEMA').toUpperCase(),
            }

            await apiRecebimentosRegistra(token, payload)
            toast({ title: 'Recebimento registrado!' })
            setOpen(false)
            setSelecionada(null)
            await fetchTudo()
        } catch (e: any) {
            console.error('Registrar baixa erro:', e?.response?.status, e?.response?.data || e?.message)
            toast({
                title: 'Erro ao registrar baixa',
                description: e?.response?.data?.mensagem || 'Falha na comunicação com o servidor.',
                variant: 'destructive',
            })
        } finally {
            setSalvando(false)
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                    <p className="text-muted-foreground">Valores recebidos, pendentes e histórico</p>
                </div>
                <div className="flex items-end gap-3">
                    <div className="text-right text-sm">
                        <div><strong>Total Geral:</strong> {moedaBR(totalGeral)}</div>
                        <div><strong>A Receber:</strong> {moedaBR(totalPend)}</div>
                        <div><strong>Recebidos:</strong> {moedaBR(totalReceb)}</div>
                    </div>
                    <Button variant="outline" onClick={fetchTudo} disabled={carregando}>
                        {carregando ? 'Atualizando...' : 'Recarregar'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="geral">
                <TabsList>
                    <TabsTrigger value="geral">Geral</TabsTrigger>
                    <TabsTrigger value="areceber">A Receber</TabsTrigger>
                    <TabsTrigger value="recebidos">Recebidos</TabsTrigger>
                </TabsList>

                {/* GERAL */}
                <TabsContent value="geral">
                    <Card>
                        <CardHeader>
                            <CardTitle>Receitas Gerais</CardTitle>
                            <CardDescription>Todos os fretes registrados</CardDescription>
                        </CardHeader>

                        {/* Campo de filtroo */}


                        <div className="px-4 pb-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                {/* Input de pesquisa */}
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        placeholder="Filtrar por cliente, documento ou obs..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Data início */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Data início</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                    />
                                </div>

                                {/* Data fim */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Data fim</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>



                        <div className="px-4 pb-4">
                            <Table className="w-full table-fixed">
                                <colgroup>
                                    <col className="w-[28%]" />
                                    <col className="w-[16%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[14%]" />
                                </colgroup>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Documento</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Recebido</TableHead>
                                        <TableHead>Obs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {geral
                                        .filter((r) =>
                                            [r.nome, r.documento, r.obs]
                                                .filter(Boolean) // ignora null/undefined
                                                .some((field) =>
                                                    field.toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                        )
                                        .filter((r) => {
                                            if (!dataInicio && !dataFim) return true;

                                            // vencimento vem em dd.MM.yyyy, precisamos converter para ISO (yyyy-MM-dd)
                                            const [d, m, y] = r.vencimento.split(".");
                                            const dataISO = `${y}-${m}-${d}`;
                                            const dataRec = new Date(dataISO);

                                            if (dataInicio && dataRec < new Date(dataInicio)) return false;
                                            if (dataFim && dataRec > new Date(dataFim)) return false;

                                            return true;
                                        })
                                        .map((r) => (
                                            <TableRow key={`${r.codigo}-${r.parcela}`}>
                                                <TableCell className="truncate">{r.nome}</TableCell>
                                                <TableCell className="whitespace-nowrap">{r.documento || "-"}</TableCell>
                                                <TableCell className="whitespace-nowrap">{moedaBR(r.valor)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{r.vencimento}</TableCell>
                                                <TableCell className="whitespace-nowrap">{moedaBR(r.vrbaixado)}</TableCell>
                                                <TableCell className="truncate">{r.obs}</TableCell>
                                            </TableRow>
                                        ))}
                                    {!carregando && geral.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem dados.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* A RECEBER */}
                <TabsContent value="areceber">
                    <Card>
                        <CardHeader>
                            <CardTitle>Receitas Pendentes</CardTitle>
                            <CardDescription>Fretes ainda não recebidos</CardDescription>
                        </CardHeader>

                        <div className="px-4 pb-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                {/* Input de pesquisa */}
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        placeholder="Filtrar por cliente, documento ou obs..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Data início */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Data início</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                    />
                                </div>

                                {/* Data fim */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Data fim</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-4 pb-4">
                            <Table className="w-full table-fixed">
                                <colgroup>
                                    <col className="w-[28%]" />
                                    <col className="w-[16%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[14%]" />
                                </colgroup>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Documento</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Obs</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendentes
                                        .filter((r) =>
                                            [r.nome, r.documento, r.obs]
                                                .filter(Boolean) // ignora null/undefined
                                                .some((field) =>
                                                    field.toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                        )
                                        .map((r) => (
                                            <TableRow key={`${r.codigo}-${r.parcela}`}>
                                                <TableCell className="truncate">{r.nome}</TableCell>
                                                <TableCell className="whitespace-nowrap">{r.documento || '-'}</TableCell>
                                                <TableCell className="whitespace-nowrap">{moedaBR(r.valor)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{r.vencimento}</TableCell>
                                                <TableCell className="truncate">{r.obs}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Button onClick={() => abrirConfirmacao(r)}>Dar baixa</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {!carregando && pendentes.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem pendências.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* RECEBIDOS */}
                <TabsContent value="recebidos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Receitas Recebidas</CardTitle>
                            <CardDescription>Fretes já recebidos</CardDescription>
                        </CardHeader>

                        <div className="px-4 pb-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                {/* Input de pesquisa */}
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        placeholder="Filtrar por cliente, documento ou obs..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Data início */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Data início</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                    />
                                </div>

                                {/* Data fim */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Data fim</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-4 pb-4">
                            <Table className="w-full table-fixed">
                                <colgroup>
                                    <col className="w-[22%]" />
                                    <col className="w-[11%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[22%]" />
                                    <col className="w-[10%]" />
                                </colgroup>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Documento</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Recebido</TableHead>
                                        <TableHead>Obs</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recebidos
                                        .filter((r) =>
                                            [r.nome, r.documento, r.obs, r.data]
                                                .filter(Boolean) // ignora null/undefined
                                                .some((field) =>
                                                    field?.toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                        )
                                        .map((rc) => (
                                            <TableRow key={`${rc.codigo}-${rc.parcela}-${rc.item}`}>
                                                <TableCell className="truncate">{rc.nome || '-'}</TableCell>
                                                <TableCell className="whitespace-nowrap">{rc.documento || '-'}</TableCell>
                                                <TableCell className="whitespace-nowrap">{rc.data}</TableCell>
                                                <TableCell className="whitespace-nowrap">{moedaBR(rc.recebido)}</TableCell>
                                                <TableCell className="truncate !text-sm text-gray-800">{rc.obs}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Button onClick={() => Excluir(rc)}>Excluir baixa</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {!carregando && recebidos.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum recebimento encontrado.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de confirmação da baixa */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar baixa</DialogTitle>
                        <DialogDescription>Confira as informações e confirme o recebimento.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Data do recebimento</label>
                                <Input
                                    type="date"
                                    value={dataRecebimento}
                                    onChange={(e) => setDataRecebimento(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Valor recebido</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={valorRecebido}
                                    onChange={(e) => setValorRecebido(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Motivo / Observação</label>
                            <Textarea
                                placeholder="Descreva o motivo da baixa..."
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" disabled={salvando}>Cancelar</Button>
                        </DialogClose>
                        <Button onClick={confirmarBaixa} disabled={salvando}>
                            {salvando ? 'Salvando...' : 'Confirmar baixa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>

            <AlertDialog open={confOpen} onOpenChange={setConfOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão da baixa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A baixa do documento{" "}
                            <strong>{rcSelecionado?.documento}</strong> (parcela {rcSelecionado?.parcela}, item {rcSelecionado?.item}) será removida.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmarExclusao}
                            disabled={excluindo}
                        >
                            {excluindo ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
