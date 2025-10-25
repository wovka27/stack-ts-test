import './styles.css';

import BaseComponent from '@entities/base-component';
import type { Meta } from '@shared/model/types.ts';
import type { IColumn, TableProps, TableState } from '@shared/ui/table/model';
import TableRow from '@shared/ui/table/ui/table-row.ts';

export class Table<T extends { id: string }> extends BaseComponent<TableProps<T>, TableState<T>> {
  constructor(props: TableProps<T>) {
    super(props);
    this.state = this.getInitialState();
  }

  protected getInitialState(): TableState<T> {
    return {
      columns: this.props.columns,
      rows: this.props.rows,
      sort: this.props.sort,
      pagination: this.props.pagination,
    };
  }

  private paginateList(list: T[], meta: Meta): T[] {
    const start = (meta.page - 1) * meta.perPage;
    const end = start + meta.perPage;
    return list.slice(start, end);
  }

  private sortList(list: T[]) {
    const { key, order } = this.state.sort;
    if (!key || !order) return list;

    return list.toSorted((a, b) => {
      const isASC = order === 'asc';

      const va = a[key];
      const vb = b[key];
      if (va === vb) return 0;

      if (typeof va === 'number' && typeof vb === 'number') return isASC ? va - vb : vb - va;

      return isASC ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  get list() {
    const paginated = this.paginateList(this.state.rows, this.state.pagination);
    const sorted = this.sortList(paginated);
    return sorted;
  }

  private onClickRow = (row: T): void => {
    if (this.props.clickRow) this.props.clickRow(row);
  };

  protected shouldComponentUpdate(nextProps: TableProps<T>, nextState: TableState<T>): boolean {
    const shouldUpdate =
      this.props.className !== nextProps.className ||
      this.props.stiped !== nextProps.stiped ||
      this.props.hovered !== nextProps.hovered ||
      this.props.transformColumn !== nextProps.transformColumn ||
      this.state.sort.order !== nextState.sort.order ||
      this.state.sort.key !== nextState.sort.key ||
      this.props.pagination.page !== nextProps.pagination.page ||
      this.props.pagination.perPage !== nextProps.pagination.perPage ||
      this.props.pagination.total !== nextProps.pagination.total ||
      this.state.pagination.page !== nextState.pagination.page ||
      this.state.pagination.perPage !== nextState.pagination.perPage ||
      this.state.pagination.total !== nextState.pagination.total ||
      this.props.rows.length !== nextProps.rows.length ||
      this.state.rows.length !== nextState.rows.length;

    return shouldUpdate;
  }

  public componentWillReceiveProps(nextProps: TableProps<T>): void {
    if (
      this.props.columns !== nextProps.columns ||
      this.props.rows !== nextProps.rows ||
      this.props.sort.order !== nextProps.sort.order ||
      this.props.sort.key !== nextProps.sort.key ||
      this.props.pagination.page !== nextProps.pagination.page ||
      this.props.pagination.perPage !== nextProps.pagination.perPage ||
      this.props.pagination.total !== nextProps.pagination.total
    ) {
      this.setState({
        columns: nextProps.columns,
        rows: nextProps.rows,
        sort: nextProps.sort,
        pagination: nextProps.pagination,
      });
    }
  }

  destroy(): void {
    super.destroy();
  }

  public render(state: TableState<T>, props: TableProps<T>) {
    const getHeadColumn = (col: IColumn<T>) => {
      const cycle: (typeof state.sort.order)[] = ['asc', 'desc', null];
      const orderTypeMap = {
        asc: '▲',
        desc: '▼',
        null: '',
      };

      const getIndicator = (col: IColumn<T>) => {
        if (!(col.key === state.sort.key && col.sortable)) return '';

        const indicator = orderTypeMap[`${state.sort.order}`] || '';
        return indicator;
      };

      const setOrder = (order: typeof state.sort.order) => {
        return cycle[(cycle.indexOf(order) + 1) % cycle.length];
      };

      const indicator = getIndicator(col);
      return this.h(
        'th',
        {
          class: ['ui-table__th', { sortable: col.sortable }, { clickable: col.sortable && state.rows.length }],
          onclick: state.rows.length
            ? () => {
                if (!col.sortable) return;
                const newSort = {
                  key: col.key,
                  order: setOrder(state.sort.order),
                };

                this.setState({ sort: newSort });
                if (props.onSort) props.onSort(newSort);
              }
            : undefined,
          key: 'th-' + String(col.key),
        },
        this.h('span', { key: 'th-label' }, col.label),
        indicator
      ) 
    };

    const head = this.h(
      'thead',
      { key: 'thead' },
      this.h(
        'tr',
        { key: 'tr-thead' },
        ...state.columns.map(getHeadColumn),
        props.actionsSlot ? this.h('th', { width: 80, class: 'ui-table__th', key: 'th-actions' }) : ''
      )
    );

    const rows = this.list.map((row, index) => {
      return this.h(TableRow<T>, {
        index,
        row,
        stiped: props.stiped,
        hovered: props.hovered,
        columns: state.columns,
        transformColumn: props.transformColumn,
        clickRow: this.onClickRow,
        actionsSlot: props.actionsSlot,
      });
    });

    const body = this.h('tbody', { key: 'tbody' }, ...rows);

    return this.h(
      'div',
      {
        class: 'ui-table__wrapper',
        key: 'table-wrapper',
      },
      this.h('div', { class: 'ui-table', key: 'table-container' }, this.h('table', { key: 'table' }, head, body))
    ) 
  }
}
