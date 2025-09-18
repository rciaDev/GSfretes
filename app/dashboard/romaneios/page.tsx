"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import api from "@/app/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipagem da API
interface FreteAPI {
  codigo: string;
  data: string;
  formapg: string;
  cliente: string;
  nome: string; // <-- novo campo
  origem: string;
  destino: string;
  valor: string;
  obs?: string;
  itens: {
    descricao: string;
    quantidade: string;
    unitario: string;
    unidade: string;
    total: string;
  }[];
}


// Tipagem interna para tabela
export type Frete = {
  id: string;
  numero: string;
  data: string;
  cliente: string;
  origem: string;
  destino: string;
  obs?: string;
  valorTotal: number;
  itens: {
    descricao: string;
    quantidade: string;
    unidade: string;
    unitario: string;
    total: string;
  }[];
};

export const columns: ColumnDef<Frete>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "data",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("data")}</div>,
  },
  {
    accessorKey: "numero",
    header: "Número",
    cell: ({ row }) => <div className="font-medium">{row.getValue("numero")}</div>,
  },
  {
    accessorKey: "cliente",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Cliente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("cliente")}</div>,
  },
  {
    accessorKey: "origem",
    header: "Origem",
    cell: ({ row }) => <div>{row.getValue("origem")}</div>,
  },
  {
    accessorKey: "destino",
    header: "Destino",
    cell: ({ row }) => <div>{row.getValue("destino")}</div>,
  },
  {
    accessorKey: "valorTotal",
    header: () => <div className="text-right">Valor Total</div>,
    cell: ({ row }) => {
      const valor = parseFloat(row.getValue("valorTotal"));
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valor);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];

