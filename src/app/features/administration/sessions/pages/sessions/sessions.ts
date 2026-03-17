import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ChangeDetectionStrategy, Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionStore } from '@features/administration/services/store/session.store';
import { Session } from '@features/administration/services/api/session-api';
import { SessionCardComponent } from '../../components/session-card/session-card';


@Component({
  selector: 'sga-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, SessionCardComponent, ZardButtonComponent, ZardEmptyComponent],
  template: `
    <div class="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
      <!-- HEADER CARD -->
      <div class="bg-base-100 border border-base-200 rounded-4xl p-8 shadow-xl shadow-primary/5 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div class="flex items-center gap-6 relative z-10 w-full lg:w-auto">
          <div class="w-20 h-20 rounded-3xl bg-primary text-primary-content flex items-center justify-center text-4xl shadow-2xl shadow-primary/30">
            <i class="fas fa-shield-halved"></i>
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-black text-base-content tracking-tighter">Sesiones Activas</h1>
              <span class="px-2.5 py-0.5 bg-success/10 text-success rounded-lg text-[10px] font-black uppercase tracking-widest">Seguridad en Vivo</span>
            </div>
            <p class="text-base-content/50 text-sm font-medium mt-1">Supervisa y controla los accesos en tiempo real de todos los usuarios</p>
            
            <div class="flex gap-4 mt-3">
              <div class="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                <i class="fas fa-signal text-[10px] text-primary/60"></i>
                <span class="text-[10px] font-black text-primary/70 uppercase tracking-widest">{{ store.sessions().length }} Sesiones en total</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full lg:w-auto relative z-10">
          <button 
            z-button 
            zType="ghost" 
            (click)="refresh()" 
            class="rounded-2xl h-14 px-6 border border-base-200 bg-base-100 hover:bg-base-200 font-bold">
            <i class="fas fa-sync-alt mr-2" [class.fa-spin]="store.loading()"></i>
            Sincronizar
          </button>
        </div>
      </div>

      <!-- SEARCH BAR -->
      <div class="relative group">
        <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
          <i class="fas fa-search text-base-content/20 group-focus-within:text-primary transition-colors"></i>
        </div>
        <input 
          type="text" 
          [ngModel]="searchTerm()" 
          (ngModelChange)="searchTerm.set($event)"
          placeholder="Buscar por usuario, IP o dispositivo..."
          class="w-full pl-14 pr-6 py-4 rounded-2xl bg-base-100 border border-base-200 shadow-md focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium placeholder:text-base-content/30"
        >
      </div>

      <!-- SESSIONS GRID -->
      <div class="pb-12 text-black dark:text-white">
        @if (store.loading() && !store.sessions().length) {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="h-56 w-full bg-base-100 animate-pulse rounded-3xl border border-base-200 shadow-sm"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            @for (session of filteredSessions(); track session.id) {
              <sga-session-card 
                [session]="session"
              (revoke)="revokeSession($event)">
              </sga-session-card>
            } @empty {
              <div class="col-span-full py-20">
                <z-empty
                  zTitle="No hay sesiones activas"
                  zDescription="No se encontraron registros de sesiones en el sistema."
                  zIcon="shield"
                >
                  @if (searchTerm()) {
                    <button z-button zType="outline" class="mt-4" (click)="searchTerm.set('')">Limpiar Búsqueda</button>
                  }
                </z-empty>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SessionsComponent {
  public store = inject(SessionStore);
  public searchTerm = signal('');

  public filteredSessions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const sessions = this.store.sessions() as Session[];
    if (!search) return sessions;

    return sessions.filter(s => 
      s.user.firstName.toLowerCase().includes(search) ||
      s.user.lastName.toLowerCase().includes(search) ||
      s.ipAddress.toLowerCase().includes(search) ||
      s.userAgent.toLowerCase().includes(search)
    );
  });

  constructor() {
    this.refresh();
  }

  refresh() {
    this.store.loadAll({ size: 100 });
  }

  revokeSession(id: string) {
    if (confirm('¿Estás seguro de que deseas revocar esta sesión? El usuario perderá el acceso de inmediato.')) {
      this.store.delete(id);
    }
  }
}
