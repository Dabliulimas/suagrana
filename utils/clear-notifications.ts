/**
 * Utilitário para limpar completamente as notificações do localStorage
 * Execute no console do navegador para limpar dados antigos
 */

export const clearAllNotificationData = () => {
  // Remover todos os tipos possíveis de notificações armazenadas
  const keysToRemove = [
    'suagrana-notifications',
    'notifications',
    'read-notifications',
    'notificationSettings',
    'smart-notifications'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removido: ${key}`);
  });
  
  console.log('Todas as notificações foram limpas do localStorage');
  console.log('Recarregue a página para ver apenas notificações baseadas em dados reais');
};

// Função para inspecionar o que está no localStorage
export const inspectNotificationData = () => {
  console.log('=== INSPEÇÃO DE NOTIFICAÇÕES ===');
  
  const keys = [
    'suagrana-notifications',
    'notifications', 
    'read-notifications',
    'notificationSettings'
  ];
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`${key}:`, parsed);
      } catch (e) {
        console.log(`${key} (raw):`, data);
      }
    } else {
      console.log(`${key}: não encontrado`);
    }
  });
};

// Função para forçar regeneração apenas com dados reais
export const forceRealNotifications = () => {
  // Primeiro, limpar tudo
  clearAllNotificationData();
  
  // Recarregar a página para garantir estado limpo
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  (window as any).clearAllNotificationData = clearAllNotificationData;
  (window as any).inspectNotificationData = inspectNotificationData;
  (window as any).forceRealNotifications = forceRealNotifications;
}
