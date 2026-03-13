
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'sga-badge',
  template: `<span [class]="badgeClass()"><ng-content>{{ label() }}</ng-content></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  public color = input<'blue' | 'red' | 'green' | 'yellow' | 'gray' | 'primary' | 'success' | 'warning' | 'error'>('primary');
  public size = input<'sm' | 'md' | 'lg'>('md');
  public variant = input<'solid' | 'outline' | 'subtle'>('subtle');
  public rounded = input<'sm' | 'md' | 'lg' | 'full'>('lg');
  public class = input<string>('');
  public label = input<string>('');

  public badgeClass = computed<string>(() => {
    const solidColorMap: Record<string, string> = {
      blue: 'bg-blue-500 text-white',
      red: 'bg-red-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      gray: 'bg-gray-500 text-white',
      primary: 'bg-primary text-primary-foreground',
      success: 'bg-success text-white',
      warning: 'bg-warning text-white',
      error: 'bg-error text-white',
    };

    const subtleColorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      primary: 'bg-primary/10 text-primary dark:bg-primary/20',
      success: 'bg-success/10 text-success dark:bg-success/20',
      warning: 'bg-warning/10 text-warning dark:bg-warning/20',
      error: 'bg-error/10 text-error dark:bg-error/20',
    };

    const outlineColorMap: Record<string, string> = {
      blue: 'text-blue-600 border border-blue-300 dark:text-blue-400 dark:border-blue-700',
      red: 'text-red-600 border border-red-300 dark:text-red-400 dark:border-red-700',
      green: 'text-green-600 border border-green-300 dark:text-green-400 dark:border-green-700',
      yellow: 'text-yellow-600 border border-yellow-300 dark:text-yellow-400 dark:border-yellow-700',
      gray: 'text-gray-600 border border-gray-300 dark:text-gray-400 dark:border-gray-600',
      primary: 'text-primary border border-primary/30',
      success: 'text-success border border-success/30',
      warning: 'text-warning border border-warning/30',
      error: 'text-error border border-error/30',
    };

    const sizeMap = {
      sm: 'px-2 py-0.5 text-[10px] font-semibold',
      md: 'px-2.5 py-0.5 text-xs font-semibold',
      lg: 'px-3 py-1 text-sm font-semibold',
    };

    const variantMap = {
      solid: solidColorMap[this.color()],
      subtle: subtleColorMap[this.color()],
      outline: outlineColorMap[this.color()],
    };

    const roundedMap = {
      sm: 'rounded',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    return [
      'inline-flex items-center justify-center font-["Inter",sans-serif] tracking-tight transition-colors',
      variantMap[this.variant()],
      sizeMap[this.size()],
      roundedMap[this.rounded()],
      this.class(),
    ]
      .filter(Boolean)
      .join(' ');
  });
}