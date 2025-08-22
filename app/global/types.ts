// Cliente completo
export interface Cliente {
  id: number
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  numero: string
  observacoes: string
}

// Veículos
export interface Veiculos {
  id: number
  identificacao: string  // placa ou código interno
  veiculo: string        // descrição do veículo
  motorista: string      // nome do motorista
}

// Produto (usado em tabela de preço ou item do frete)
export interface Produto {
  id: number
  unidade: string
  preco: number
}

// Tabela de Preço (pode ser associada a Produto)
export interface TabelaPreco {
  id: number
  nome: string
  preco: number
}

// Item de Frete
export interface ItemFrete {
  tabelaPrecoId: number
  produto: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

// Dados principais do Frete
export interface Frete {
  id?: number
  clienteId: number
  clienteNome: string
  origem: string
  destino: string
  veiculoId: number
  motorista: string
  observacoes?: string
  itens: ItemFrete[]
}



// interface Produto {
//   id: number;
//   // nome: string;
//   unidade: string;
//   // tipo: string;
//   preco: number;
//   // descricao: string;
// }


// interface Veiculos {
//     id: number,
//     identificacao: string,
//     veiculo: string,
//     motorista: string,
// }


// interface Cliente {
//   id: number
//   nome: string
//   cnpj: string
//   email: string
//   telefone: string
//   endereco: string
//   cidade: string
//   estado: string
//   cep: string
//   numero: string
//   observacoes: string
// }




// export type {
//   Produto,
//   Veiculos,
//   Cliente
// }
