
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'sga-badge',
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  public color = input<'blue' | 'red' | 'green' | 'yellow' | 'gray' | 'primary'>('blue');
  public size = input<'sm' | 'md' | 'lg'>('md');
  public variant = input<'solid' | 'outline'>('solid');
  public rounded = input<boolean>(true);
  public class = input<string>('');
  public label = input<string>('');

  public badgeClass = computed<string>(() => {
    const solidColorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
      primary: 'bg-primary-100 text-primary-800',
    };

    const outlineColorMap: Record<string, string> = {
      blue: 'text-blue-600 border border-blue-600',
      red: 'text-red-600 border border-red-600',
      green: 'text-green-600 border border-green-600',
      yellow: 'text-yellow-600 border border-yellow-600',
      gray: 'text-gray-600 border border-gray-600',
      primary: 'text-primary-600 border border-primary-600',
    };

    const sizeMap = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-0.5 text-sm',
      lg: 'px-4 py-1 text-base',
    };

    const variantMap = {
      solid: solidColorMap[this.color()],
      outline: outlineColorMap[this.color()],
    };

    const roundedClass = this.rounded() ? 'rounded-full' : 'rounded-md';

    return [
      'inline-flex items-center font-medium',
      variantMap[this.variant()],
      sizeMap[this.size()],
      roundedClass,
      this.class(),
    ]
      .filter(Boolean)
      .join(' ');
  });
}