'use client'

import api from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VisualizarFrete() {
    const { id } = useParams();
    const [frete, setFrete] = useState<any>(null);

    useEffect(() => {
        const fetchFrete = async () => {
            try {
                const token = JSON.parse(localStorage.getItem("gsfretes_user") || "{}").token;

                const res = await api.post(
                    "/api/fretes-lista",
                    {
                        condicao: `CODIGO=${id}`,
                        ordem: "codigo",
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setFrete(res.data[0]);
            } catch (error) {
                console.error("Erro ao carregar frete:", error);
            }
        };

        fetchFrete();
    }, [id]);

    if (!frete) {
        return (
            <div className="flex flex-col space-y-3">
                <Skeleton className="h-[225px] w-[350px] rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detalhes do Frete #{frete.codigo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>Cliente:</strong> {frete.nome}</p>
                    <p><strong>Origem:</strong> {frete.origem}</p>
                    <p><strong>Destino:</strong> {frete.destino}</p>
                    <p><strong>Valor Total:</strong> R$ {parseFloat(frete.valor || "0").toFixed(2)}</p>
                    {frete.obs && <p><strong>Observação:</strong> {frete.obs}</p>}

                    <h3 className="text-lg font-bold mt-4">Itens</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Unitário</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {frete.itens.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>{item.descricao}</TableCell>
                                    <TableCell>{item.unidade || "DIVERSOS"}</TableCell>
                                    <TableCell>{item.quantidade}</TableCell>
                                    <TableCell>R$ {parseFloat(item.unitario || "0").toFixed(2)}</TableCell>
                                    <TableCell>R$ {parseFloat(item.total || "0").toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex gap-2 mt-6">
                        <Button asChild>
                            <Link href={`/dashboard/fretes/${frete.codigo}/editar`}>Editar Frete</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/fretes">Voltar</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
