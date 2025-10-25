export type QueryParams = Record<string, string | number | undefined>;

export class HistoryService {
  private listeners: Set<(params: URLSearchParams) => void> = new Set();

  constructor() {
    window.addEventListener('popstate', this.handlePopState);
  }

  private handlePopState = (): void => {
    const params = new URLSearchParams(window.location.search);
    this.listeners.forEach((l) => l(params));
  };

  private setParams(params: QueryParams): URL {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) url.searchParams.delete(key);
      else url.searchParams.set(key, String(value));
    });

    return url;
  }

  public push(params: QueryParams): void {
    const url = this.setParams(params);
    window.history.pushState({}, '', url.toString());
    this.handlePopState();
  }

  public replace(params: QueryParams): void {
    const url = this.setParams(params);
    window.history.replaceState({}, '', url.toString());
    this.handlePopState();
  }

  public onChange(listener: (params: URLSearchParams) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    window.removeEventListener('popstate', this.handlePopState);
    this.listeners.clear();
  }

  public get query() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }
}

export const historyService = new HistoryService();
