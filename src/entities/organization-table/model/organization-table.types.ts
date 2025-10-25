import type { IOrganization } from '@entities/organization/model';
import type { Meta } from '@shared/model/types.ts';
import type { ISort } from '@shared/ui/table/model';

export interface IOrganizationTableProps {
  onRowChange?: (row: IOrganization) => void;
  onAdd?: () => void;
}
export interface IOrganizationTableState {
  search: string;
  list: IOrganization[];
  sort: ISort<IOrganization>;
  pagination: Meta;
}
