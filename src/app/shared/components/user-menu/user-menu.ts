import {
  Component,
  input,
  output,
  signal,
  HostListener,
  ElementRef,
  inject,
} from "@angular/core";
import { NgClass } from "@angular/common";

export interface UserMenuAction {
  label: string;
  icon?: string;
  type?: string;
  action?: () => void;
}

@Component({
  selector: 'sga-user-menu',
  templateUrl: './user-menu.html',
  imports: [NgClass],
})
export class UserMenu {
  private elRef = inject(ElementRef);
  // Inputs
  avatar = input<string | null>(null);
  initials = input<string>('U');
  name = input<string>('Usuario');
  role = input<string>('Rol');
  code = input<string>('0000');

  stats = input<{ courses?: number; students?: number; average?: string }>({
    courses: 0,
    students: 0,
    average: '0.0',
  });

  actions = input<UserMenuAction[]>([]);

  // Estado interno
  open = signal(false);

  // Output
  actionSelected = output<UserMenuAction>();


  toggleMenu() {
    this.open.update((o) => !o);
  }

  handleAction(action: UserMenuAction) {
    if (action.type === 'logout') {
      this.actionSelected.emit(action);
    } else if (action.type === 'toggle') {
      this.actionSelected.emit(action);
    } else {
      action.action?.();
      this.actionSelected.emit(action);
    }
    this.open.set(false);
  }

  handleThemeAction(action: UserMenuAction, event: Event) {
    event.stopPropagation(); // Prevenir que el evento se propague
    this.actionSelected.emit(action); // Emitir la acción de cambio de tema
  }

  // 👇 Cerrar si se hace clic afuera
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.open() && !this.elRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
