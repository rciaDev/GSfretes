"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, DiamondPercentIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/app/services/api";
import type { Cliente, Veiculos, Produto as TabelaPreco } from "@/app/global/types";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Noticia_Text } from "next/font/google";
import { isStringObject } from "util/types";


interface ItemFrete {
  tabelaPrecoId: number;
  unidade: string;
  produto: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export default function NovoFretePage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculos[]>([]);
  const [tabelaPrecos, setTabelaPrecos] = useState<TabelaPreco[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [bloquearEdicao, setBloquearEdicao] = useState(false);
  const searchParams = useSearchParams();
  const [dadosCarregados, setDadosCarregados] = useState(false);



  const id = searchParams.get("id");
  const isEdit = !!id;




  useEffect(() => {
    if (!isEdit || !id) return;
    if (!dadosCarregados) return;


    async function carregarFreteEVerificarBaixa() {
      try {
        const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

        // Verifica se já foi feito recebimento
        const resRecebimento = await api.post("/api/recebimentos-lista", {
          condicao: `CODIGO=${id}`,
          ordem: "CODIGO"
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("res recebimento", resRecebimento)

        if (resRecebimento.data?.length > 0) {
          toast({
            title: "Atenção",
            description: "Frete já baixado, não é possível editar.",
            variant: "destructive"
          })
          setBloquearEdicao(true); // impede edição
        }

        // Carrega dados do frete
        const res = await api.post("/api/fretes-lista", {
          condicao: `CODIGO=${id}`,
          ordem: "",
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("res fretelista", res)

        const frete = res.data?.[0];
        if (!frete) return;

        console.log("Frete carregado:", frete);


        setFormData({
          clienteId: frete.cliente,
          clienteNome: frete.nome,
          origem: frete.origem,
          destino: frete.destino,
          veiculoId: frete.veiculo,
          motoristaNome: "", // ou buscar via API
          observacoes: frete.obs,
          formaPg: frete.formapg,
          vencimento: frete.vencimento || "",
        });

        setBuscaCliente(frete.nome);

        setItens(
          Array.isArray(frete.itens) && frete.itens.length > 0
            ? frete.itens.map((item: any) => ({
              tabelaPrecoId: Number(item.produto),
              unidade: item.unidade || "", // ou algum padrão se não tiver
              produto: item.descricao,
              quantidade: Number(item.quantidade),
              valorUnitario: Number(item.unitario),
              valorTotal: Number(item.total),
            }))
            : [
              {
                tabelaPrecoId: 0,
                unidade: "",
                produto: "",
                quantidade: 1,
                valorUnitario: 0,
                valorTotal: 0,
              },
            ]
        );

      } catch (error) {
        console.error("Erro ao carregar frete ou verificar baixa:", error);
      }
    }

    carregarFreteEVerificarBaixa();
  }, [isEdit, id, dadosCarregados]);



  const [formData, setFormData] = useState({
    clienteId: 0,
    clienteNome: "",
    origem: "",
    destino: "",
    veiculoId: 0,
    motoristaNome: "",
    observacoes: "",
    formaPg: "AVISTA",
    vencimento: "",
  });

  const [itens, setItens] = useState<ItemFrete[]>([
    { tabelaPrecoId: 0, unidade: "", produto: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 },
  ]);

  const { toast } = useToast();
  const router = useRouter();

  // Carregar clientes, veículos e produtos
  useEffect(() => {
    async function carregarDados() {
      try {
        const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

        const [clientesRes, veiculosRes, tabelaRes] = await Promise.all([
          api.post("/api/cliente-lista", { condicao: "", ordem: "NOME" }, { headers: { Authorization: `Bearer ${token}` } }),
          api.post("/api/veiculo-lista", { condicao: "", ordem: "MOTORISTA" }, { headers: { Authorization: `Bearer ${token}` } }),
          api.post("/api/produto-lista", { condicao: "", ordem: "UNIDADE" }, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setClientes(clientesRes.data);
        setVeiculos(veiculosRes.data);
        setTabelaPrecos(tabelaRes.data);
        setDadosCarregados(true); // 🔥 Ativa a flag após tudo carregado
      } catch {
        toast({
          title: "Erro",
          description: "Falha ao carregar dados iniciais",
          variant: "destructive",
        });
      }
    }

    carregarDados();
  }, []);


  const selecionarVeiculo = (id: string) => {
    const veiculo = veiculos.find((v) => v.id === Number(id));
    setFormData((prev) => ({
      ...prev,
      motoristaNome: veiculo ? veiculo.motorista : "",
    }));
  };



  const adicionarItem = () => {
    setItens([...itens, { tabelaPrecoId: 0, unidade: "", produto: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  };

  const removerItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const atualizarItem = (index: number, campo: keyof ItemFrete, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };

    if (campo === "quantidade" || campo === "valorUnitario") {
      novosItens[index].valorTotal = novosItens[index].quantidade * novosItens[index].valorUnitario;
    }

    setItens(novosItens);
  };

  // Buscar produto no banco
  const handleGetProduto = async (valor: string) => {
    if (!valor.trim()) return null;

    const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

    const condicao = !isNaN(Number(valor.trim()))
      ? `ID = ${parseInt(valor)}`
      : `UPPER(UNIDADE) LIKE '%${valor.toUpperCase()}%'`;
    // busca por unidade se for texto

    try {
      const res = await api.post(
        "/api/produto-lista",
        { condicao, ordem: "UNIDADE" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data.length > 0 ? res.data[0] : null;
    } catch {
      return null;
    }
  };

  const calcularValorTotal = () => itens.reduce((acc, i) => acc + i.valorTotal, 0);

  function formatDate(date: Date) {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}.${mes}.${ano}`;
  }

  // helpers de data
  const toBR = (iso: string) => {
    // ISO (yyyy-MM-dd) -> dd.MM.yyyy
    const m = iso?.match?.(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    const [, y, mo, d] = m;
    return `${d}.${mo}.${y}`;
  };

  const todayBR = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const formatarDataComHoraBR = (data: Date) => {
    const dd = String(data.getDate()).padStart(2, "0");
    const mm = String(data.getMonth() + 1).padStart(2, "0");
    const yyyy = data.getFullYear();
    const hh = String(data.getHours()).padStart(2, "0");
    const mi = String(data.getMinutes()).padStart(2, "0");
    const ss = String(data.getSeconds()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validações básicas
    if (!formData.clienteId || !formData.origem || !formData.destino || !formData.veiculoId) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (formData.formaPg === "APRAZO" && !formData.vencimento) {
      toast({ title: "Erro", description: "Informe a data de vencimento para pagamento a prazo", variant: "destructive" });
      return;
    }

    if (itens.some(i => i.quantidade <= 0 || i.valorUnitario <= 0 || !i.produto || !i.unidade)) {
      toast({ title: "Erro", description: "Verifique os itens do frete (preço ou quantidade inválidos).", variant: "destructive" });
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      // datas no formato que a API espera
      const dataBR = todayBR();
      const vencimentoBR = formData.formaPg === "APRAZO" && formData.vencimento
        ? toBR(formData.vencimento)
        : "";

    
      const payload = {
        ...(isEdit ? { codigo: String(id) } : { codigo: "" }),
        data: dataBR,                      
        formapg: formData.formaPg.toUpperCase(),        
        cliente: String(formData.clienteId),
        seqfin: "",
        vencimento: vencimentoBR,         
        veiculo: String(formData.veiculoId),
        origem: formData.origem.toUpperCase(),
        destino: formData.destino.toUpperCase(),
        valor: calcularValorTotal().toFixed(2),
        obs: formData.observacoes.toUpperCase(),
        itens: itens.map((item, idx) => ({
          
          codigo: "",
          item: String(idx + 1),
          produto: String(item.tabelaPrecoId).toUpperCase(),
          quantidade: String(item.quantidade),
          descricao: item.produto.toUpperCase(),
          unitario: item.valorUnitario.toFixed(2),
          total: item.valorTotal.toFixed(2),
          // unidade: item.unidade, // descomente se a API aceitar
        })),
      };

      // mesmo endpoint para criar/editar
      const res = await api.post("/api/fretes-registra", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const codigoFrete = res.data?.codigo || (isEdit ? String(id) : null);
      if (!codigoFrete) throw new Error("Código do frete não retornado pela API");

      // cria receita apenas quando for NOVO (evita duplicar no update)
      if (!isEdit) {
        const numeroFrete = `FRT-${String(codigoFrete).padStart(3, "0")}`;
        const agora = new Date();

        const receitaPayload = {
          codigo: "",
          parcela: "1",
          cliente: String(formData.clienteId),
          documento: numeroFrete,
          data: formatarDataComHoraBR(agora),                    // dd.MM.yyyy HH:mm:ss
          vencimento: vencimentoBR || todayBR(),                 // dd.MM.yyyy
          valor: calcularValorTotal().toFixed(2),
          obs: `SERVIÇO PRESTADO FRETE PARA ${formData.destino?.toUpperCase() || ""}`,
        };

        await api.post("/api/receitas-registra", receitaPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast({ title: "Sucesso", description: isEdit ? "Frete atualizado" : "Frete criado" });
      router.push("/dashboard/fretes");
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const resp = err.response;
        const cfg = err.config;

        console.error("AXIOS ERROR ::", {
          url: cfg?.url,
          method: cfg?.method,
          status: resp?.status,
          statusText: resp?.statusText,
          responseData: resp?.data,
          requestData: cfg?.data,
          headers: resp?.headers,
        });

        const backendMsg =
          (typeof resp?.data === "string" && resp.data) ||
          resp?.data?.mensagem ||
          resp?.data?.message ||
          err.message;

        toast({
          title: "Erro ao salvar",
          description: backendMsg || "Falha ao comunicar com o servidor.",
          variant: "destructive",
        });
      } else {
        console.error("UNKNOWN ERROR ::", err);
        toast({
          title: "Erro inesperado",
          description: err?.message || "Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  // Buscar clientes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (buscaCliente.length < 2) return;
      try {
        const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;
        const res = await api.post(
          "/api/cliente-lista",
          { condicao: `UPPER(NOME) LIKE '%${buscaCliente.toLocaleUpperCase()}%'`, ordem: "NOME" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResultadosCliente(res.data);
      } catch {
        setResultadosCliente([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaCliente]);

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);

     const enderecoCompleto = `${cliente.endereco || ""}, ${cliente.numero || ""} - ${cliente.cidade || ""}`;

    setFormData({
      ...formData,
      clienteId: cliente.id,
      // origem: cliente.endereco,
      destino: enderecoCompleto
    });
    setResultadosCliente([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar Frete" : "Novo Frete"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente */}
            <div className="relative">
              <Label>Cliente *</Label>
              <Input
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value);
                  setClienteSelecionado(null);
                }}
                placeholder="Digite o nome do cliente"
              />
              {resultadosCliente.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-auto">
                  {resultadosCliente.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => selecionarCliente(c)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {c.nome} - {c.cnpj}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Origem/Destino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Origem *</Label>
                <Input disabled={bloquearEdicao} value={formData.origem} onChange={(e) => setFormData({ ...formData, origem: e.target.value })} />
              </div>
              <div>
                <Label>Destino *</Label>
                <Input disabled={bloquearEdicao} value={formData.destino} onChange={(e) => setFormData({ ...formData, destino: e.target.value })} />
              </div>
            </div>

            {/* Forma de pagamento */}
            <div>
              <Label>Forma de Pagamento *</Label>
              <Select disabled={bloquearEdicao} value={formData.formaPg} onValueChange={(v) => setFormData({ ...formData, formaPg: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVISTA">À Vista</SelectItem>
                  <SelectItem value="APRAZO">A Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.formaPg === "APRAZO" && (
              <div>
                <Label>Vencimento *</Label>
                <Input disabled={bloquearEdicao} type="date" value={formData.vencimento} onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })} />
              </div>
            )}

            {/* Veículo */}
            <div>
              <Label>Veículo *</Label>
              <Select
                disabled={bloquearEdicao}
                value={String(formData.veiculoId)} // sempre string, mesmo se 0
                onValueChange={(value) => {
                  selecionarVeiculo(value);
                  setFormData((prev) => ({ ...prev, veiculoId: Number(value) })); // garante estado
                }}
              >

                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.identificacao} - {v.veiculo} ({v.motorista})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


            </div>

            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea disabled={bloquearEdicao} value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
            </div>

            {/* ITENS DO FRETE */}
            <div className="space-y-4">
              {/* Cabeçalho da Tabela */}
              <div className="hidden md:grid grid-cols-12 gap-2 font-semibold text-sm px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Unidade</div>
                <div className="col-span-2">Quantidade</div>
                <div className="col-span-2">Valor Unitário</div>
                <div className="col-span-3">Produto</div>
                <div className="col-span-2">Total</div>
              </div>

              {itens.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 border rounded-md"
                >
                  {/* Index + botão remover */}
                  <div className="flex items-center gap-2 col-span-1">
                    <span className="font-medium">#{index + 1}</span>
                    {itens.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removerItem(index)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Unidade */}
                  <div className="col-span-2">
                    <Input
                      disabled={bloquearEdicao}
                      placeholder="Unidade"
                      value={item.unidade}
                      onChange={(e) => atualizarItem(index, "unidade", e.target.value)}
                      onBlur={async (e) => {
                        const produtoEncontrado = await handleGetProduto(e.target.value);
                        if (produtoEncontrado) {
                          const preco = Number(produtoEncontrado.preco.replace(",", ".")) || 0;
                          const novosItens = [...itens];
                          novosItens[index] = {
                            ...novosItens[index],
                            tabelaPrecoId: Number(produtoEncontrado.id),
                            unidade: produtoEncontrado.unidade,
                            valorUnitario: preco,
                            valorTotal: preco * novosItens[index].quantidade,
                          };
                          setItens(novosItens);
                        }
                      }}
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="col-span-1">
                    <Input
                      disabled={bloquearEdicao}
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(index, "quantidade", Number(e.target.value))}
                    />
                  </div>

                  {/* Valor Unitário */}
                  <div className="col-span-1">
                    <Input
                      disabled={bloquearEdicao}
                      type="number"
                      value={item.valorUnitario}
                      onChange={(e) => atualizarItem(index, "valorUnitario", Number(e.target.value))}
                    />
                  </div>

                  {/* Produto */}
                  <div className="col-span-5">
                    <Input
                      disabled={bloquearEdicao}
                      placeholder="Descrição"
                      value={item.produto}
                      onChange={(e) => atualizarItem(index, "produto", e.target.value)}
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-2">
                    <Input
                      disabled
                      value={`R$ ${item.valorTotal.toFixed(2)}`}
                      className="bg-muted"
                    />
                  </div>
                </div>
              ))}

              <Button disabled={bloquearEdicao} type="button" onClick={adicionarItem} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Item
              </Button>
            </div>


            {/* Total do Frete */}
            <div className="text-right text-lg font-bold">
              Total do Frete: R$ {calcularValorTotal().toFixed(2)}
            </div>

            <Button disabled={bloquearEdicao} type="submit" className="w-full">
              Salvar Frete
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
