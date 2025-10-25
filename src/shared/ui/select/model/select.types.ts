import type { IOption } from '@shared/model/types.ts';

export interface ISelectProps {
  label?: string;
  name?: string;
  options: IOption[];
  value: string;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}
export interface ISelectState {}
