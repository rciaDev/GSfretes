"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Veiculos } from "@/app/global/types";
import { useRouter } from "next/navigation";
import api from "@/app/services/api";

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculos[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculos | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    identificacao: "",
    veiculo: "",
    motorista: "",
  });

  const { toast } = useToast();
  const router = useRouter();

  // ================== VERIFICA TOKEN ==================
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("gsfretes_user") || "{}");
    if (!user.token) {
      toast({
        title: "Sessão expirada",
        description: "Faça login novamente para continuar.",
        variant: "destructive",
        duration: 4000
      });
      router.push("/");
    }
  }, [router, toast]);

  // ================== LISTAR VEÍCULOS ==================
  const fetchVeiculos = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post(
        "/api/veiculo-lista",
        { condicao: "", ordem: "MOTORISTA" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data: Veiculos[] = res.data.map((v: any) => ({
        ...v,
        id: Number(v.id),
      }));

      setVeiculos(data);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os veículos.",
        variant: "destructive",
        duration: 4000
      });
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  // ================== SALVAR OU EDITAR VEÍCULO ==================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.veiculo?.trim() || !formData.identificacao?.trim() || !formData.motorista?.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    const payload = {
      id: editingVeiculo ? String(editingVeiculo.id) : "",
      identificacao: formData.identificacao.toUpperCase(),
      veiculo: formData.veiculo.toUpperCase(),
      motorista: formData.motorista.toUpperCase(),
    };

    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post("/api/veiculo-registra", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      if (data.erro === 0) {
        toast({
          title: editingVeiculo ? "Veículo atualizado!" : "Veículo cadastrado!",
          description: data.mensagem || "Operação concluída com sucesso.",
        });
        fetchVeiculos();
        setFormData({ id: "", identificacao: "", veiculo: "", motorista: "" });
        setEditingVeiculo(null);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível salvar o veículo",
          duration: 3000
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao conectar ao servidor.",
        variant: "destructive",
      });
    }
  };

  // ================== EDITAR VEÍCULO ==================
  const handleEdit = (veiculo: Veiculos) => {
    setEditingVeiculo(veiculo);
    setFormData({
      id: String(veiculo.id),
      identificacao: veiculo.identificacao,
      veiculo: veiculo.veiculo,
      motorista: veiculo.motorista,
    });
    setIsDialogOpen(true);
  };

  // ================== EXCLUIR VEÍCULO ==================
  const handleDelete = async (id: number) => {
    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post(
        "/api/veiculo-exclui",
        { id: String(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;

      if (data.erro === 0) {
        toast({
          title: "Veículo removido!",
          description: data.mensagem || "O veículo foi removido com sucesso.",
        });
        fetchVeiculos();
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Não foi possível excluir o veículo",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao conectar com a API de exclusão.",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingVeiculo(null);
    setFormData({ id: "", identificacao: "", veiculo: "", motorista: "" });
    setIsDialogOpen(true);
  };

  // ================== RENDERIZAÇÃO ==================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">Gerencie seus veículos e mercadorias para seus fretes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingVeiculo ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
              <DialogDescription>
                {editingVeiculo
                  ? "Atualize as informações do veículo."
                  : "Cadastre um novo veículo para seus fretes."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="identificacao">Identificação</Label>
                  <Input
                    id="identificacao"
                    placeholder="Ex: QRT-123"
                    value={formData.identificacao}
                    onChange={(e) => setFormData({ ...formData, identificacao: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="veiculo">Nome do Veículo</Label>
                  <Input
                    id="veiculo"
                    placeholder="Ex. Volcano CD 1.3"
                    value={formData.veiculo}
                    onChange={(e) => setFormData({ ...formData, veiculo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorista">Motorista</Label>
                  <Input
                    id="motorista"
                    placeholder="Ex: Igor"
                    value={formData.motorista}
                    onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingVeiculo ? "Atualizar" : "Cadastrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
          <CardDescription>Veículos cadastrados no sistema</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificação</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veiculos.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell className="font-semibold">{veiculo.identificacao}</TableCell>
                  <TableCell className="font-medium">{veiculo.veiculo}</TableCell>
                  <TableCell className="font-medium">{veiculo.motorista}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(veiculo)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(veiculo.id)}>
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
  );
}
