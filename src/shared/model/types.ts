export type Meta = {
  total: number;
  perPage: number;
  page: number;
};

export type SortOrder = 'asc' | 'desc' | null;

export type Sort<T> = {
  key: keyof T | '';
  order: SortOrder;
};

export interface IOption {
  label: string;
  value: string;
}
