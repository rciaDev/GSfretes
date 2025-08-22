// // src/services/http.ts
// import api from './api'

// // GET genérico
// export async function get<T = any>(url: string): Promise<T> {
//   try {
//     const { data } = await api.get<T>(url)
//     return data
//   } catch (err: any) {
//     const msg =
//       err.response?.data?.message ||
//       err.response?.data?.erro ||
//       err.message ||
//       'Erro desconhecido'
//     throw new Error(msg)
//   }
// }

// // POST genérico
// export async function post<T = any, U = any>(
//   url: string,
//   body: U
// ): Promise<T> {
//   try {
//     const { data } = await api.post<T>(url, body)
//     return data
//   } catch (err: any) {
//     const msg =
//       err.response?.data?.message ||
//       err.response?.data?.erro ||
//       err.message ||
//       'Erro desconhecido'
//     throw new Error(msg)
//   }
// }

// // PUT genérico
// export async function put<T = any, U = any>(
//   url: string,
//   body: U
// ): Promise<T> {
//   try {
//     const { data } = await api.put<T>(url, body)
//     return data
//   } catch (err: any) {
//     const msg =
//       err.response?.data?.message ||
//       err.response?.data?.erro ||
//       err.message ||
//       'Erro desconhecido'
//     throw new Error(msg)
//   }
// }

// // DELETE genérico
// export async function remove<T = any>(url: string): Promise<T> {
//   try {
//     const { data } = await api.delete<T>(url)
//     return data
//   } catch (err: any) {
//     const msg =
//       err.response?.data?.message ||
//       err.response?.data?.erro ||
//       err.message ||
//       'Erro desconhecido'
//     throw new Error(msg)
//   }
// }
// 