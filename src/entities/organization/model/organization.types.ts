import type { Meta, Sort } from '@shared/model/types.ts';

export interface Address {
  city: string;
  street: string;
  building: string;
}

export interface IOrganization {
  id: string;
  name: string;
  director: string;
  phone: string;
  address: Address;
}

export type IOrganizationState = {
  list: IOrganization[];
  meta: Meta;
  sort: Sort<IOrganization>;
  search: string;
  current: IOrganization;
};
