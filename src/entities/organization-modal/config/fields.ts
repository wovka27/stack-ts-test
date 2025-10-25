import { FieldType, type FormFieldConfig } from '@entities/form-generator/model/types.ts';
import { validatePhoneNumber } from '@shared/lib/utils';

export const fields: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Название',
    type: FieldType.Text,
    placeholder: 'Введите название',
    required: true,
  },
  {
    name: 'director',
    label: 'ФИО директора',
    type: FieldType.Text,
    required: true,
  },
  {
    name: 'phone',
    label: 'Телефон',
    placeholder: '+7 000 000 00 00',
    type: FieldType.Phone,
    required: true,
    validator: (value) => (validatePhoneNumber(value, '+_ ___ ___ __ __') ? null : 'Неверный формат'),
  },
  {
    name: 'address.city',
    label: 'Город',
    type: FieldType.Text,
    required: true,
  },
  {
    class: 'ui-form__group',
    group: [
      {
        name: 'address.street',
        label: 'Улица',
        type: FieldType.Text,
        required: true,
      },
      {
        name: 'address.building',
        label: 'Дом',
        type: FieldType.Text,
        required: true,
      },
    ],
  },
];
