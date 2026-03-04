import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Session } from '../../../services/api/session-api';

@Component({
  selector: 'sga-session-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative bg-base-100 border border-base-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 overflow-hidden">
      <!-- Background Glow -->
      <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div class="flex items-start justify-between relative z-10">
        <div class="flex items-center gap-4">
          <!-- Device Icon -->
          <div [class]="'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ' + getDeviceClass()">
            <i [class]="getDeviceIcon()"></i>
          </div>
          
          <div>
            <h3 class="font-bold text-base-content text-lg leading-tight">{{ session().user.firstName }} {{ session().user.lastName }}</h3>
            <p class="text-[10px] font-black text-base-content/30 uppercase tracking-widest mt-1">{{ session().ipAddress }}</p>
          </div>
        </div>

        <button 
          (click)="revoke.emit(session().id)"
          class="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error hover:text-white transition-all shadow-sm"
          title="Revocar Sesión">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>

      <div class="mt-6 space-y-3 relative z-10">
        <!-- Activity Timeline -->
        <div class="flex items-center gap-3">
          <div class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
          <p class="text-xs font-medium text-base-content/60">
            Última actividad: <span class="text-base-content font-bold">{{ session().lastActive | date:'shortTime' }}</span>
          </p>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-2">
          <div class="p-3 rounded-2xl bg-base-200/50 border border-base-200/50">
            <p class="text-[8px] font-black text-base-content/30 uppercase tracking-tighter">Creada</p>
            <p class="text-[10px] font-bold text-base-content/70 mt-0.5">{{ session().createdAt | date:'dd/MM HH:mm' }}</p>
          </div>
          <div class="p-3 rounded-2xl bg-base-200/50 border border-base-200/50">
            <p class="text-[8px] font-black text-base-content/30 uppercase tracking-tighter">Expira</p>
            <p class="text-[10px] font-bold text-base-content/70 mt-0.5">{{ session().expiresAt | date:'dd/MM HH:mm' }}</p>
          </div>
        </div>

        <!-- User Agent -->
        <div class="pt-3 border-t border-base-200">
          <div class="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <i class="fas fa-microchip text-[10px]"></i>
            <span class="text-[9px] font-mono truncate max-w-[200px]">{{ session().userAgent }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionCardComponent {
  session = input.required<Session>();
  revoke = output<string>();

  getDeviceIcon(): string {
    const ua = this.session().userAgent.toLowerCase();
    if (ua.includes('mobi')) return 'fas fa-mobile-screen-button';
    if (ua.includes('tablet')) return 'fas fa-tablet-screen-button';
    return 'fas fa-desktop';
  }

  getDeviceClass(): string {
    const ua = this.session().userAgent.toLowerCase();
    if (ua.includes('mobi')) return 'bg-blue-500/10 text-blue-500';
    if (ua.includes('tablet')) return 'bg-purple-500/10 text-purple-500';
    return 'bg-primary/10 text-primary';
  }
}
