import type { IOrganization } from '@entities/organization/model';
import type { IColumn } from '@shared/ui/table/model';

export const columnsRegistry: IColumn<Omit<IOrganization, 'id'>>[] = [
  { key: 'name', label: 'Название', sortable: true },
  { key: 'director', label: 'ФИО директора', sortable: true },
  { key: 'phone', label: 'Телефон' },
  { key: 'address', label: 'Адрес' },
];
