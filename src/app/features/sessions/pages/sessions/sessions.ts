import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ChangeDetectionStrategy, Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionStore } from '@features/admin-services/store/session.store';
import { Session } from '@features/admin-services/api/session-api';
import { SessionCardComponent } from '../../components/session-card/session-card';
import { ActivatedRoute, Router } from '@angular/router';

import { ZardIconComponent } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';

@Component({
  selector: 'sga-sessions',
  imports: [
    CommonModule,
    FormsModule,
    SessionCardComponent,
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardIconComponent,
    ZardInputDirective,
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public searchTerm = signal('');
  public userId = signal<string | null>(null);
  public pageTitle = computed(() => (this.userId() ? 'Sesiones del Usuario' : 'Sesiones Activas'));
  public pageSubtitle = computed(() =>
    this.userId()
      ? 'Historial y accesos del usuario seleccionado.'
      : 'Supervisa y controla los accesos en tiempo real de todos los usuarios.',
  );

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
    this.route.paramMap.subscribe((params) => {
      const userId = params.get('id');
      this.userId.set(userId);
      this.refresh();
    });
  }

  refresh() {
    const userId = this.userId();
    if (userId) {
      this.store.loadByUser({ userId, params: { limit: 100 } });
      return;
    }
    this.store.loadAll({ size: 100 });
  }

  revokeSession(id: string) {
    this.store.delete(id);
  }

  goToGlobalSessions() {
    this.router.navigateByUrl('/administration/sessions');
  }
}
