import { ButtonColor, ButtonShape, ButtonSize, ButtonVariant } from '@shared/directives/button';

export interface ActionContext<T = unknown> {
  row?: T;
  selected?: T[];
  permissions?: string[];
}
export type ActionConfig = {
  key: string;

  label: string;
  icon?: string;

  color: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  showLabel?: boolean;

  visible?: boolean | ((ctx: ActionContext) => boolean);
  disabled?: boolean | ((ctx: ActionContext) => boolean);

  permission?: string;
  permissions?: string[];

  className?: string;

  typeAction: 'header' | 'row' | 'massive';
};
