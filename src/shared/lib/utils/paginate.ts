export const paginate = <T>(items: T[], page: number, perPage: number): T[] => {
  if (perPage <= 0) return items;
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
};
