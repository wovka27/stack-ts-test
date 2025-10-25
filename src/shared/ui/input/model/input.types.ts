import type { FieldType } from '@entities/form-generator/model/types.ts';

export interface IInputProps extends Partial<HTMLInputElement> {
  label?: string;
  type: FieldType | HTMLInputElement['type'];
  error?: string;
  onChange?: (value: string) => void;
}
export interface IInputState {}
