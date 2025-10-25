import './styles.css';

import BaseComponent from '@entities/base-component';
import type { VNode } from '@entities/core/vdom/vnode.ts';
import type { IOrganization } from '@entities/organization/model';
import { orgStore } from '@entities/organization/model/organization.store.ts';
import { columnsRegistry, perPageOptions } from '@entities/organization-table/config';
import type { IOrganizationTableProps, IOrganizationTableState } from '@entities/organization-table/model';
import QueryHelper, { type QueryValue } from '@shared/lib/query-helper';
import { historyService } from '@shared/lib/services';
import type { Subscriber } from '@shared/lib/store/model';
import { debounce } from '@shared/lib/utils';
import Button from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Pagination } from '@shared/ui/pagination';
import { Table } from '@shared/ui/table';
import type { ISort } from '@shared/ui/table/model';

export default class OrganizationTable
  extends BaseComponent<IOrganizationTableProps, IOrganizationTableState>
  implements Subscriber
{
  private unsubscribe: (() => void) | null = null;
  private unsubscribeHistory: (() => void) | null = null;

  public constructor(props: IOrganizationTableProps) {
    super(props);
    this.state = this.getInitialState();
  }

  componentDidMount() {
    orgStore.getList();
    this.subscribeToStore(orgStore);

    this.updateFromStore();

    this.changeToQuery();
    this.unsubscribeHistory = historyService.onChange(this.changeToQuery);
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.unsubscribeHistory?.();
  }

  updateFromStore() {
    const state = orgStore.getState();

    this.setState({
      pagination: state.meta,
      sort: state.sort,
      list: state.list,
    });
  }

  get list(): IOrganization[] {
    const filtered = this.filterList(this.state.list, orgStore.getState().search);
    return filtered;
  }

  get sort() {
    return orgStore.getState().sort;
  }

  get meta() {
    return orgStore.getState().meta;
  }

  protected getInitialState(): IOrganizationTableState {
    const state = orgStore.getState();
    return {
      search: '',
      list: state.list,
      sort: state.sort,
      pagination: state.meta,
    };
  }

  onSearch = (v: string) => {
    orgStore.setSearch(v);
    orgStore.setMeta('total', this.list.length);
  };
  debouncedSearch = debounce(this.onSearch, 500);

  onPageChange = (value: number) => {
    orgStore.setMeta('page', value);
    historyService.push({
      page: value,
    });
  };

  onPerPageChange = (value: string) => {
    orgStore.setMeta('perPage', +value);
    historyService.push({
      perPage: value,
    });
  };

  private onRemove = (event: Event, row: IOrganization) => {
    event?.stopPropagation();
    orgStore.removeItem(row.id);
  };

  private transformColumnAddress = (row: IOrganization) => {
    if (!row.address) return '';

    const { city, street, building } = row.address;
    const c = `г. ${city}, `;
    const s = `ул. ${street}, `;
    const b = `д. ${building}`;
    return c + s + b;
  };

  private filterList(list: IOrganization[], search: string): IOrganization[] {
    if (!search) return list;
    const lowerSearch = search.toLowerCase();
    return list.filter((org) => org.director.toLowerCase().includes(lowerSearch));
  }

  protected shouldComponentUpdate(_nextProps: IOrganizationTableProps, nextState: IOrganizationTableState): boolean {
    const shouldUpdate =
      this.state.sort.order !== nextState.sort.order ||
      this.state.sort.key !== nextState.sort.key ||
      this.state.pagination.page !== nextState.pagination.page ||
      this.state.pagination.perPage !== nextState.pagination.perPage ||
      this.state.pagination.total !== nextState.pagination.total ||
      this.state.list.length !== nextState.list.length;

    return shouldUpdate;
  }

  private changeToQuery = () => {
    const { sort } = QueryHelper.flatten(Object.fromEntries(new URLSearchParams(location.search))) as unknown as {
      sort: ISort<IOrganization>;
    };

    if (!sort) return
    orgStore.setState({ ...orgStore.getState(), sort: sort });
  };

  render(_state: IOrganizationTableState, props: IOrganizationTableProps) {

    const children: VNode<IOrganizationTableProps>[] = [
      this.h(
        'div',
        { class: 'organization-table__header' },
        this.h(Input, {
          onChange: this.debouncedSearch,
          disabled: !_state.list.length,
          placeholder: 'Найти по ФИО...',
          type: 'text',
        }),
        this.h(Button, {
          text: 'Добавить',
          onClick: () => {
            props.onAdd?.();
          },
        })
      ),
      this.h(
        'div',
        { class: 'organization-table__body' },
        this.h(Table<IOrganization>, {
          perPageOptions,
          columns: columnsRegistry,
          rows: _state.list,
          sort: this.sort,
          pagination: this.meta,
          stiped: true,
          hovered: true,
          onSort: (sort: ISort<IOrganization>) => {
            orgStore.setState({ sort });
            historyService.push(QueryHelper.toQueryRecord({ sort: sort as unknown as QueryValue }));
          },
          onPageChange: this.onPageChange,
          onPerPageChange: this.onPerPageChange,
          clickRow: (row: IOrganization) => props.onRowChange?.(row),
          actionsSlot: (row: IOrganization) => [
            this.h(Button, {
              text: 'X',
              variant: 'outline',
              onClick: (event: Event) => this.onRemove(event, row),
              key: `delete-${row.name}-${row.phone}`,
            })
          ],
          transformColumn: {
            address: this.transformColumnAddress,
          },
          key: 'org-table',
        })
      ),
    ] 

    if (_state.list.length) {
      children.push(this.h(Pagination, { key: 'pagination' }))
    }

    return this.h(
      'div',
      { class: 'organization-table container', key: 'organization-table' },
      ...children
    ) 
  }
}
