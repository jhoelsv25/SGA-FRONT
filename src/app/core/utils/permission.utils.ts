const READ_ALIASES = new Set(['view', 'read']);
const WRITE_ACTIONS = new Set(['create', 'update', 'delete']);

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function resourceVariants(resource: string): string[] {
  if (!resource) return [];
  const normalized = resource.trim();
  const singular = normalized.endsWith('s') ? normalized.slice(0, -1) : normalized;
  const plural = normalized.endsWith('s') ? normalized : `${normalized}s`;
  return unique([
    normalized,
    singular,
    plural,
    normalized.replace(/-/g, '_'),
    normalized.replace(/_/g, '-'),
    singular.replace(/-/g, '_'),
    singular.replace(/_/g, '-'),
    plural.replace(/-/g, '_'),
    plural.replace(/_/g, '-'),
  ]);
}

export function expandPermissionAliases(permission: string): string[] {
  if (!permission) return [];

  const aliases = [permission];

  if (permission.includes(':')) {
    const [resource, action] = permission.split(':');

    if (resource && action) {
      const variants = resourceVariants(resource);
      if (READ_ALIASES.has(action)) {
        variants.forEach((variant) => {
          aliases.push(`${variant}:view`, `${variant}:read`, `view_${variant}`, `read_${variant}`);
        });
      } else if (action === 'manage') {
        variants.forEach((variant) => {
          aliases.push(
            `${variant}:manage`,
            `manage_${variant}`,
            `${variant}:create`,
            `${variant}:update`,
            `${variant}:delete`,
          );
        });
      } else if (WRITE_ACTIONS.has(action)) {
        variants.forEach((variant) => {
          aliases.push(
            `${variant}:${action}`,
            `${action}_${variant}`,
            `manage_${variant}`,
            `${variant}:manage`,
          );
        });
      }
    }
  } else {
    const legacyMatch = /^(view|read|create|update|delete|manage)_(.+)$/.exec(permission);
    if (legacyMatch) {
      const [, action, resource] = legacyMatch;
      const variants = resourceVariants(resource);

      if (READ_ALIASES.has(action)) {
        variants.forEach((variant) => {
          aliases.push(`${variant}:view`, `${variant}:read`);
        });
      } else if (action === 'manage') {
        variants.forEach((variant) => {
          aliases.push(
            `${variant}:manage`,
            `${variant}:create`,
            `${variant}:update`,
            `${variant}:delete`,
          );
        });
      } else if (WRITE_ACTIONS.has(action)) {
        variants.forEach((variant) => {
          aliases.push(`${variant}:${action}`, `${variant}:manage`);
        });
      }
    }
  }

  return unique(aliases);
}
