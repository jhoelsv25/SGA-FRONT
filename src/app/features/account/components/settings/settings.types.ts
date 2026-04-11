import type { ThemeConfig } from '@core/types/layout-types';

export type SettingsSectionId =
  | 'general'
  | 'appearance'
  | 'notifications'
  | 'email'
  | 'security'
  | 'logs'
  | 'sessions';

export type SettingsPreferenceKey =
  | 'digest'
  | 'reminders'
  | 'incidents'
  | 'approvals'
  | 'emailSummary'
  | 'browserAlerts'
  | 'newDeviceAlerts';

export interface SettingsSectionItem {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: string;
}

export interface SettingsHeroPill {
  label: string;
  value: string;
}

export interface SettingsInfoRow {
  label: string;
  value: string;
  helper?: string;
}

export interface SettingsStatusRow {
  label: string;
  description: string;
}

export interface SettingsNotificationItem {
  key: SettingsPreferenceKey;
  label: string;
  description: string;
}

export interface SettingsThemeOption {
  value: ThemeConfig;
  label: string;
  description: string;
}

export interface SettingsAuditRow {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
}
