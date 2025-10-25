import type { FormGenerator } from '@entities/form-generator';

export enum FieldType {
  Text = 'text',
  Email = 'email',
  Tel = 'tel',
  Checkbox = 'checkbox',
  Radio = 'radio',
  Select = 'select',
  Phone = 'phone',
  Textarea = 'textarea',
  Password = 'password',
}

export interface FormFieldConfig {
  name?: string;
  label?: string;
  class?: string | string[];
  group?: FormFieldConfig[];
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  initialValue?: never;
  validator?: (value: string) => string | null;
  type?: FieldType;
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  title?: string;
}

export interface FormGeneratorProps<T> {
  ref?: (c: FormGenerator<T>) => void;
  formId: string;
  fields: FormFieldConfig[];
  form: T;
  method?: HTMLFormElement['method'];
  onSubmit?: (data: T) => void;
  onReset?: () => void;
  onInput?: (key: string, value: string | number | boolean) => void;
}
