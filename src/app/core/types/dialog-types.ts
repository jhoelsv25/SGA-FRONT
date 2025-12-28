import { ButtonColor, ButtonSize, ButtonVariant } from '@shared/directives/button';

export type DialogPosition = 'center' | 'top-center' | 'bottom-center' | 'left' | 'right';

export type ButtonProps = {
  label?: string;
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: string;
};

export type DialogTypeOptions = {
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  icon: string;
  message: string;
  rejectButtonProps?: ButtonProps;
  acceptButtonProps?: ButtonProps;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  onAccept?: (inputValue?: string) => void;
  onReject?: () => void;
};
