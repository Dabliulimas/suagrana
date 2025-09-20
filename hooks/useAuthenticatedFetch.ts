import { apiClient } from '../lib/api-client';

/**
 * Hook para fazer requisições autenticadas usando o serviço centralizado
 * @deprecated Use apiClient diretamente em vez deste hook
 */
export function useAuthenticatedFetch() {
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    switch (method.toUpperCase()) {
      case 'GET':
        return apiClient.get(url);
      case 'POST':
        return apiClient.post(url, body);
      case 'PUT':
        return apiClient.put(url, body);
      case 'DELETE':
        return apiClient.delete(url);
      default:
        throw new Error(`Método ${method} não suportado`);
    }
  };

  return authenticatedFetch;
}