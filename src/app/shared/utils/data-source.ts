// Utilidades para DataSource
export function getRowClasses(
  row: unknown,
  index: number,
  config: Record<string, unknown>,
  isSelected: boolean,
): string {
  const classes = ['transition-colors duration-150 cursor-pointer'];

  // Fila seleccionada tiene prioridad visual
  if (isSelected) {
    classes.push('bg-primary-100 text-primary-900 dark:text-primary-100');
  } else {
    // Stripe solo si no está seleccionada
    if (config['stripedRows'] && index % 2 === 1) {
      classes.push('bg-neutral-50 dark:bg-base-300');
    }
    // Hover solo si no está seleccionada
    if (config['hoverRows']) {
      classes.push('hover:bg-neutral-100 dark:hover:bg-base-200');
    }
  }

  return classes.join(' ');
}

export function getColumnClasses(
  column: Record<string, unknown>,
  config: Record<string, unknown>,
): string {
  const classes = ['table-cell'];
  if (column['sortable'] && config['sortable']) {
    classes.push('cursor-pointer select-none');
  }
  return classes.join(' ');
}

export function getActionMenuItemClasses(action: Record<string, unknown>): string {
  if (action['className']) {
    return action['className'] as string;
  }
  let classes = 'text-neutral-700 dark:text-neutral-200';
  switch (action['color']) {
    case 'primary':
      classes = 'text-primary-700 dark:text-primary-300';
      break;
    case 'success':
      classes = 'text-success-700 dark:text-success-300';
      break;
    case 'warning':
      classes = 'text-warning-700 dark:text-warning-300';
      break;
    case 'error':
      classes = 'text-danger-700 dark:text-danger-300';
      break;
  }
  return classes;
}
