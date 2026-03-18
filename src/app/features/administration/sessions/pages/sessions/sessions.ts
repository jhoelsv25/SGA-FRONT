import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ChangeDetectionStrategy, Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionStore } from '@features/administration/services/store/session.store';
import { Session } from '@features/administration/services/api/session-api';
import { SessionCardComponent } from '../../components/session-card/session-card';

import { ZardIconComponent } from '@/shared/components/icon';

@Component({
  selector: 'sga-sessions',
  imports: [
    CommonModule,
    FormsModule,
    SessionCardComponent,
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardIconComponent,
  ],
  templateUrl: './sessions.html',
  styles: [
    `
      :host {
        display: block;
        background: radial-gradient(circle at top right, var(--primary-muted), transparent 40%);
        min-height: 100vh;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SessionsComponent {
  public store = inject(SessionStore);
  public searchTerm = signal('');

  public filteredSessions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const sessions = this.store.sessions() as Session[];
    if (!search) return sessions;

    return sessions.filter(
      (s) =>
        s.user.firstName.toLowerCase().includes(search) ||
        s.user.lastName.toLowerCase().includes(search) ||
        s.ipAddress.toLowerCase().includes(search) ||
        s.userAgent.toLowerCase().includes(search),
    );
  });

  constructor() {
    this.refresh();
  }

  refresh() {
    this.store.loadAll({ size: 100 });
  }

  revokeSession(id: string) {
    this.store.delete(id);
  }
}
