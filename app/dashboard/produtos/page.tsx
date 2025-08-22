"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Package, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Produto } from '@/app/global/types';
import { useRouter } from "next/navigation"
import api from "@/app/services/api"




export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    unidade: "",
    preco: "",
  })

  const { toast } = useToast()
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("gsfretes_user") || "{}");
    if (!user.token) {
      toast({
        title: "Sessão expirada",
        description: "Faça login novamente para continuar.",
        variant: "destructive",
      })
      router.push("/");
      return;
    }
  }, [router, toast])

  // let condicao = "";
  // if(searchTerm.trim()){
  //   condicao += `AND UNIDADE LIKE '${condicao}'`;
  // }

  // LISTAR PRODUTOS
  const featchProdutos = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token

      let condicao = "";
      if (searchTerm.trim()) {
        const termo = searchTerm.toUpperCase();
        condicao = `(UNIDADE LIKE '%${termo}%' OR PRECO LIKE '%${termo}%')`;
      }

      const res = await api.post(
        "/api/produto-lista",
        { condicao, ordem: "UNIDADE" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data: Produto[] = res.data.map((p: any) => ({
        ...p,
        id: Number(p.id),
      }))

      setProdutos(data);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tabelas de preço",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    featchProdutos();
  }, [searchTerm]);



  // SALVAR PRODUTO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.unidade) {
      toast({
        title: "Erro",
        description: "Unidade é obrigatório",
        variant: "destructive",
      })
      return;
    }

    // const payload = {
    //   id: editingProduto ? String(editingProduto.id) : "",
    //   unidade: formData.unidade.toUpperCase(),
    //   preco: formData.preco
    // }
    const payload = {
      id: editingProduto ? String(editingProduto.id) : "",
      unidade: formData.unidade.toUpperCase(),
      preco: parseFloat(formData.preco).toFixed(2) // sempre envia "24.00"
    };

    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post("/api/produto-registra", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data;

      if (data.erro === 0) {
        toast({
          title: editingProduto ? "Veículo atualizado!" : "Veículo cadastrado!",
          description: data.mensagem || "Operação concluída com sucesso.",
        });
        featchProdutos();
        setFormData({ id: "", unidade: "", preco: "" });
        setEditingProduto(null);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível salvar.",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao conectar ao servidor.",
        variant: "destructive"
      })
    }
  }

  //EDITAR
  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto)
    setFormData({
      id: String(produto.id),
      unidade: produto.unidade,
      preco: produto.preco.toString(),
    })
    setIsDialogOpen(true)
  }

  //DELETAR
  const handleDelete = async (id: number) => {
    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token

      const res = await api.post(
        "/api/produto-exclui",
        { id: String(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const data = res.data;

      if (data.erro === 0) {
        toast({
          title: "Item removido.",
          description: data.mensagem || "O item foi removido com sucesso.",
          variant: "default"
        })
        featchProdutos();
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Ocorreu um erro ao excluir.",
          variant: "destructive"
        })
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha com conectar ao servidor.",
        variant: "destructive"
      })
    }
  }

  const openNewDialog = () => {
    setEditingProduto(null)
    setFormData({ id: "", unidade: "", preco: "" })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tabela de Preços</h1>
          <p className="text-muted-foreground">Gerencie os preços para seus fretes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Preço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingProduto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              <DialogDescription>
                {editingProduto ? "Atualize as informações do preço." : "Cadastre um novo preço para seus fretes."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Água Mineral"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div> */}

                <div className=" space-y-2">
                  <Label htmlFor="unidade">Unidade de Medida</Label>
                  <Input
                    id="unidade"
                    placeholder="Ex: Fardo"
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                    required
                  />
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Preço</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">Preço Fixo</SelectItem>
                      <SelectItem value="variavel">Preço Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                {/* {formData.tipo === "fixo" && ( */}
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input
                    id="preco"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.preco}
                    onChange={(e) => {
                      // Substitui vírgula por ponto e mantém só números e ponto
                      const valor = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                      setFormData({ ...formData, preco: valor });
                    }}
                    required
                  />

                </div>
                {/* )} */}

                {/* <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descrição do produto..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div> */}
              </div>
              <DialogFooter>
                <Button type="submit">{editingProduto ? "Atualizar" : "Cadastrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por unidade ou preço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Preços
          </CardTitle>
          <CardDescription>Preços cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>Nome</TableHead> */}
                <TableHead>Unidade</TableHead>
                {/* <TableHead>Tipo</TableHead> */}
                <TableHead>Preço</TableHead>
                {/* <TableHead>Descrição</TableHead> */}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  {/* <TableCell className="font-medium">{produto.nome}</TableCell> */}
                  <TableCell className="font-medium">{produto.unidade}</TableCell>
                  {/* <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        produto.tipo === "fixo" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {produto.tipo === "fixo" ? "Preço Fixo" : "Preço Variável"}
                    </span>
                  </TableCell> */}
                  <TableCell>
                    R$ {Number(String(produto.preco || "0").replace(",", ".")).toFixed(2)}
                  </TableCell>
                  {/* <TableCell>{produto.descricao}</TableCell> */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(produto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(produto.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
