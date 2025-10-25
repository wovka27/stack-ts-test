import './styles.css';

import BaseComponent from '@entities/base-component';
import type { VNode } from '@entities/core/vdom/vnode.ts';
import { orgStore } from '@entities/organization/model/organization.store.ts';
import { perPageOptions } from '@entities/organization-table/config';
import { historyService } from '@shared/lib/services';
import type { Subscriber } from '@shared/lib/store/model';
import type { Meta } from '@shared/model/types.ts';
import type { PaginationProps, PaginationState } from '@shared/ui/pagination/model';
import { Select } from '@shared/ui/select';

export class Pagination extends BaseComponent<PaginationProps, PaginationState> implements Subscriber {
  private unsubscribe: (() => void) | null = null;
  private unsubscribeHistory: (() => void) | null = null;

  constructor(props: PaginationProps) {
    super(props);
    this.state = this.getInitialState();
  }

  public componentDidMount() {
    this.subscribeToStore(orgStore);
    this.changeToQuery();
    this.unsubscribe?.();
    this.unsubscribeHistory = historyService.onChange(this.changeToQuery);
  }

  private changeToQuery = () => {
    const { page = 1, perPage = 5 } = historyService.query;
    const newMeta = { ...orgStore.getState().meta, page: +page, perPage: +perPage };
    orgStore.setState({ meta: newMeta });
    this.setState({ ...newMeta, total: this.getTotal(newMeta) });
  };

  protected componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.unsubscribeHistory) {
      this.unsubscribeHistory();
      this.unsubscribeHistory = null;
    }
  }

  updateFromStore() {
    const meta = orgStore.getState().meta;
    const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage));
    const newPage = meta.page > totalPages ? totalPages : meta.page; 
    const newMeta = { ...meta, page: newPage };
    if (newPage !== meta.page) {
      orgStore.setMeta('page', newPage);
      historyService.push({ page: newPage });
    }
    const newTotal = this.getTotal(newMeta);
    if (
      this.state.page !== newMeta.page ||
      this.state.perPage !== newMeta.perPage ||
      this.state.total !== newMeta.total ||
      this.total !== newTotal
    ) {
      this.setState({ ...newMeta, total: newTotal });
    }
  }

  protected getInitialState(): PaginationState {
    return orgStore.getState().meta;
  }

  get total(): number {
    return this.state.total;
  }

  private getTotal(state: Meta): number {
    const totalPages = Math.max(1, Math.ceil(state.total / state.perPage));
    const current = state.page;
    const max = 10;
    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    const end = Math.min(totalPages, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    return totalPages <= max ? totalPages : end - start + 1;
  }

  private setPage(page: number) {
    orgStore.setMeta('page', page);
    historyService.push({ page });
  }

  private setPerPage(perPage: number) {
    orgStore.setMeta('perPage', perPage);
    historyService.push({ perPage });
  }

  render(state: PaginationState): VNode<PaginationProps> {
    const dots = Array.from({ length: this.total }, (_, i) => {
      const page = i + 1;
      return this.h(
        'button',
        {
          class: [
            'pagination__item',
            {
              'pagination__item--active': state.page === page,
            },
          ],
          onClick: () => {
            this.setPage(page);
          },
          key: `dot-${page}`,
        },
        String(page)
      );
    });

    return this.h(
      'div',
      { class: 'ui-table__pagination', key: 'pagination-wrapper' },
      this.h(
        'div',
        { class: 'pagination', key: 'pagination' },
        this.h(
          'button',
          {
            class: 'pagination__arrow',
            disabled: state.page <= 1,
            onClick: () => {
              if (state.page <= 1) return;

              this.setPage(state.page - 1);
            },
            key: 'prev-page',
          },
          '<'
        ),
        this.h('div', { class: 'pagination__data', key: 'pagination-data' }, ...dots),
        this.h(
          'button',
          {
            class: 'pagination__arrow',
            disabled: state.page >= this.total,
            onClick: () => {
              if (state.page >= this.total) return;

              this.setPage(state.page + 1);
            },
            key: 'next-page',
          },
          '>'
        )
      ),
      this.h(
        'label',
        { class: 'ui-select__wrapper', key: 'per-page-label' },
        this.h(Select, {
          name: 'per-page',
          options: perPageOptions,
          value: String(state.perPage),
          onChange: this.setPerPage,
          key: 'per-page-select',
        })
      )
    ) 
  }

  protected shouldComponentUpdate(_: PaginationProps, nextState: PaginationState): boolean {
    const shouldUpdate =
      this.state.page !== nextState.page ||
      this.state.total !== nextState.total ||
      this.state.perPage !== nextState.perPage;
    return shouldUpdate;
  }
}
