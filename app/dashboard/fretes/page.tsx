"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, Truck, Trash2 } from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from "@/hooks/use-toast";

// Tipos da API
interface FreteAPI {
  codigo: string;
  data: string;
  formapg: string;
  cliente: string;  // id do cliente
  nome: string;     // nome do cliente (novo campo da API)
  seqfin: string;
  vencimento: string;
  veiculo: string;
  origem: string;
  destino: string;
  valor: string;
  obs: string;
  itens: {
    item: string;
    produto: string;
    quantidade: string;
    descricao: string;
    unitario: string;
    total: string;
  }[];
}
interface RecebimentoAPI {
  codigo: string
  parcela: string
  item: string
  data: string
  recebido: string
  acrescimo: string
  multa: string
  juros: string
  descontos: string
  obs: string
}



// Tipo para renderização
interface Frete {
  id: string;
  cliente: string;
  origem: string;
  destino: string;
  // mercadorias: string;
  seqfin: string;
  valor: number;
  status: string;
  data: string;
}

export default function FretesPage() {
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [freteAlvo, setFreteAlvo] = useState<Frete | null>(null);
  const [excluindo, setExcluindo] = useState(false);


  // Função para buscar fretes
  const carregarFretes = async (searchTerm: string = '') => {
    setLoading(true);

    try {
      // Monta condição do filtro
      let condicao = "";
      if (searchTerm.trim()) {
        const termo = searchTerm.toUpperCase();
         condicao = `(C.NOME LIKE '%${termo}%' OR F.ORIGEM LIKE '%${termo}%' OR F.DESTINO LIKE '%${termo}%' OR F.SEQFIN LIKE '${termo}')`;
        console.log("condição", condicao)
      }

      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post(
        "/api/fretes-lista",
        { condicao, ordem: "CODIGO DESC" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const dados: FreteAPI[] = res.data;

      // Mapeia para formato da tabela
      const mapped = dados.map((f) => ({
        id: f.codigo,
        cliente: f.nome,   // agora mostra o nome do cliente
        origem: f.origem,
        destino: f.destino,
        seqfin: f.seqfin,
        valor: parseFloat(f.valor),
        status: f.formapg === "PRAZO" ? "pago" : "pendente",
        data: f.data,
      }));


      setFretes(mapped);
    } catch (error) {
      console.error("Erro ao carregar fretes:", error);
      setFretes([]);
    } finally {
      setLoading(false);
    }
  };

  async function abrirConfirmacao(frete: Frete) {
    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token
      const qtd = await contarRecebimentos(token, frete.id)
      if (qtd > 0) {
        toast({
          title: "Exclusão bloqueada",
          description: `Este frete possui ${qtd} recebimento(s) registrado(s). Exclua/estorne os recebimentos antes.`,
          variant: "destructive",
        })
        return
      }
      setFreteAlvo(frete)
      setOpen(true)
    } catch (e: any) {
      // Em caso de erro na checagem, prefira bloquear para não excluir sem verificar
      toast({
        title: "Não foi possível verificar recebimentos",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    }
  }


  async function contarRecebimentos(token: string, codigoFrete: string) {

    const r = await api.post(
      '/api/recebimentos-lista',
      { condicao: `CODIGO=${codigoFrete}`, ordem: 'ITEM' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const arr = Array.isArray(r.data) ? (r.data as RecebimentoAPI[]) : []
    return arr.length
  }

  async function confirmarExcluir() {
    if (!freteAlvo) return;

    try {
      setExcluindo(true);
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      await api.post("/api/fretes-exclui",
        { codigo: freteAlvo.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast({
        title: "Frete excluído com sucesso!",
      })
      setOpen(false)
      setFreteAlvo(null)

      await carregarFretes();
    } finally {
      setExcluindo(false);
    }
  }

  // Chama a API ao montar a página e quando searchTerm mudar
  useEffect(() => {
    carregarFretes();
  }, []);

  const handleBuscar = () => {
    carregarFretes(searchTerm)
  }

  // Badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", variant: "secondary" as const },
      pago: { label: "Pago", variant: "default" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge
        variant={config.variant}
        className={
          status === "pago"
            ? "bg-green-100 text-green-800 hover:bg-green-200"
            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        }
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fretes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus fretes</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/fretes/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Frete
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex gap-5 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, origem ou destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                <Button onClick={handleBuscar}>Buscar</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fretes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Lista de Fretes
          </CardTitle>
          <CardDescription>
            {loading
              ? "Carregando..."
              : `${fretes.length} frete(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Rota</TableHead>
                {/* <TableHead>Mercadorias</TableHead> */}
                <TableHead>Financeiro</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fretes.map((frete) => (
                <TableRow key={frete.id}>
                  <TableCell className="font-medium">{frete.cliente}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">De:</span> {frete.origem}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Para:</span> {frete.destino}
                      </p>
                    </div>
                  </TableCell>
                  {/* <TableCell>{frete.mercadorias}</TableCell> */}
                  <TableCell>{frete.seqfin} </TableCell>
                  {/* <TableCell>{getStatusBadge(frete.status)}</TableCell> */}
                  <TableCell>
                    R$ {frete.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{frete.data}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">

                      {/* Botão visualizar */}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/fretes/${frete.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Botão editar */}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/fretes/novo?id=${frete.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); abrirConfirmacao(frete) }}
                        aria-label="Excluir frete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>



                    </div>
                  </TableCell>

                </TableRow>
              ))}
              {fretes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum frete encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>


          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir frete?</DialogTitle>
                <DialogDescription>
                  Esta ação não pode ser desfeita. Confirme para excluir o frete{" "}
                  <strong>{freteAlvo?.id}</strong>
                  {freteAlvo?.cliente ? <> — {freteAlvo?.cliente}</> : null}.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="gap-2">
                {/* Cancelar apenas fecha o modal */}
                <DialogClose asChild>
                  <Button variant="outline" disabled={excluindo}>Cancelar</Button>
                </DialogClose>

                {/* Excluir chama a API; fecha só quando der certo */}
                <Button
                  variant="destructive"
                  onClick={confirmarExcluir}
                  disabled={excluindo}
                >
                  {excluindo ? "Excluindo..." : "Excluir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
    </div>
  );
}
