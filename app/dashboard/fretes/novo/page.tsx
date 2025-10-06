"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/app/services/api";
import type { Cliente, Veiculos, Produto as TabelaPreco } from "@/app/global/types";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

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
  const [resultadosProduto, setResultadosProduto] = useState<{ [key: number]: any[] }>({});

  const id = searchParams.get("id");
  const isEdit = !!id;

  const router = useRouter();
  const { toast } = useToast(); // moved up so effects can use it

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

  // Carregar clientes, veículos e produtos
  useEffect(() => {
    async function carregarDados() {
      try {
        const raw = localStorage.getItem("gsfretes_user") || "{}";
        const token = JSON.parse(raw).token || "";

        const [clientesRes, veiculosRes, tabelaRes] = await Promise.all([
          api.post("/api/cliente-lista", { condicao: "", ordem: "NOME" }, { headers: { Authorization: `Bearer ${token}` } }),
          api.post("/api/veiculo-lista", { condicao: "", ordem: "MOTORISTA" }, { headers: { Authorization: `Bearer ${token}` } }),
          api.post("/api/produto-lista", { condicao: "", ordem: "UNIDADE" }, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setClientes(clientesRes.data || []);
        setVeiculos(veiculosRes.data || []);
        setTabelaPrecos(tabelaRes.data || []);
        setDadosCarregados(true);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais", error);
        toast({ title: "Erro", description: "Falha ao carregar dados iniciais", variant: "destructive" });
      }
    }

    carregarDados();
  }, [toast]);

  // Carrega frete e verifica se há baixa (apenas em edição)
  useEffect(() => {
    if (!isEdit || !id) return;
    if (!dadosCarregados) return;

    async function carregarFreteEVerificarBaixa() {
      try {
        const raw = localStorage.getItem("gsfretes_user") || "{}";
        const token = JSON.parse(raw).token || "";


        const resFrete = await api.post(
          "/api/fretes-lista",
          { condicao: `CODIGO=${id}`, ordem: "" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Resposta do frete:", resFrete.data);

        const frete = resFrete.data?.[0];
        if (!frete) return;

        console.log("frete carregado:", frete);

        // 2️⃣ Verificar se há baixa diretamente no frete
        const freteBaixado =
          Array.isArray(frete.receita) &&
          frete.receita.some(
            (r: any) =>
              r.item_baixa ||
              r.data_baixa ||
              (Number(r.valor_baixa) > 0)
          );

        if (freteBaixado) {
          toast({
            title: "Atenção",
            description: "Frete já baixado, não é possível editar.",
            variant: "destructive",
          });
          setBloquearEdicao(true);
        }


        const formatarData = (dataStr: string) => {
          if (!dataStr) return "";
          const partes = dataStr.split(".");
          if (partes.length !== 3) return "";
          const [dia, mes, ano] = partes;
          return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`; // formato válido pro input date
        };


        setFormData((prev) => ({
          ...prev,
          clienteId: Number(frete.cliente) || 0,
          clienteNome: frete.nome || "",
          origem: frete.origem || "",
          destino: frete.destino || "",
          veiculoId: Number(frete.veiculo) || 0,
          motoristaNome: "",
          observacoes: frete.obs || "",
          formaPg: frete.formapg || "AVISTA",
          // vencimento: frete.vencimento || "",
          vencimento: formatarData(frete.vencimento) || "",
        }));

        setBuscaCliente(frete.nome || "");

        setItens(
          Array.isArray(frete.itens) && frete.itens.length > 0
            ? frete.itens.map((item: any, idx: number) => ({
              tabelaPrecoId: Number(item.produto) || 0,
              unidade: item.unidade || "",
              produto: item.descricao || item.produto || `Item ${idx + 1}`,
              quantidade: Number(item.quantidade) || 1,
              valorUnitario: Number(item.unitario) || 0,
              valorTotal: Number(item.total) || 0,
            }))
            : [
              { tabelaPrecoId: 0, unidade: "", produto: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 },
            ]
        );
      } catch (error) {
        console.error("Erro ao carregar frete ou verificar baixa:", error);
        toast({ title: "Erro", description: "Falha ao carregar dados do frete.", variant: "destructive" });
      }
    }

    carregarFreteEVerificarBaixa();
  }, [isEdit, id, dadosCarregados, toast]);

  const selecionarVeiculo = (id: string) => {
    const veiculo = veiculos.find((v) => Number(v.id) === Number(id));
    setFormData((prev) => ({ ...prev, motoristaNome: veiculo ? veiculo.motorista : "" }));
  };

  const adicionarItem = () => {
    setItens((prev) => [...prev, { tabelaPrecoId: 0, unidade: "", produto: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  };

  const removerItem = (index: number) => {
    setItens((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const atualizarItem = (index: number, campo: keyof ItemFrete, valor: any) => {
    setItens((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], [campo]: valor } as ItemFrete;

      if (campo === "quantidade" || campo === "valorUnitario") {
        const q = Number(novos[index].quantidade) || 0;
        const v = Number(novos[index].valorUnitario) || 0;
        novos[index].valorTotal = q * v;
      }

      return novos;
    });
  };

  // Buscar produto no banco
  const handleGetProduto = async (valor: string) => {
    if (!valor.trim()) return [];

    const raw = localStorage.getItem("gsfretes_user") || "{}";
    const token = JSON.parse(raw).token || "";

    const condicao = !isNaN(Number(valor.trim())) ? `ID = ${parseInt(valor)}` : `UPPER(UNIDADE) LIKE '%${valor.toUpperCase()}%'`;

    try {
      const res = await api.post(
        "/api/produto-lista",
        { condicao, ordem: "UNIDADE" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data || [];
    } catch (error) {
      console.error("Erro ao buscar produto", error);
      return [];
    }
  };

  const calcularValorTotal = () => itens.reduce((acc, i) => acc + (Number(i.valorTotal) || 0), 0);

  function formatDate(date: Date) {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}.${mes}.${ano}`;
  }

  const toBR = (iso: string) => {
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

    if (!formData.clienteId || !formData.origem || !formData.destino || !formData.veiculoId) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (formData.formaPg === "APRAZO" && !formData.vencimento) {
      toast({ title: "Erro", description: "Informe a data de vencimento para pagamento a prazo", variant: "destructive" });
      return;
    }

    if (itens.some(i => Number(i.quantidade) <= 0 || Number(i.valorUnitario) <= 0)) {
      toast({ title: "Erro", description: "Verifique os itens do frete (preço ou quantidade inválidos).", variant: "destructive" });
      return;
    }

    try {
      const raw = localStorage.getItem("gsfretes_user") || "{}";
      const token = JSON.parse(raw).token || "";

      const dataBR = todayBR();
      const vencimentoBR = formData.formaPg === "APRAZO" && formData.vencimento ? toBR(formData.vencimento) : "";

      const payload = {
        ...(isEdit ? { codigo: String(id) } : { codigo: "" }),
        data: dataBR,
        formapg: formData.formaPg.toUpperCase(),
        cliente: String(formData.clienteId),
        seqfin: "",
        vencimento: vencimentoBR,
        veiculo: String(formData.veiculoId),
        origem: (formData.origem || "").toUpperCase(),
        destino: (formData.destino || "").toUpperCase(),
        valor: calcularValorTotal().toFixed(2),
        obs: (formData.observacoes || "").toUpperCase(),
        itens: itens.map((item, idx) => ({
          codigo: "",
          item: String(idx + 1),
          produto: String(item.tabelaPrecoId || "0"),
          quantidade: String(item.quantidade),
          descricao: (item.produto || "").toUpperCase(),
          unitario: Number(item.valorUnitario).toFixed(2),
          total: Number(item.valorTotal).toFixed(2),
        })),
      };

      console.log("Payload enviado:", payload);

      const res = await api.post("/api/fretes-registra", payload, { headers: { Authorization: `Bearer ${token}` } });

      const codigoFrete = res.data?.codigo || (isEdit ? String(id) : null);
      if (!codigoFrete) throw new Error("Código do frete não retornado pela API");

      // if (!isEdit) {
      //   const numeroFrete = `FRT-${String(codigoFrete).padStart(3, "0")}`;
      //   const agora = new Date();

      //   const receitaPayload = {
      //     codigo: "",
      //     parcela: "1",
      //     cliente: String(formData.clienteId),
      //     documento: numeroFrete,
      //     data: formatarDataComHoraBR(agora),
      //     vencimento: vencimentoBR || todayBR(),
      //     valor: calcularValorTotal().toFixed(2),
      //     obs: `SERVIÇO PRESTADO FRETE PARA ${(formData.destino || "").toUpperCase()}`,
      //   };

      //   await api.post("/api/receitas-registra", receitaPayload, { headers: { Authorization: `Bearer ${token}` } });
      // }

      toast({ title: "Sucesso", description: isEdit ? "Frete atualizado" : "Frete criado" });
      router.push("/dashboard/fretes");
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const resp = err.response;
        const cfg = err.config;
        console.error("AXIOS ERROR ::", { url: cfg?.url, method: cfg?.method, status: resp?.status, responseData: resp?.data });
        const backendMsg = (typeof resp?.data === "string" && resp.data) || resp?.data?.mensagem || resp?.data?.message || err.message;
        toast({ title: "Erro ao salvar", description: backendMsg || "Falha ao comunicar com o servidor.", variant: "destructive" });
      } else {
        console.error("UNKNOWN ERROR ::", err);
        toast({ title: "Erro inesperado", description: err?.message || "Tente novamente.", variant: "destructive" });
      }
    }
  };

  // Buscar clientes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (buscaCliente.length < 2) return;
      try {
        const raw = localStorage.getItem("gsfretes_user") || "{}";
        const token = JSON.parse(raw).token || "";
        const res = await api.post(
          "/api/cliente-lista",
          { condicao: `UPPER(NOME) LIKE '%${buscaCliente.toLocaleUpperCase()}%'`, ordem: "NOME" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResultadosCliente(res.data || []);
      } catch (error) {
        console.error("Erro buscar clientes", error);
        setResultadosCliente([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaCliente]);

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome || "");

    const enderecoCompleto = `${cliente.endereco || ""}, ${cliente.numero || ""} - ${cliente.cidade || ""}`;

    setFormData((prev) => ({
      ...prev,
      clienteId: cliente.id || 0,
      destino: enderecoCompleto,
    }));

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
                    <div key={c.id} onClick={() => selecionarCliente(c)} className="p-2 hover:bg-gray-100 cursor-pointer">
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
                <Input disabled={bloquearEdicao} value={formData.origem} onChange={(e) => setFormData((p) => ({ ...p, origem: e.target.value }))} />
              </div>
              <div>
                <Label>Destino *</Label>
                <Input disabled={bloquearEdicao} value={formData.destino} onChange={(e) => setFormData((p) => ({ ...p, destino: e.target.value }))} />
              </div>
            </div>

            {/* Forma de pagamento */}
            <div>
              <Label>Forma de Pagamento *</Label>
              <Select disabled={bloquearEdicao} value={formData.formaPg} onValueChange={(v) => setFormData((p) => ({ ...p, formaPg: v }))}>
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
                <Input disabled={bloquearEdicao} type="date" value={formData.vencimento} onChange={(e) => setFormData((p) => ({ ...p, vencimento: e.target.value }))} />
              </div>
            )}

            {/* Veículo */}
            <div>
              <Label>Veículo *</Label>
              <Select
                disabled={bloquearEdicao}
                value={String(formData.veiculoId)}
                onValueChange={(value) => {
                  selecionarVeiculo(value);
                  setFormData((prev) => ({ ...prev, veiculoId: Number(value) }));
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
              <Textarea disabled={bloquearEdicao} value={formData.observacoes} onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))} />
            </div>

            {/* ITENS DO FRETE */}
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-2 font-semibold text-sm px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Unidade</div>
                <div className="col-span-2">Quantidade</div>
                <div className="col-span-2">Valor Unitário</div>
                <div className="col-span-3">Produto</div>
                <div className="col-span-2">Total</div>
              </div>

              {itens.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 border rounded-md">
                  <div className="flex items-center gap-2 col-span-1">
                    <span className="font-medium">#{index + 1}</span>
                    {itens.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removerItem(index)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="relative col-span-2">
                    <Input
                      disabled={bloquearEdicao}
                      value={item.unidade || ""}
                      onChange={async (e) => {
                        const termo = e.target.value;
                        atualizarItem(index, "unidade", termo);

                        if (termo.length > 1) {
                          const lista = await handleGetProduto(termo);
                          setResultadosProduto((prev) => ({ ...prev, [index]: Array.isArray(lista) ? lista : [] }));
                        } else {
                          setResultadosProduto((prev) => ({ ...prev, [index]: [] }));
                        }
                      }}
                      placeholder="Digite o nome do produto"
                    />

                    {resultadosProduto[index]?.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-auto">
                        {resultadosProduto[index].map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              const preco = Number(String(p.preco).replace(",", ".")) || 0;
                              setItens((prev) => {
                                const novos = [...prev];
                                novos[index] = {
                                  ...novos[index],
                                  tabelaPrecoId: Number(p.id) || 0,
                                  unidade: p.unidade || novos[index].unidade,
                                  valorUnitario: preco,
                                  valorTotal: preco * (Number(novos[index].quantidade) || 1),
                                };
                                return novos;
                              });
                              setResultadosProduto((prev) => ({ ...prev, [index]: [] }));
                            }}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {p.nome} - {p.unidade}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Input
                      disabled={bloquearEdicao}
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(index, "quantidade", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      disabled={bloquearEdicao}
                      type="number"
                      value={item.valorUnitario}
                      onChange={(e) => atualizarItem(index, "valorUnitario", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-3">
                    <Input disabled={bloquearEdicao} placeholder="Descrição" value={item.produto} onChange={(e) => atualizarItem(index, "produto", e.target.value)} />
                  </div>

                  <div className="col-span-2">
                    <Input disabled value={`R$ ${Number(item.valorTotal || 0).toFixed(2)}`} className="bg-muted" />
                  </div>
                </div>
              ))}

              <Button disabled={bloquearEdicao} type="button" onClick={adicionarItem} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Item
              </Button>
            </div>

            <div className="text-right text-lg font-bold">Total do Frete: R$ {calcularValorTotal().toFixed(2)}</div>

            <Button disabled={bloquearEdicao} type="submit" className="w-full">Salvar Frete</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
