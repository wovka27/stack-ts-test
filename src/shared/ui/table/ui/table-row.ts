import BaseComponent from '@entities/base-component';
import type { VNode } from '@entities/core/vdom/vnode.ts';
import type { IColumn, TableProps } from '@shared/ui/table/model';

interface Props<T extends { id: string }> {
  index: number;
  stiped?: boolean;
  hovered?: boolean;
  columns: IColumn<T>[];
  row: T;
  transformColumn?: TableProps<T>['transformColumn'];
  clickRow?: (row: T) => void;
  actionsSlot?: TableProps<T>['actionsSlot'];
}

interface State {}

export default class TableRow<T extends { id: string }> extends BaseComponent<Props<T>, State> {
  constructor(props: Props<T>) {
    super(props);
  }

  transformColumn = (row: T, col: IColumn<T>) => {
    const result = this.props.transformColumn?.[col.key]?.(row) ?? String(row[col.key as keyof T] ?? '');
    return result;
  };

  shouldComponentUpdate(nextProps: Props<T>, _nextState: State) {
    const shouldUpdate =
      this.props.stiped !== nextProps.stiped ||
      this.props.hovered !== nextProps.hovered ||
      this.props.transformColumn !== nextProps.transformColumn ||
      this.props.clickRow !== nextProps.clickRow ||
      this.props.actionsSlot !== nextProps.actionsSlot ||
      this.props.row === nextProps.row;
    return shouldUpdate;
  }

  render(_state: State, props: Props<T>) {
    return this.h(
      'tr',
      {
        class: [
          'ui-table__row',
          'clickable',
          { 'ui-table__row--striped': props.stiped && props.index % 2 === 0 },
          { 'ui-table__row--hover': props.hovered },
        ],
        onClick: () => this.props.clickRow?.(props.row),
        key: 'row-' + props.row.id,
      },
      ...this.props.columns.map(
        (col): VNode<unknown> =>
          this.h('td', { key: `td-${String(col.key)}-${this.props.index}` }, this.transformColumn(props.row, col))
      ),
      this.props.actionsSlot
        ? this.h('td', { width: 80, key: 'td-actions' }, ...this.props.actionsSlot(this.props.row))
        : ''
    ) 
  }
}
