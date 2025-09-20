"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Filter,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSmartNotifications, SmartNotification } from '../lib/notifications/smart-notifications';

interface NotificationItemProps {
  notification: SmartNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  onDismiss 
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50';
      case 'low':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const handleActionClick = () => {
    onMarkAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      className={`
        border-l-4 p-4 mb-3 rounded-r-lg transition-all duration-200
        ${getPriorityColor()}
        ${notification.isRead ? 'opacity-60' : 'opacity-100'}
        hover:shadow-md
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {notification.category}
              </Badge>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className={`text-sm mb-3 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            
            <div className="flex gap-2">
              {notification.actionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleActionClick}
                  className="text-xs px-2 py-1"
                >
                  {notification.actionLabel}
                </Button>
              )}
              
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs px-2 py-1"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Marcar como lida
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SmartNotificationCenter: React.FC = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useSmartNotifications();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const categories = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'budget', label: 'Orçamento', count: notifications.filter(n => n.category === 'budget').length },
    { id: 'goal', label: 'Metas', count: notifications.filter(n => n.category === 'goal').length },
    { id: 'general', label: 'Geral', count: notifications.filter(n => n.category === 'general').length },
  ];

  const filteredNotifications = notifications.filter(notification => {
    const categoryMatch = selectedCategory === 'all' || notification.category === selectedCategory;
    const readMatch = !showOnlyUnread || !notification.isRead;
    return categoryMatch && readMatch;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Central de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Central de Notificações Inteligente
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className="text-xs"
            >
              {showOnlyUnread ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Mostrar todas
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Só não lidas
                </>
              )}
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="text-xs"
              >
                {category.label}
                {category.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id}>
              <ScrollArea className="h-[400px] pr-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {selectedCategory === 'all' 
                        ? 'Nenhuma notificação disponível' 
                        : `Nenhuma notificação de ${category.label.toLowerCase()}`
                      }
                    </p>
                    {showOnlyUnread && (
                      <p className="text-sm text-gray-500 mt-2">
                        Todas as notificações foram lidas ✓
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {unreadCount} não lidas de {notifications.length} total
              </span>
              <span className="flex items-center gap-1">
                <BellRing className="w-3 h-3" />
                Atualiza automaticamente
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
