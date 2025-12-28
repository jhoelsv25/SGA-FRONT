
import { Directive, effect, ElementRef, inject, input, OnInit, Renderer2 } from '@angular/core';
export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'white';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'default' | 'rounded' | 'pill' | 'square';
@Directive({
  selector: '[sgaButton]',
})
export class Button implements OnInit {
  public variant = input<ButtonVariant>('solid');
  public color = input<ButtonColor>('primary');
  public size = input<ButtonSize>('md');
  public shape = input<ButtonShape>('default');
  public disabled = input<boolean>(false);
  public loading = input<boolean>(false);
  public fullWidth = input<boolean>(false);

  private el = inject(ElementRef<HTMLButtonElement>);
  private renderer = inject(Renderer2);
  private baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus-visible:ring-1',
    'focus-visible:ring-offset-0',
    'focus-visible:ring-opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
  ];

  constructor() {
    // Verificar que el elemento sea un botón
    if (this.el.nativeElement.tagName !== 'BUTTON') {
      throw new Error('ButtonDirective can only be applied to button elements');
    }

    // Usar effect para reaccionar a cambios en los signals
    effect(() => {
      this.applyButtonStyles();
    });
  }

  ngOnInit() {
    this.applyButtonStyles();
  }

  private applyButtonStyles() {
    // Limpiar clases existentes
    const element = this.el.nativeElement;

    // Aplicar clases base
    this.baseClasses.forEach((className) => {
      this.renderer.addClass(element, className);
    });

    // Aplicar variante
    this.applyVariant();

    // Aplicar tamaño
    this.applySize();

    // Aplicar forma
    this.applyShape();

    // Aplicar ancho completo si es necesario
    if (this.fullWidth()) {
      this.renderer.addClass(element, 'w-full');
    }

    // Estado disabled: agregar clases si está deshabilitado, quitarlas si no
    if (this.disabled()) {
      this.renderer.addClass(element, 'disabled:cursor-not-allowed');
      this.renderer.addClass(element, 'disabled:opacity-50');
      element.setAttribute('disabled', 'true');
    } else {
      this.renderer.removeClass(element, 'disabled:cursor-not-allowed');
      this.renderer.removeClass(element, 'disabled:opacity-50');
      element.removeAttribute('disabled');
    }

    // Aplicar estado de carga
    if (this.loading()) {
      this.renderer.addClass(element, 'relative');
      this.addLoadingSpinner();
    }
  }

  private applyVariant() {
    const element = this.el.nativeElement;
    const variant = this.variant();
    const color = this.color();

    // Limpiar clases de color previas
    // ...existing code...

    if (variant === 'solid') {
      switch (color) {
        case 'primary':
          this.renderer.addClass(element, 'bg-primary-500');
          this.renderer.addClass(element, 'text-white');
          this.renderer.addClass(element, 'hover:bg-primary-600');
          this.renderer.addClass(element, 'focus-visible:ring-primary-400/30');
          break;
        case 'secondary':
          this.renderer.addClass(element, 'bg-secondary-200');
          this.renderer.addClass(element, 'text-secondary-800');
          this.renderer.addClass(element, 'hover:bg-secondary-300');
          this.renderer.addClass(element, 'focus-visible:ring-secondary-400/30');
          break;
        case 'accent':
          this.renderer.addClass(element, 'bg-accent-400');
          this.renderer.addClass(element, 'text-accent-900');
          this.renderer.addClass(element, 'hover:bg-accent-500');
          this.renderer.addClass(element, 'focus-visible:ring-accent-500/30');
          break;
        case 'danger':
          this.renderer.addClass(element, 'bg-red-500');
          this.renderer.addClass(element, 'text-white');
          this.renderer.addClass(element, 'hover:bg-red-600');
          this.renderer.addClass(element, 'focus-visible:ring-red-400/30');
          break;
        case 'success':
          this.renderer.addClass(element, 'bg-green-500');
          this.renderer.addClass(element, 'text-white');
          this.renderer.addClass(element, 'hover:bg-green-600');
          this.renderer.addClass(element, 'focus-visible:ring-green-400/30');
          break;
        case 'warning':
          this.renderer.addClass(element, 'bg-yellow-400');
          this.renderer.addClass(element, 'text-yellow-900');
          this.renderer.addClass(element, 'hover:bg-yellow-500');
          this.renderer.addClass(element, 'focus-visible:ring-yellow-500/30');
          break;
        case 'info':
          this.renderer.addClass(element, 'bg-blue-400');
          this.renderer.addClass(element, 'text-blue-900');
          this.renderer.addClass(element, 'hover:bg-blue-500');
          this.renderer.addClass(element, 'focus-visible:ring-blue-500/30');
          break;
        case 'white':
          this.renderer.addClass(element, 'bg-white');
          this.renderer.addClass(element, 'text-neutral-800');
          this.renderer.addClass(element, 'hover:bg-neutral-100');
          this.renderer.addClass(element, 'focus-visible:ring-neutral-300/30');
          break;
      }
      this.renderer.addClass(element, 'shadow-sm');
      this.renderer.addClass(element, 'hover:shadow-md');
    } else if (variant === 'outline') {
      this.renderer.addClass(element, 'bg-transparent');
      this.renderer.addClass(element, 'border');
      switch (color) {
        case 'primary':
          this.renderer.addClass(element, 'text-primary-600');
          this.renderer.addClass(element, 'border-primary-500');
          this.renderer.addClass(element, 'hover:bg-primary-50');
          this.renderer.addClass(element, 'hover:text-primary-700');
          this.renderer.addClass(element, 'focus-visible:ring-primary-400/30');
          break;
        case 'danger':
          this.renderer.addClass(element, 'text-red-600');
          this.renderer.addClass(element, 'border-red-500');
          this.renderer.addClass(element, 'hover:bg-red-50');
          this.renderer.addClass(element, 'hover:text-red-700');
          this.renderer.addClass(element, 'focus-visible:ring-red-400/30');
          break;
        case 'success':
          this.renderer.addClass(element, 'text-green-600');
          this.renderer.addClass(element, 'border-green-500');
          this.renderer.addClass(element, 'hover:bg-green-50');
          this.renderer.addClass(element, 'hover:text-green-700');
          this.renderer.addClass(element, 'focus-visible:ring-green-400/30');
          break;
        // ...otros colores outline si necesitas...
      }
    } else if (variant === 'ghost') {
      this.renderer.addClass(element, 'bg-transparent');
      switch (color) {
        case 'primary':
          this.renderer.addClass(element, 'text-primary-600');
          this.renderer.addClass(element, 'hover:bg-primary-50');
          this.renderer.addClass(element, 'hover:text-primary-700');
          this.renderer.addClass(element, 'focus-visible:ring-primary-400/30');
          break;
        case 'danger':
          this.renderer.addClass(element, 'text-red-600');
          this.renderer.addClass(element, 'hover:bg-red-50');
          this.renderer.addClass(element, 'hover:text-red-700');
          this.renderer.addClass(element, 'focus-visible:ring-red-400/30');
          break;
        case 'success':
          this.renderer.addClass(element, 'text-green-600');
          this.renderer.addClass(element, 'hover:bg-green-50');
          this.renderer.addClass(element, 'hover:text-green-700');
          this.renderer.addClass(element, 'focus-visible:ring-green-400/30');
          break;
        // ...otros colores ghost si necesitas...
      }
    }
  }

  private applySize() {
    const element = this.el.nativeElement;

    switch (this.size()) {
      case 'xs':
        this.renderer.addClass(element, 'px-2');
        this.renderer.addClass(element, 'py-1');
        this.renderer.addClass(element, 'text-xs');
        this.renderer.addClass(element, 'gap-1');
        break;
      case 'sm':
        this.renderer.addClass(element, 'px-3');
        this.renderer.addClass(element, 'py-1.5');
        this.renderer.addClass(element, 'text-sm');
        this.renderer.addClass(element, 'gap-1.5');
        break;

      case 'md':
        this.renderer.addClass(element, 'px-4');
        this.renderer.addClass(element, 'py-2');
        this.renderer.addClass(element, 'text-sm');
        this.renderer.addClass(element, 'gap-2');
        break;

      case 'lg':
        this.renderer.addClass(element, 'px-6');
        this.renderer.addClass(element, 'py-3');
        this.renderer.addClass(element, 'text-base');
        this.renderer.addClass(element, 'gap-2');
        break;

      case 'xl':
        this.renderer.addClass(element, 'px-8');
        this.renderer.addClass(element, 'py-4');
        this.renderer.addClass(element, 'text-lg');
        this.renderer.addClass(element, 'gap-3');
        break;
    }
  }

  private applyShape() {
    const element = this.el.nativeElement;

    // Limpiar clases previas de forma
    this.renderer.removeClass(element, 'rounded-lg');
    this.renderer.removeClass(element, 'rounded-xl');
    this.renderer.removeClass(element, 'rounded-full');
    this.renderer.removeClass(element, 'rounded-none');
    this.renderer.removeClass(element, 'aspect-square');
    this.renderer.removeClass(element, 'w-auto');
    this.renderer.removeClass(element, 'h-auto');
    this.renderer.removeClass(element, 'w-7');
    this.renderer.removeClass(element, 'h-7');
    this.renderer.removeClass(element, 'w-8');
    this.renderer.removeClass(element, 'h-8');
    this.renderer.removeClass(element, 'w-10');
    this.renderer.removeClass(element, 'h-10');
    this.renderer.removeClass(element, 'w-12');
    this.renderer.removeClass(element, 'h-12');
    this.renderer.removeClass(element, 'w-14');
    this.renderer.removeClass(element, 'h-14');

    switch (this.shape()) {
      case 'default':
        this.renderer.addClass(element, 'rounded-lg');
        break;
      case 'rounded':
        this.renderer.addClass(element, 'rounded-xl');
        break;
      case 'pill':
        this.renderer.addClass(element, 'rounded-full');
        // Si el botón solo tiene un ícono o un solo hijo, hacerlo circular y tamaño según size
        if (element.childElementCount === 1 || element.textContent?.trim() === '') {
          this.renderer.addClass(element, 'aspect-square');
          switch (this.size()) {
            case 'xs':
              this.renderer.addClass(element, 'w-7');
              this.renderer.addClass(element, 'h-7');
              break;
            case 'sm':
              this.renderer.addClass(element, 'w-8');
              this.renderer.addClass(element, 'h-8');
              break;
            case 'md':
              this.renderer.addClass(element, 'w-10');
              this.renderer.addClass(element, 'h-10');
              break;
            case 'lg':
              this.renderer.addClass(element, 'w-12');
              this.renderer.addClass(element, 'h-12');
              break;
            case 'xl':
              this.renderer.addClass(element, 'w-14');
              this.renderer.addClass(element, 'h-14');
              break;
          }
        }
        break;
      case 'square':
        this.renderer.addClass(element, 'rounded-none');
        break;
    }
  }

  private addLoadingSpinner() {
    const element = this.el.nativeElement;

    // Crear el spinner
    const spinner = this.renderer.createElement('div');
    this.renderer.addClass(spinner, 'w-4');
    this.renderer.addClass(spinner, 'h-4');
    this.renderer.addClass(spinner, 'border-2');
    this.renderer.addClass(spinner, 'border-current');
    this.renderer.addClass(spinner, 'border-t-transparent');
    this.renderer.addClass(spinner, 'rounded-full');
    this.renderer.addClass(spinner, 'animate-spin');
    this.renderer.addClass(spinner, 'mr-2');

    // Insertar al inicio del botón
    this.renderer.insertBefore(element, spinner, element.firstChild);
  }
}
