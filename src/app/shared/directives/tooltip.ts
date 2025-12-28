import { Directive, ElementRef, inject, input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[sgaTooltip]',
})
export class Tooltip implements OnDestroy {
  public sgaTooltip = input.required<string>();
  public position = input<'top' | 'bottom' | 'left' | 'right'>('top');

  private tooltipEl?: HTMLElement;
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    this.renderer.listen(this.el.nativeElement, 'mouseenter', () => this.show());
    this.renderer.listen(this.el.nativeElement, 'mouseleave', () => this.hide());
  }

  private show() {
    if (this.tooltipEl || !this.sgaTooltip()) return;

    const host = this.el.nativeElement;
    const tooltip = this.renderer.createElement('div');
    tooltip.innerText = this.sgaTooltip();

    this.renderer.addClass(
      tooltip,
      'absolute z-50 px-2 py-1 text-sm text-white bg-black rounded-md shadow',
    );
    this.renderer.addClass(tooltip, 'transition ease-out duration-150 opacity-0 scale-95'); // estado inicial
    this.renderer.setStyle(tooltip, 'pointer-events', 'none');
    this.renderer.setStyle(tooltip, 'white-space', 'nowrap');

    document.body.appendChild(tooltip);

    const rect = host.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = 0,
      left = 0;

    switch (this.position()) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + 8;
        break;
    }

    this.renderer.setStyle(tooltip, 'top', `${top}px`);
    this.renderer.setStyle(tooltip, 'left', `${left}px`);

    this.tooltipEl = tooltip;

    // 🔥 Pequeño delay para que la transición funcione
    requestAnimationFrame(() => {
      tooltip.classList.remove('opacity-0', 'scale-95');
      tooltip.classList.add('opacity-100', 'scale-100');
    });
  }

  private hide() {
    if (!this.tooltipEl) return;

    const tooltip = this.tooltipEl;
    tooltip.classList.remove('opacity-100', 'scale-100');
    tooltip.classList.add('opacity-0', 'scale-95');

    // 🔥 esperar la animación antes de eliminar
    setTimeout(() => {
      tooltip.remove();
      this.tooltipEl = undefined;
    }, 150);
  }

  ngOnDestroy() {
    this.tooltipEl?.remove();
  }
}
