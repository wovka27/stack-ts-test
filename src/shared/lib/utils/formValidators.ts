import { validatePhoneNumber } from '@shared/lib/utils/validatePhoneNumber.ts';

export const formValidators = {
  required: (value: string) => (value ? null : 'Обязательное поле'),
  phone: (value: string) => (validatePhoneNumber(value, '+_ ___ ___ __ __') ? null : 'Неверный формат'),
};
