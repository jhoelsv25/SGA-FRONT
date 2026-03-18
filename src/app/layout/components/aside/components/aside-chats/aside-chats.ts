import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardInputDirective } from '@/shared/components/input';

@Component({
  selector: 'sga-aside-chats',
  standalone: true,
  imports: [
    CommonModule,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardInputDirective,
  ],
  template: `
    <div class="flex flex-col h-full bg-card/10 backdrop-blur-3xl overflow-hidden">
      <!-- SEARCH BOX -->
      <div class="p-6 border-b border-border/5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Mensajes Directos
          </h3>
          <button
            z-button
            zType="ghost"
            zSize="icon"
            class="size-8 rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
          >
            <z-icon zType="plus" class="size-4" />
          </button>
        </div>
        <div class="relative group/box">
          <z-icon
            zType="search"
            class="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within/box:text-primary transition-colors"
          />
          <input
            zInput
            placeholder="Buscar chat o contacto..."
            class="w-full h-12 pl-12 pr-4 bg-muted/20 border-border/5 focus:border-primary/20 rounded-2xl text-xs placeholder:text-[10px] placeholder:font-bold placeholder:uppercase placeholder:tracking-widest transition-all"
          />
        </div>
      </div>

      <!-- CHATS LIST -->
      <div class="flex-1 overflow-y-auto p-4 space-y-1" id="chat-list">
        @for (chat of chats(); track chat.id) {
          <div
            class="group p-4 rounded-3xl hover:bg-card/40 border border-transparent hover:border-border/5 transition-all duration-300 cursor-pointer flex items-center gap-4 relative overflow-hidden"
            [class.bg-primary/5]="chat.unread"
          >
            <!-- ACTIVE BACKGROUND EFECT -->
            @if (chat.unread) {
              <div class="absolute inset-0 bg-primary/5 animate-pulse opacity-50"></div>
            }

            <!-- AVATAR -->
            <div class="relative shrink-0">
              <div
                class="size-14 rounded-[1.25rem] bg-gradient-to-tr from-primary/10 to-primary/5 border border-primary/20 p-1 group-hover:scale-110 transition-transform duration-500 overflow-hidden"
              >
                <img
                  [src]="chat.avatar"
                  [alt]="chat.name"
                  class="w-full h-full object-cover rounded-[1rem] shadow-sm"
                />
              </div>
              @if (chat.online) {
                <div
                  class="absolute -bottom-1 -right-1 size-4 bg-background rounded-full p-1 border-2 border-background ring-2 ring-background"
                >
                  <div
                    class="w-full h-full bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  ></div>
                </div>
              }
            </div>

            <!-- CONTENT -->
            <div class="flex-1 min-w-0 space-y-1 relative z-10">
              <div class="flex items-center justify-between">
                <h4
                  class="text-xs font-black text-foreground uppercase tracking-tight inter truncate group-hover:text-primary transition-colors"
                >
                  {{ chat.name }}
                </h4>
                <span
                  class="text-[8px] font-bold text-muted-foreground opacity-40 uppercase tracking-tighter"
                  >{{ chat.time }}</span
                >
              </div>
              <div class="flex items-center justify-between gap-4">
                <p
                  class="text-[11px] text-muted-foreground truncate leading-snug"
                  [class.font-bold]="chat.unread"
                  [class.text-foreground/80]="chat.unread"
                >
                  {{ chat.lastMessage }}
                </p>
                @if (chat.unread) {
                  <z-badge
                    class="rounded-full bg-primary text-primary-foreground min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold ring-2 ring-primary/20"
                    >3</z-badge
                  >
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="h-full flex flex-col items-center justify-center py-20 opacity-40">
            <z-empty
              zIcon="message-circle"
              zTitle="Sin conversaciones"
              zDescription="Inicia un chat con tus colegas o estudiantes para empezar."
            />
          </div>
        }
      </div>

      <!-- FOOTER / CHAT ACTIONS -->
      <div class="p-6 bg-card/10 backdrop-blur-3xl border-t border-border/10">
        <div
          class="bg-primary/5 rounded-[2.5rem] p-4 flex items-center gap-4 group/support cursor-pointer hover:bg-primary/10 transition-all border border-primary/5"
        >
          <div
            class="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover/support:scale-110 transition-transform duration-500 overflow-hidden relative"
          >
            <div
              class="absolute inset-0 bg-white/20 -translate-x-full group-hover/support:translate-x-full transition-transform duration-1000"
            ></div>
            <z-icon zType="headset" class="size-5" />
          </div>
          <div class="flex-1">
            <p class="text-[10px] font-black uppercase tracking-widest text-primary inter">
              Soporte Técnico AI
            </p>
            <p class="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
              Disponible 24/7
            </p>
          </div>
          <z-icon
            zType="arrow-right"
            class="size-4 text-primary group-hover/support:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      #chat-list::-webkit-scrollbar {
        width: 4px;
      }
      #chat-list::-webkit-scrollbar-thumb {
        background: var(--primary-muted);
        border-radius: 10px;
        opacity: 0.1;
      }
      #chat-list {
        scrollbar-width: thin;
        scrollbar-color: var(--primary-muted) transparent;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideChats {
  public chats = signal([
    {
      id: 1,
      name: 'Dra. María García',
      avatar: 'https://i.pravatar.cc/150?u=maria',
      lastMessage: 'Recuerda enviar las notas finales del trimestre.',
      time: '14:20',
      unread: true,
      online: true,
    },
    {
      id: 2,
      name: 'Ing. Carlos Mendoza',
      avatar: 'https://i.pravatar.cc/150?u=carlos',
      lastMessage: '¿Recibiste el manual del laboratorio?',
      time: 'Ayer',
      unread: false,
      online: false,
    },
    {
      id: 3,
      name: 'Soporte SGA',
      avatar: 'https://i.pravatar.cc/150?u=sga',
      lastMessage: 'Tu solicitud #234 ha sido resuelta.',
      time: '10/03',
      unread: false,
      online: true,
    },
    {
      id: 4,
      name: 'Lic. Ana López',
      avatar: 'https://i.pravatar.cc/150?u=ana',
      lastMessage: 'La reunión de mañana fue cancelada.',
      time: '09/03',
      unread: true,
      online: false,
    },
  ]);
}
