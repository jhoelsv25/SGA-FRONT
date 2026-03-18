import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent, type ZardIcon } from '@/shared/components/icon';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLog } from '@features/administration/services/api/audit-api';

@Component({
  selector: 'sga-audit-log-item',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, ZardBadgeComponent, ZardCardComponent],
  templateUrl: './audit-log-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogItem {
  log = input.required<AuditLog>();
  expanded = signal(false);

  readonly actionIcon = computed<ZardIcon>(() => {
    switch (this.log().action) {
      case 'CREATE':
        return 'plus';
      case 'UPDATE':
        return 'file-text';
      case 'DELETE':
        return 'trash';
      default:
        return 'info';
    }
  });

  readonly actionClass = computed(() => {
    switch (this.log().action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELETE':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  });

  readonly entityClass = computed(() => {
    const ent = this.log().entity.toLowerCase();
    const map: Record<string, string> = {
      users: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      roles: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      permissions: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      institution: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };
    return map[ent] || 'bg-muted text-muted-foreground border-border';
  });

  getChanges() {
    if (!this.log().before || !this.log().after) return [];

    const before = this.log().before;
    const after = this.log().after;
    const changes: { field: string; old: unknown; new: unknown }[] = [];

    Object.keys(after).forEach((key) => {
      // Avoid technical fields if possible
      if (['updatedAt', 'password'].includes(key)) return;

      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({
          field: key,
          old: before[key] ?? 'N/A',
          new: after[key] ?? 'N/A',
        });
      }
    });

    return changes;
  }
}
