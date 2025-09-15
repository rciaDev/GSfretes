"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Users, MapPin, Phone, Mail, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formataCelular, formatarDocumento } from "@/app/global/funcoes"
import { Cliente } from "@/app/global/types"
import api from "@/app/services/api"
import { useRouter } from "next/navigation"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    numero: "",
    observacoes: "",
  })

  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  const router = useRouter();

  const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

  if (!token) {
    toast({
      title: "Sessão expirada",
      description: "Faça login novamente para continuar.",
      variant: "destructive",
    });
    router.push("/");
    return;
  }

  // const condicaoBase = "ID>0"; // padrão
  // let condicao = condicaoBase;

  // if (searchTerm.trim()) {
  //   condicao += ` AND NOME LIKE '%${searchTerm}%'`;
  // }


  // ================== LISTAR CLIENTES ==================
  const fetchClientes = async (searchTerm: string = ' ') => {
    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      let condicao = "ID>0";
      if (searchTerm.trim()) {
        const termo = searchTerm.toUpperCase();
        condicao += ` AND (NOME LIKE '%${termo}%' OR CIDADE LIKE '%${termo}%' OR ENDERECO LIKE '%${termo}%' OR CNPJ LIKE '%${termo}%')`;
      }

      const res = await api.post(
        "/api/cliente-lista",
        { condicao, ordem: "NOME" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: Cliente[] = res.data.map((c: any) => ({
        ...c,
        id: Number(c.id),
      }));

      setClientes(data);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    fetchClientes();
  }, []);

  // ================== SALVAR CLIENTE ==================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      })
      return
    }

    // if (!formData.endereco) {
    //   toast({
    //     title: "Erro",
    //     description: "Endereço é obrigatório",
    //     variant: "destructive",
    //   })
    //   return
    // }

    const payload = {
      id: editingCliente ? String(editingCliente.id) : "",
      cnpj: formData.cnpj.replace(/\D/g, ""),
      nome: formData.nome.toUpperCase(),
      email: formData.email.toUpperCase(),
      telefone: formData.telefone.replace(/\D/g, ""),
      endereco: formData.endereco.toUpperCase(),
      numero: formData.numero.toUpperCase(),
      cidade: formData.cidade.toUpperCase(),
      estado: formData.estado.toUpperCase(),
      cep: formData.cep.replace(/\D/g, ""),
      observacoes: formData.observacoes.toUpperCase(),
    }

    console.log("payload", payload)

    try {
      // console.log("aqui 1")
      const response = await api.post("/api/cliente-registra", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log('response', response)
      // console.log("aqui")
      const data = response.data;

      if (data.erro === 0) {
        toast({
          title: editingCliente ? "Cliente atualizado!" : "Cliente cadastrado!",
          description: data.mensagem,
        });
        await fetchClientes();
        resetForm();
      } else {

        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível cadastrar o cliente",
          variant: "destructive",
        });
      }
    } catch (error: any) {

      console.error("Erro ao registrar cliente:", error);

      if (error.response) {
        // Erro HTTP (com status de resposta do servidor)
        console.log("Status:", error.response.status);
        console.log("Headers:", error.response.headers);
        console.log("Data:", error.response.data);
      } else if (error.request) {
        // Nenhuma resposta recebida
        console.log("Request:", error.request);
      } else {
        // Outro erro (ex: configuração da requisição)
        console.log("Mensagem de erro:", error.message);
      } toast({
        title: "Erro de servidor",
        description: "Falha ao conectar com a API de clientes.",
        variant: "destructive",
      });
    }
  }

  // ================== EDITAR ==================
  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({ ...cliente })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      // console.log("ID recebido para exclusão:", id);
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post(
        "/api/clientes-exclui",
        { codigo: String(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );


      const data = res.data;
      // console.log("Resposta da API:", res.data);
      if (data.erro === 0) {
        toast({
          title: "Cliente removido!",
          description: data.mensagem || "O Cliente foi removido com sucesso.",
        });
        fetchClientes();
      } else {

        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível excluir o Cliente",
          variant: "destructive",
        });
      }
    } catch (error : any) {

      if (error.response) {
        console.error("Erro API:", error.response.status, error.response.data);
      } else {
        console.error("Erro inesperado:", error);
      }
      toast({
        title: "Erro",
        description: "Falha ao conectar com a API de exclusão.",
        variant: "destructive",
      });
    }
  };

  // ================== RESET FORM ==================
  const resetForm = () => {
    setFormData({
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      numero: "",
      observacoes: "",
    })
    setEditingCliente(null)
    setIsDialogOpen(false)
  }

  const openNewDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // ================== BUSCAR ENDEREÇO POR CEP ==================
  const handleCep = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return

    try {
      const res = await fetch(`/api/cep?cep=${cepLimpo}`)
      const data = await res.json()

      if (data.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" })
        return
      }

      setFormData((prev) => ({
        ...prev,
        endereco: data.logradouro,
        cidade: data.localidade,
        estado: data.uf,
      }))
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" })
    }
  }

  const handleBuscar = () => {
    fetchClientes(searchTerm);
  }

  return (
    <div className="space-y-6">
      {/* HEADER + BOTÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seus clientes e informações de contato
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="w-full max-w-4xl max-h-[85vh] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              <DialogDescription>
                {editingCliente
                  ? "Atualize as informações do cliente."
                  : "Cadastre um novo cliente no sistema."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* FORM LINHAS RESPONSIVAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ/CPF</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome / Razão Social *</Label>
                  <Input
                    placeholder="Nome do cliente"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    onBlur={() =>
                      setFormData((prev) => ({
                        ...prev,
                        telefone: formataCelular(prev.telefone),
                      }))
                    }
                    
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    onBlur={handleCep}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    placeholder="Rua, número, complemento"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre o cliente..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingCliente ? "Atualizar" : "Cadastrar"}
                </Button>
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
              <div className="flex gap-5 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, origem ou destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                <Button onClick={handleBuscar} >Buscar</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE CLIENTES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>Clientes cadastrados no sistema</CardDescription>
        </CardHeader>

        <CardContent>
          {/* DESKTOP: Tabela completa */}
          <div className="hidden sm:block  overflow-x-auto">
            <Table className="min-w-[700px] text-sm sm:text-base">
              <TableHeader>
                <TableRow>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{formatarDocumento(cliente.cnpj)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cliente.nome}</p>
                        {cliente.email && (
                          <p className="text-xs lowercase sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="flex lowercase items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cliente.telefone}
                      </p>
                    </TableCell>
                    <TableCell>
                      {cliente.cidade && cliente.estado && (
                        <p className="flex uppercase items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cliente.cidade}, {cliente.estado}
                        </p>
                      )}
                      {cliente.endereco && (
                        <p className="text-xs lowercase sm:text-sm text-muted-foreground">{cliente.endereco}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs lowercase sm:text-sm">{cliente.observacoes}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="p-2" onClick={() => handleEdit(cliente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* <Button variant="outline" size="sm" className="p-2" onClick={() => handleDelete(cliente.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE: Lista simplificada */}
          <div className="block sm:hidden space-y-2">
            {clientes.map((cliente) => (
              <Dialog key={cliente.id}>
                <DialogTrigger asChild>
                  <div className="p-3 border rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-50">
                    <span className="text-xs lowercase font-medium">{cliente.cnpj}</span>
                    <span className="text-sm lowercase font-semibold">{cliente.nome}</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{cliente.nome}</DialogTitle>
                    <DialogDescription>Detalhes do cliente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    {cliente.email && (
                      <p><Mail className="inline h-4 w-4 mr-1 lowercase " /> {cliente.email}</p>
                    )}
                    {cliente.telefone && (
                      <p><Phone className="inline h-4 w-4 mr-1 lowercase " /> {cliente.telefone}</p>
                    )}
                    {cliente.cidade && (
                      <p><MapPin className="inline h-4 w-4 mr-1 lowercase " /> {cliente.cidade} - {cliente.estado}</p>
                    )}
                    {cliente.endereco && (
                      <p className="text-muted-foreground lowercase ">{cliente.endereco} {cliente.numero}</p>
                    )}
                    {cliente.observacoes && (
                      <p className="text-muted-foreground lowercase ">{cliente.observacoes}</p>
                    )}
                  </div>
                  <DialogFooter className="flex justify-between mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    {/* <Button variant="outline" size="sm" onClick={() => handleDelete(cliente.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remover
                    </Button> */}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>

  )
}
