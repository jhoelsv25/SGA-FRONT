import {
  ZardButtonTypeVariants,
  ZardButtonSizeVariants,
  ZardButtonShapeVariants,
} from '@/shared/components/button/button.variants';

export interface ActionContext<T = unknown> {
  row?: T;
  selected?: T[];
  permissions?: string[];
}
export type ActionConfig = {
  key: string;

  label: string;
  icon?: string;

  color: string;
  variant?: ZardButtonTypeVariants;
  size?: ZardButtonSizeVariants;
  shape?: ZardButtonShapeVariants;
  showLabel?: boolean;

  visible?: boolean | ((ctx: ActionContext) => boolean);
  disabled?: boolean | ((ctx: ActionContext) => boolean);

  permission?: string;
  permissions?: string[];

  className?: string;

  typeAction: 'header' | 'row' | 'massive';
};
