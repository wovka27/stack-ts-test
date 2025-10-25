import { mockIOrganizations, storageApi } from '@entities/organization/api';
import type { IOrganization, IOrganizationState } from '@entities/organization/model';
import { Store } from '@shared/lib/store';
import type { Meta } from '@shared/model/types.ts';

export class IOrganizationStore extends Store<IOrganizationState> {
  constructor(deps: IOrganizationState) {
    super(deps);
  }

  public setSearch(value: string) {
    this.setMeta('page', 1);
    this.setState({ search: value });
  }
  public setMeta(key: keyof Meta, value: number) {
    if (key === 'perPage') this.setState({ meta: { ...this.getState().meta, page: 1 } });

    this.setState({ meta: { ...this.getState().meta, [key]: value } });
  }
  public getList() {
    this.setState({ list: storageApi.get() || mockIOrganizations });
    this.setMeta('total', this.getState().list.length);
  }
  public addItem(organization: IOrganization) {
    this.setState({ list: [...this.getState().list, organization] });
    this.syncStorage();
  }

  public setItem(data: IOrganization = {} as IOrganization) {
    this.setState({ current: data });
  }

  public removeItem(id: string) {
    const index = this.getState().list.findIndex((i) => i.id === id);

    if (index !== -1) {
      this.setState({ list: this.getState().list.toSpliced(index, 1) });
      this.syncStorage();
    }
  }

  public updateItem(id: string, organization: IOrganization) {
    const index = this.getState().list.findIndex((i) => i.id === id);

    if (index !== -1) {
      this.setState({ list: this.getState().list.toSpliced(index, 1, organization) });
      this.syncStorage();
    }
  }
  private syncStorage() {
    if (!this.getState().list.length) {
      storageApi.remove();
      return;
    }

    storageApi.set(this.getState().list);
    this.getList();
  }
}

export const orgStore = new IOrganizationStore({
  list: [],
  sort: {
    key: 'name',
    order: null,
  },
  search: '',
  meta: {
    total: 20,
    perPage: 5,
    page: 1,
  },
  current: {} as IOrganization,
});
