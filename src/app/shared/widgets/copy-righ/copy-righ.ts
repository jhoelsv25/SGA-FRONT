import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-copy-right',
  template: `
    <small class="dark:text-gray-500"
      >&copy; 2025 jhoelsv25 - Todos los derechos son reservados
    </small>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyRight {}