export default function DataTableFretes() {
  const [data, setData] = React.useState<Frete[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [filterTerm, setFilterTerm] = React.useState("");



  const carregarFretes = async (filterTerm: string = "") => {
    console.log("entrou aqui")
    try {
      let condicao = "";
      if (filterTerm.trim()) {
        console.log("filtro", filterTerm)
        const termo = filterTerm.toUpperCase();
        condicao = `(C.NOME LIKE '%${termo}%' OR F.ORIGEM LIKE '%${termo}%' OR F.DESTINO LIKE '%${termo}%')`;
      }
      console.log("condição", condicao)

      const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

      const res = await api.post(
        "/api/fretes-lista",
        { condicao, ordem: "CODIGO" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const dados: FreteAPI[] = res.data;

      const mapped = dados.map((f) => ({
        id: f.codigo,
        numero: `FRT-${f.codigo.padStart(3, "0")}`,
        data: f.data,
        cliente: f.nome,
        origem: f.origem,
        obs: f.obs,
        destino: f.destino,
        valorTotal: parseFloat(f.valor),
        itens: f.itens || [],
      }));

      setData(mapped);
    } catch (err) {
      console.error("Erro ao carregar fretes:", err);
      setData([]);
    }
  };

  React.useEffect(() => {
    carregarFretes();
  }, []);


  const handleBuscar = () => {
    carregarFretes(filterTerm)
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });



  // const gerarRomaneio = () => {
  //   const selecionados = table.getSelectedRowModel().rows.map((row) => row.original);

  //   if (selecionados.length === 0) {
  //     toast({
  //       title: "Atenção!",
  //       description: "Selecione ao menos um frete.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   const doc = new jsPDF();
  //   const PAGE_HEIGHT = doc.internal.pageSize.height;
  //   const MARGIN = 14;

  //   let valorTotalGeral = 0;
  //   let posY = 25;
  //   let currentPage = 1;

  //   const origemPadrao = selecionados[0]?.origem;
  //   const destinoPadrao = selecionados[0]?.destino;
  //   const dataPadrao = new Date(selecionados[0]?.data).toLocaleDateString("pt-BR");

  //   // Função para rodapé
  //   const drawFooter = (pageNumber: number) => {
  //     const footerY = PAGE_HEIGHT - 20;
  //     doc.setFontSize(10);
  //     doc.text("Observações Gerais:", MARGIN, footerY - 10);
  //     doc.line(MARGIN, footerY - 5, 190, footerY - 5);

  //     doc.text("Recebido por:", MARGIN, footerY + 2);
  //     doc.line(MARGIN, footerY + 7, 90, footerY + 7);

  //     doc.text("Data: ____/____/____", 120, footerY + 2);
  //     doc.text(`Página ${pageNumber}`, 180, footerY + 2, { align: "right" });
  //   };

  //   // Cabeçalho inicial
  //   doc.setFontSize(16);
  //   doc.text("Romaneio de Fretes", MARGIN, 15);

  //   selecionados.forEach((frete, index) => {
  //     // Quebra de página
  //     if (posY > PAGE_HEIGHT - 60) {
  //       drawFooter(currentPage);
  //       doc.addPage();
  //       currentPage++;
  //       posY = 25;
  //     }

  //     const dataFrete = new Date(frete.data).toLocaleDateString("pt-BR");

  //     // Cabeçalho do frete
  //     doc.setFontSize(12);
  //     doc.text(`Frete: ${frete.numero}     Cliente: ${frete.cliente}`, MARGIN, posY);
  //     posY += 6;

  //     // if (frete.origem !== origemPadrao) {
  //     //   doc.text(`Origem: ${frete.origem}`, MARGIN, posY);
  //     //   posY += 6;
  //     // }

  //     // if (frete.destino !== destinoPadrao) {
  //     //   doc.text(`Destino: ${frete.destino}`, MARGIN, posY);
  //     //   posY += 6;
  //     // }


  //     if (frete.origem) {
  //       doc.text(`Origem: ${frete.origem.toUpperCase()}`, MARGIN, posY);
  //       posY += 6;
  //     }


  //     if (frete.destino) {
  //       doc.text(`Destino: ${frete.destino.toUpperCase()}`, MARGIN, posY);
  //       posY += 6;
  //     }



  //     // if (dataFrete !== dataPadrao) {
  //     //   doc.text(`Data: ${dataFrete}`, MARGIN, posY);
  //     //   posY += 6;
  //     // }

  //     if (dataFrete) {
  //       doc.text(`Data: ${dataFrete}`, MARGIN, posY);
  //       posY += 6;
  //     }

  //     // Tabela de itens
  //     const itens = frete.itens.map((item) => [
  //       item.unidade,
  //       item.descricao,
  //       item.quantidade,
  //       `R$ ${parseFloat(item.unitario).toFixed(2)}`,
  //       `R$ ${parseFloat(item.total).toFixed(2)}`,
  //     ]);

  //     autoTable(doc, {
  //       startY: posY,
  //       head: [["Unidade", "Descrição", "Qtd", "Unitário", "Total"]],
  //       body: itens,
  //       styles: { fontSize: 10 },
  //       margin: { left: MARGIN, right: MARGIN },
  //       didDrawPage: (data) => {
  //         posY = (data.cursor?.y ?? posY) + 10;
  //       },
  //     });

  //     // Observação
  //     if (frete.obs && frete.obs.trim() !== "") {
  //       doc.setFontSize(10);
  //       doc.text(`Observação: ${frete.obs}`, MARGIN, posY);
  //       posY += 6;
  //     }

  //     // Subtotal
  //     valorTotalGeral += frete.valorTotal;
  //     doc.setFontSize(12);
  //     doc.text(`Subtotal Frete: R$ ${frete.valorTotal.toFixed(2)}`, MARGIN, posY);
  //     posY += 15;
  //   });

  //   // Rodapé final da última página
  //   drawFooter(currentPage);

  //   // Total geral
  //   doc.setFontSize(14);
  //   doc.text(`Total de Fretes: ${selecionados.length}     Valor Total: R$ ${valorTotalGeral.toFixed(2)}`, MARGIN, posY);

  //   // doc.save("romaneio.pdf");
  //   doc.autoPrint();
  //   doc.output("dataurlnewwindow");
  // };

  const gerarRomaneio = async () => {
    const selecionados = table.getSelectedRowModel().rows.map((row) => row.original);

    if (selecionados.length === 0) {
      toast({
        title: "Atenção!",
        description: "Selecione ao menos um frete.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const PAGE_HEIGHT = doc.internal.pageSize.height;
    const MARGIN = 14;

    let valorTotalGeral = 0;
    let posY = 40;
    let currentPage = 1;

    // Função para rodapé
    const drawFooter = (pageNumber: any) => {
      const footerY = PAGE_HEIGHT - 20;
      doc.setFontSize(10);
      doc.text("Observações Gerais:", MARGIN, footerY - 10);
      doc.line(MARGIN, footerY - 5, 190, footerY - 5);
      doc.text("Recebido por:", MARGIN, footerY + 2);
      doc.line(MARGIN, footerY + 7, 90, footerY + 7);
      doc.text("Data: ____/____/____", 120, footerY + 2);
      doc.text(`Página ${pageNumber}`, 180, footerY + 2, { align: "right" });
    };

    // Função para adicionar cabeçalho
    const drawHeader = async (doc: any) => {
      const logoPath = '/logo.jpg';
      try {
        const img = new Image();
        img.src = logoPath;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });

        doc.addImage(logoPath, 'PNG', MARGIN, 10, 30, 20);
      } catch { }
      doc.setFontSize(16);
      doc.text("Lancha Nova Martins", MARGIN + 35, 15);
      doc.setFontSize(12);
      doc.text("TRANSPORTE DE CARGAS E PASSAGEIROS", MARGIN + 35, 20);
      doc.text("DOUGLAS S. MARTINS", MARGIN + 35, 25);
      doc.text(`(67) 9.9805-1767 / 9.9639-0959`, MARGIN + 35, 30);
      doc.text("PORTO DONA EMÍLIA", MARGIN + 35, 35);
      // doc.text("Nova Martins", MARGIN + 190, 35, { align: "right" });
      doc.line(MARGIN, 38, 190, 38);
      doc.setFontSize(16);
      // doc.text("Romaneio de Fretes", MARGIN, 43);
      posY = 50;
    };

    await drawHeader(doc);

    for (const frete of selecionados) {
      // 🔹 Cabeçalho do cliente
      doc.setFontSize(12);
      doc.text(`Cliente: ${frete.cliente}`, MARGIN, posY);
      posY += 6;
      doc.text(`Número do Frete: ${frete.numero}`, MARGIN, posY);
      posY += 6;

      // 🔹 Dados principais do frete
      if (frete.origem) {
        doc.text(`Origem: ${frete.origem.toUpperCase()}`, MARGIN, posY);
        posY += 6;
      }
      if (frete.destino) {
        doc.text(`Destino: ${frete.destino.toUpperCase()}`, MARGIN, posY);
        posY += 6;
      }
      if (frete.data) {
        doc.text(`Data: ${frete.data}`, MARGIN, posY);
        posY += 6;
      }

      // 🔹 Tabela de itens
      const itens = frete.itens.map(item => [
        item.unidade,
        item.descricao,
        item.quantidade,
        `R$ ${parseFloat(item.unitario).toFixed(2)}`,
        `R$ ${parseFloat(item.total).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: posY,
        head: [["Unidade", "Descrição", "Qtd", "Unitário", "Total"]],
        body: itens,
        styles: { fontSize: 10 },
        margin: { left: MARGIN, right: MARGIN },
        didDrawPage: (data) => {
          posY = (data.cursor?.y ?? posY) + 10;
          if (data.pageNumber > currentPage) {
            currentPage = data.pageNumber;
            drawHeader(doc);
          }
        },
      });

      // 🔹 Observação destacada
      if (frete.obs) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`Observação: ${frete.obs}`, MARGIN, posY);
        doc.setFont("helvetica", "normal");
        posY += 8;
      }

      // 🔹 Subtotal
      valorTotalGeral += frete.valorTotal;
      doc.setFontSize(12);
      doc.text(`Subtotal Frete: R$ ${frete.valorTotal.toFixed(2)}`, MARGIN, posY);
      posY += 15;
    }


    drawFooter(currentPage);
    doc.setFontSize(14);
    doc.text(`Total de Fretes: ${selecionados.length}     Valor Total: R$ ${valorTotalGeral.toFixed(2)}`, MARGIN, posY);

    doc.autoPrint();
    doc.output("dataurlnewwindow");
  };





  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Romaneios</CardTitle>
          <CardDescription>Selecione fretes para imprimir o romaneio.</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filtro */}
          <div className="flex items-center py-4">
            <div className="flex gap-5">
              <Input
                placeholder="Filtrar por cliente, origem ou destino..."
                value={filterTerm}
                onChange={(event) => setFilterTerm(event.target.value)}
                className="max-w-[600px]"
              />
              <Button onClick={handleBuscar}>Buscar</Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Colunas <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="default" className="ml-4" onClick={gerarRomaneio}>
              Gerar Romaneio
            </Button>
          </div>

          {/* Tabela */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Nenhum resultado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-muted-foreground flex-1 text-sm">
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} frete(s) selecionados.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
