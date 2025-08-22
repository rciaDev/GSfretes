


// async function buscaCep(cep){
//     let response = {};

//     if(cep.length >= 8){
//         const data = await cnpj.get(`https://viacep.com.br/ws/${cep}/json`)

//         response = data.data;            
        
//         return response;
//     }
//     return response;
// }


export function formataCelular(numero: string): string {
  if (!numero) return "";
  const numeroLimpo = numero.replace(/\D/g, "");

  // Para números com DDD + celular (11 dígitos)
  if (numeroLimpo.length === 11) {
    return numeroLimpo.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  // Para números com DDD + fixo (10 dígitos)
  if (numeroLimpo.length === 10) {
    return numeroLimpo.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  // Para quando o usuário ainda está digitando (parcial)
  if (numeroLimpo.length <= 2) {
    return `(${numeroLimpo}`;
  } else if (numeroLimpo.length <= 6) {
    return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2)}`;
  } else {
    return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7)}`;
  }
}


export function formatarDocumento(valor: string) {
  if (!valor) return "";

  const apenasNumeros = valor.replace(/\D/g, "");

  // Se tiver 11 dígitos = CPF
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );
  }

  // Se tiver 14 dígitos = CNPJ
  if (apenasNumeros.length === 14) {
    return apenasNumeros.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  // Se não for CPF nem CNPJ válido, retorna sem máscara
  return valor;
}
