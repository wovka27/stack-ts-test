export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

export interface IButtonProps extends Partial<HTMLButtonElement> {
  text: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: (event: Event) => void;
}

export interface IButtonState {}
