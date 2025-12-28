// core/services/cell-formatter.service.ts
import { Injectable } from '@angular/core';
import { DataSourceColumn } from '@core/types/data-source-types';

@Injectable({ providedIn: 'root' })
export class CellFormatter {
  private locale = 'es-ES';

  format(value: unknown, column: DataSourceColumn): string {
    if (value == null) return '';

    switch (column.type) {
      case 'date':
        return this.formatDate(value, column.format);
      case 'time':
        return this.formatTime(value, column.format);
      case 'datetime':
        return this.formatDateTime(value, column.format);
      case 'number':
        return this.formatNumber(value, column.format);
      case 'boolean':
        return value ? 'Sí' : 'No';
      default:
        return String(value);
    }
  }

  // ============================================
  // DATE
  // ============================================
  private formatDate(value: unknown, format?: string): string {
    const date = new Date(value as string | number | Date);
    if (isNaN(date.getTime())) return String(value);

    const presets: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      medium: { day: '2-digit', month: 'short', year: 'numeric' },
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    };

    if (format && presets[format]) {
      return date.toLocaleDateString(this.locale, presets[format]);
    }

    if (format) {
      return this.customFormat(date, format);
    }

    return date.toLocaleDateString(this.locale);
  }

  // ============================================
  // TIME
  // ============================================
  private formatTime(value: unknown, format?: string): string {
    const date = new Date(value as string | number | Date);
    if (isNaN(date.getTime())) return String(value);

    const presets: Record<string, Intl.DateTimeFormatOptions> = {
      short: { hour: '2-digit', minute: '2-digit' },
      medium: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
      long: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      },
    };

    const preset = presets[format || 'medium'];
    if (preset) {
      return date.toLocaleTimeString(this.locale, preset);
    }

    return this.customFormat(date, format || 'HH:mm:ss');
  }

  // ============================================
  // DATETIME
  // ============================================
  private formatDateTime(value: unknown, format?: string): string {
    const date = new Date(value as string | number | Date);
    if (isNaN(date.getTime())) return String(value);

    const presets: Record<string, Intl.DateTimeFormatOptions> = {
      short: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      medium: {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      long: {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
      full: {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    };

    if (format && presets[format]) {
      return date.toLocaleString(this.locale, presets[format]);
    }

    if (format) {
      return this.customFormat(date, format);
    }

    return date.toLocaleString(this.locale);
  }

  // ============================================
  // NUMBER
  // ============================================
  private formatNumber(value: unknown, format?: string): string {
    const num = Number(value);
    if (isNaN(num)) return String(value);

    // Formato de moneda
    if (format?.startsWith('currency:')) {
      const currency = format.split(':')[1] || 'USD';
      return num.toLocaleString(this.locale, {
        style: 'currency',
        currency,
      });
    }

    // Formato de porcentaje
    if (format === 'percent') {
      return num.toLocaleString(this.locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    // Decimales específicos
    if (format?.startsWith('decimal:')) {
      const decimals = parseInt(format.split(':')[1], 10) || 2;
      return num.toLocaleString(this.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    return num.toLocaleString(this.locale);
  }

  // ============================================
  // CUSTOM FORMAT
  // ============================================
  private customFormat(date: Date, format: string): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    const tokens: Record<string, string> = {
      yyyy: String(date.getFullYear()),
      yy: String(date.getFullYear()).slice(-2),
      MM: pad(date.getMonth() + 1),
      dd: pad(date.getDate()),
      HH: pad(date.getHours()),
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds()),
    };

    return Object.entries(tokens).reduce((str, [token, val]) => str.replace(token, val), format);
  }
}
