import type { VNode } from '@entities/core/vdom/vnode.ts';

export interface IColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
}

export interface ISort<T> {
  key: IColumn<T>['key'] | '';
  order: 'asc' | 'desc' | null;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}

export interface TableProps<T extends { id: string }> {
  columns: IColumn<T>[];
  rows: Array<T & { id: string }>;
  sort: ISort<T>;
  pagination: PaginationState & { perPage: number };
  className?: string;
  stiped?: boolean;
  hovered?: boolean;
  actionsSlot?: (row: T) => VNode<T>[];
  clickRow?: (row: T) => void;
  perPageOptions?: { value: string; label: string }[];
  onPerPageChange?: (value: string) => void;
  onPageChange?: (value: number) => void;
  transformColumn?: Partial<Record<keyof T, (row: T) => VNode<T> | string>>;
  onSort?: (sort: ISort<T>) => void;
}

export interface TableState<T> {
  columns: IColumn<T>[];
  rows: Array<T>;
  sort: ISort<T>;
  pagination: PaginationState & { perPage: number };
}
