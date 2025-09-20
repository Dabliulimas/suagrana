"use client";

import { toast } from "sonner";

import { logComponents } from "./logger";
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduledNotification {
  id: string;
  payload: PushNotificationPayload;
  scheduledFor: Date;
  recurring?: {
    type: "daily" | "weekly" | "monthly";
    interval?: number;
  };
  conditions?: {
    onlineOnly?: boolean;
    timeRange?: { start: string; end: string };
  };
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private scheduledNotifications: ScheduledNotification[] = [];
  private notificationQueue: PushNotificationPayload[] = [];

  private constructor() {
    this.loadScheduledNotifications();
    this.setupPeriodicCheck();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      await this.setupMessageListener();
      return true;
    } catch (error) {
      logComponents.error("Failed to initialize push notification service:", error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("Notifications not supported");
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      await this.setupPushSubscription();
      toast.success("Notificações ativadas com sucesso!");
    } else {
      toast.error("Permissão de notificação negada");
    }

    return permission;
  }

  private async setupPushSubscription(): Promise<void> {
    if (!this.registration) return;

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Create new subscription
        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "demo-key";

        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        });

        // Store subscription on server (in a real app)
        console.log("Push subscription created:", this.subscription);
      }
    } catch (error) {
      logComponents.error("Failed to setup push subscription:", error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async setupMessageListener(): Promise<void> {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        this.handleNotificationClick(event.data.payload);
      }
    });
  }

  private handleNotificationClick(data: any): void {
    if (data.url) {
      window.open(data.url, "_blank");
    }

    if (data.action) {
      this.executeNotificationAction(data.action, data);
    }
  }

  private executeNotificationAction(action: string, data: any): void {
    switch (action) {
      case "view_transaction":
        window.location.href = "/transactions";
        break;
      case "view_investment":
        window.location.href = "/investments";
        break;
      case "view_goal":
        window.location.href = "/goals";
        break;
      case "add_transaction":
        // Trigger transaction modal
        window.dispatchEvent(new CustomEvent("open-transaction-modal"));
        break;
      default:
        console.log("Unknown notification action:", action);
    }
  }

  async showNotification(payload: PushNotificationPayload): Promise<void> {
    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    if (!this.registration) {
      // Fallback to browser notification
      this.showBrowserNotification(payload);
      return;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/icon-192.png",
        image: payload.image,
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: payload.timestamp || Date.now(),
        vibrate: payload.vibrate || [200, 100, 200],
      });
    } catch (error) {
      logComponents.error("Failed to show notification:", error);
      this.showBrowserNotification(payload);
    }
  }

  private showBrowserNotification(payload: PushNotificationPayload): void {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      timestamp: payload.timestamp || Date.now(),
      vibrate: payload.vibrate || [200, 100, 200],
    });

    notification.onclick = () => {
      this.handleNotificationClick(payload.data);
      notification.close();
    };
  }

  scheduleNotification(
    notification: Omit<ScheduledNotification, "id">,
  ): string {
    const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledNotification: ScheduledNotification = {
      id,
      ...notification,
    };

    this.scheduledNotifications.push(scheduledNotification);
    this.saveScheduledNotifications();

    return id;
  }

  cancelScheduledNotification(id: string): boolean {
    const index = this.scheduledNotifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.scheduledNotifications.splice(index, 1);
      this.saveScheduledNotifications();
      return true;
    }
    return false;
  }

  getScheduledNotifications(): ScheduledNotification[] {
    return [...this.scheduledNotifications];
  }

  private setupPeriodicCheck(): void {
    // Check every minute for scheduled notifications
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000);

    // Initial check
    setTimeout(() => {
      this.checkScheduledNotifications();
    }, 1000);
  }

  private checkScheduledNotifications(): void {
    const now = new Date();
    const toTrigger: ScheduledNotification[] = [];
    const toKeep: ScheduledNotification[] = [];

    this.scheduledNotifications.forEach((notification) => {
      if (notification.scheduledFor <= now) {
        // Check conditions
        if (this.shouldTriggerNotification(notification)) {
          toTrigger.push(notification);

          // Handle recurring notifications
          if (notification.recurring) {
            const nextNotification =
              this.createRecurringNotification(notification);
            if (nextNotification) {
              toKeep.push(nextNotification);
            }
          }
        }
      } else {
        toKeep.push(notification);
      }
    });

    // Update scheduled notifications
    this.scheduledNotifications = toKeep;
    this.saveScheduledNotifications();

    // Trigger notifications
    toTrigger.forEach((notification) => {
      this.showNotification(notification.payload);
    });
  }

  private shouldTriggerNotification(
    notification: ScheduledNotification,
  ): boolean {
    const conditions = notification.conditions;
    if (!conditions) return true;

    // Check online status
    if (conditions.onlineOnly && !navigator.onLine) {
      return false;
    }

    // Check time range
    if (conditions.timeRange) {
      const now = new Date();
      const currentTime =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");

      if (
        currentTime < conditions.timeRange.start ||
        currentTime > conditions.timeRange.end
      ) {
        return false;
      }
    }

    return true;
  }

  private createRecurringNotification(
    notification: ScheduledNotification,
  ): ScheduledNotification | null {
    if (!notification.recurring) return null;

    const nextDate = new Date(notification.scheduledFor);
    const { type, interval = 1 } = notification.recurring;

    switch (type) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7 * interval);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
    }

    return {
      ...notification,
      id: `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduledFor: nextDate,
    };
  }

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  private loadScheduledNotifications(): void {
    logComponents.info("loadScheduledNotifications foi removida - localStorage não é mais usado");
    this.scheduledNotifications = [];
  }

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  private saveScheduledNotifications(): void {
    logComponents.info("saveScheduledNotifications foi removida - localStorage não é mais usado");
  }

  // Financial-specific notification helpers
  async notifyBillReminder(
    billName: string,
    amount: number,
    dueDate: Date,
  ): Promise<void> {
    await this.showNotification({
      title: "💳 Lembrete de Conta",
      body: `${billName} vence em breve: R$ ${amount.toFixed(2)}`,
      icon: "/icon-192.png",
      tag: "bill-reminder",
      data: { type: "bill", url: "/bills-reminders" },
      actions: [
        { action: "view_bills", title: "Ver Contas" },
        { action: "add_transaction", title: "Pagar Agora" },
      ],
      requireInteraction: true,
    });
  }

  async notifyGoalAchieved(goalName: string, amount: number): Promise<void> {
    await this.showNotification({
      title: "🎯 Meta Alcançada!",
      body: `Parabéns! Você atingiu a meta "${goalName}" de R$ ${amount.toFixed(2)}`,
      icon: "/icon-192.png",
      tag: "goal-achieved",
      data: { type: "goal", url: "/goals" },
      actions: [{ action: "view_goal", title: "Ver Metas" }],
      vibrate: [200, 100, 200, 100, 200],
    });
  }

  async notifyInvestmentAlert(
    ticker: string,
    currentPrice: number,
    targetPrice: number,
  ): Promise<void> {
    const isAbove = currentPrice > targetPrice;
    await this.showNotification({
      title: `📈 Alerta de Investimento`,
      body: `${ticker} ${isAbove ? "subiu para" : "caiu para"} R$ ${currentPrice.toFixed(2)}`,
      icon: "/icon-192.png",
      tag: "investment-alert",
      data: { type: "investment", ticker, url: "/investments" },
      actions: [{ action: "view_investment", title: "Ver Investimentos" }],
    });
  }

  async notifyBudgetExceeded(
    category: string,
    spent: number,
    budget: number,
  ): Promise<void> {
    const percentage = Math.round((spent / budget) * 100);
    await this.showNotification({
      title: "⚠️ Orçamento Excedido",
      body: `Você gastou ${percentage}% do orçamento em ${category}`,
      icon: "/icon-192.png",
      tag: "budget-exceeded",
      data: { type: "budget", category, url: "/budget" },
      actions: [{ action: "view_budget", title: "Ver Orçamento" }],
      requireInteraction: true,
    });
  }

  // Queue notifications for offline scenarios
  queueNotification(payload: PushNotificationPayload): void {
    this.notificationQueue.push(payload);
    this.saveNotificationQueue();
  }

  async processQueuedNotifications(): Promise<void> {
    if (!navigator.onLine || this.notificationQueue.length === 0) return;

    const queue = [...this.notificationQueue];
    this.notificationQueue = [];
    this.saveNotificationQueue();

    for (const notification of queue) {
      await this.showNotification(notification);
      // Small delay between notifications
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  private saveNotificationQueue(): void {
    logComponents.info("saveNotificationQueue foi removida - localStorage não é mais usado");
  }

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  private loadNotificationQueue(): void {
    logComponents.info("loadNotificationQueue foi removida - localStorage não é mais usado");
    this.notificationQueue = [];
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

// Auto-initialize when online
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    pushNotificationService.initialize();
  });

  // Process queued notifications when coming online
  window.addEventListener("online", () => {
    pushNotificationService.processQueuedNotifications();
  });
}
