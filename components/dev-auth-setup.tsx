"use client";

import { useEffect } from 'react';
import { useDevAuth } from '../hooks/use-dev-auth';

/**
 * Componente para configurar automaticamente o token de desenvolvimento
 * Remove a dependência do localStorage
 */
export function DevAuthSetup() {
  const { setDevToken } = useDevAuth();

  useEffect(() => {
    console.log('🔧 DevAuthSetup: Iniciando configuração...');
    
    // Verificar se estamos em desenvolvimento através da URL ou outras indicações
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '3000';
    
    console.log('🔧 DevAuthSetup: Ambiente detectado:', isDevelopment ? 'development' : 'production');
    
    // Configurar token de desenvolvimento automaticamente
    if (isDevelopment) {
      console.log('🔧 DevAuthSetup: Configurando token de desenvolvimento...');
      setDevToken();
    } else {
      console.log('🔧 DevAuthSetup: Não é ambiente de desenvolvimento');
    }
  }, [setDevToken]);

  return <div data-testid="dev-auth-setup" style={{ display: 'none' }} />;
}