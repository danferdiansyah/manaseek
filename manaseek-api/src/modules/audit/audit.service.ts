import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

/**
 * Append-only trail for security-relevant and money-adjacent actions:
 * logins, verification decisions, booking state changes, admin overrides.
 *
 * Writing an audit record must never break the action being audited, so all
 * failures are swallowed and logged.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log ${entry.action}: ${(error as Error).message}`);
    }
  }
}
