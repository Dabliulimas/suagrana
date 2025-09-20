import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

interface AuditEventData {
  tenantId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: "info" | "warning" | "error" | "critical";
  tags?: string[];
  metadata?: Record<string, any>;
}

interface AuditQuery {
  tenantId: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registra um evento de auditoria
   */
  async logEvent(data: AuditEventData): Promise<any> {
    try {
      const auditEvent = await this.prisma.auditEvent.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          severity: data.severity || "info",
          tags: JSON.stringify(data.tags || []),
          metadata: JSON.stringify(data.metadata || {}),
        },
      });

      logger.info("Audit event logged", {
        auditEventId: auditEvent.id,
        entityType: data.entityType,
        action: data.action,
        severity: data.severity,
      });

      return auditEvent;
    } catch (error) {
      logger.error("Failed to log audit event", {
        error: error.message,
        data,
      });
      throw error;
    }
  }

  /**
   * Registra múltiplos eventos de auditoria em batch
   */
  async logEventsBatch(events: AuditEventData[]): Promise<any[]> {
    try {
      const auditEvents = await this.prisma.auditEvent.createMany({
        data: events.map((event) => ({
          tenantId: event.tenantId,
          userId: event.userId,
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.action,
          oldValues: event.oldValues || null,
          newValues: event.newValues || null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          sessionId: event.sessionId,
          severity: event.severity || "info",
          tags: event.tags || [],
          metadata: event.metadata || {},
        })),
      });

      logger.info("Audit events batch logged", {
        count: events.length,
      });

      return auditEvents;
    } catch (error) {
      logger.error("Failed to log audit events batch", {
        error: error.message,
        eventsCount: events.length,
      });
      throw error;
    }
  }

  /**
   * Busca eventos de auditoria com filtros
   */
  async getAuditEvents(query: AuditQuery): Promise<{
    events: any[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      tenantId,
      entityType,
      entityId,
      userId,
      action,
      severity,
      startDate,
      endDate,
      tags,
      limit = 50,
      offset = 0,
    } = query;

    const where: any = { tenantId };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Obtém histórico de mudanças de uma entidade específica
   */
  async getEntityHistory(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<any[]> {
    const events = await this.prisma.auditEvent.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return events.map((event) => ({
      id: event.id,
      action: event.action,
      timestamp: event.createdAt,
      user: event.user,
      changes: this.calculateChanges(event.oldValues, event.newValues),
      severity: event.severity,
      tags: event.tags,
      metadata: event.metadata,
    }));
  }

  /**
   * Calcula as diferenças entre valores antigos e novos
   */
  private calculateChanges(oldValues: any, newValues: any): any {
    if (!oldValues && !newValues) return null;
    if (!oldValues) return { type: "created", values: newValues };
    if (!newValues) return { type: "deleted", values: oldValues };

    const changes: any = { type: "updated", fields: {} };

    // Comparar campos
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = oldValues?.[key];
      const newValue = newValues?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.fields[key] = {
          from: oldValue,
          to: newValue,
        };
      }
    }

    return changes;
  }

  /**
   * Gera relatório de atividades por usuário
   */
  async getUserActivityReport(
    tenantId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const events = await this.prisma.auditEvent.findMany({
      where: {
        tenantId,
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Agrupar por tipo de entidade e ação
    const summary = events.reduce(
      (acc, event) => {
        const key = `${event.entityType}:${event.action}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Agrupar por dia
    const dailyActivity = events.reduce(
      (acc, event) => {
        const day = event.createdAt.toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      userId,
      period: { startDate, endDate },
      totalEvents: events.length,
      summary,
      dailyActivity,
      recentEvents: events.slice(0, 10),
    };
  }

  /**
   * Gera relatório de segurança (eventos críticos)
   */
  async getSecurityReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const criticalEvents = await this.prisma.auditEvent.findMany({
      where: {
        tenantId,
        severity: { in: ["error", "critical"] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Agrupar por tipo de evento
    const eventTypes = criticalEvents.reduce(
      (acc, event) => {
        const key = `${event.entityType}:${event.action}`;
        if (!acc[key]) {
          acc[key] = { count: 0, events: [] };
        }
        acc[key].count++;
        acc[key].events.push(event);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Identificar usuários com mais eventos críticos
    const userActivity = criticalEvents.reduce(
      (acc, event) => {
        if (event.userId) {
          acc[event.userId] = (acc[event.userId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      period: { startDate, endDate },
      totalCriticalEvents: criticalEvents.length,
      eventTypes,
      suspiciousUsers: Object.entries(userActivity)
        .filter(([_, count]) => count > 5)
        .map(([userId, count]) => ({ userId, eventCount: count })),
      recentCriticalEvents: criticalEvents.slice(0, 20),
    };
  }

  /**
   * Limpa eventos de auditoria antigos (para compliance de retenção)
   */
  async cleanupOldEvents(
    tenantId: string,
    retentionDays: number = 2555, // 7 anos por padrão
  ): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditEvent.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: cutoffDate,
        },
        severity: { not: "critical" }, // Manter eventos críticos por mais tempo
      },
    });

    logger.info("Audit events cleanup completed", {
      tenantId,
      deletedCount: result.count,
      cutoffDate,
    });

    return { deletedCount: result.count };
  }

  /**
   * Exporta eventos de auditoria para compliance
   */
  async exportAuditEvents(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    format: "json" | "csv" = "json",
  ): Promise<any> {
    const events = await this.prisma.auditEvent.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (format === "csv") {
      // Converter para formato CSV
      const csvData = events.map((event) => ({
        timestamp: event.createdAt.toISOString(),
        user: event.user?.email || "system",
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        severity: event.severity,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      }));

      return {
        format: "csv",
        data: csvData,
        filename: `audit_export_${tenantId}_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}.csv`,
      };
    }

    return {
      format: "json",
      data: events,
      filename: `audit_export_${tenantId}_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}.json`,
    };
  }
}

export default AuditService;
