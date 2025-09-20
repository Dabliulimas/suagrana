"use client";

import { useCallback } from 'react';
import { logComponents } from "../lib/logger";
import { getDataLayer } from '../lib/data-layer';

/**
 * Hook para configuração de autenticação em desenvolvimento
 */
export function useDevAuth() {
  const setDevToken = useCallback(() => {
    try {
      console.log('🔧 useDevAuth: Configurando token de desenvolvimento...');
      
      // Token de desenvolvimento simulado
      const devToken = 'dev-token-' + Date.now();
      
      // Configurar no localStorage
      localStorage.setItem('auth_token', devToken);
      console.log('🔧 useDevAuth: Token salvo no localStorage:', devToken);
      
      // Configurar no DataLayer
      const dataLayer = getDataLayer();
      if (dataLayer && typeof dataLayer.setAuthToken === 'function') {
        dataLayer.setAuthToken(devToken);
        console.log('🔧 useDevAuth: Token configurado no DataLayer');
        
        // Tornar DataLayer globalmente disponível para debug
        if (typeof window !== 'undefined') {
          (window as any).dataLayer = dataLayer;
          console.log('🔧 useDevAuth: DataLayer disponível globalmente em window.dataLayer');
        }
      } else {
        console.error('🔧 useDevAuth: DataLayer não disponível ou método setAuthToken não encontrado');
      }
      
      console.log('🔧 useDevAuth: Configuração de desenvolvimento concluída');
    } catch (error) {
      logComponents.error("🔧 useDevAuth: Erro ao configurar token de desenvolvimento:", error);
    }
  }, []);

  return {
    setDevToken
  };
}
