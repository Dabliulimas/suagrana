/**
 * Utilitários para padronizar respostas da API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

/**
 * Resposta de sucesso padronizada
 */
export const successResponse = <T>(
  data: T,
  message: string = "Operação realizada com sucesso",
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Resposta de erro padronizada
 */
export const errorResponse = (
  message: string,
  code?: string,
  error?: string,
): ApiResponse => {
  return {
    success: false,
    message,
    code,
    error,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const paginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = "Dados recuperados com sucesso",
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};
