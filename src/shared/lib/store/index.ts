import type { Subscriber } from '@shared/lib/store/model';

export class Store<S extends Record<keyof S, S[keyof S]>> {
  private state: Readonly<S>;
  private readonly subscribers = new Set<Subscriber>();

  constructor(initialState: S) {
    this.state = Object.freeze({ ...initialState });
  }

  public getState(): Readonly<S> {
    return this.state;
  }

  public setState(patch: Partial<S>): void {
    const nextState = Object.freeze({ ...this.state, ...patch });
    this.state = nextState;
    this.notify();
  }

  public subscribe(sub: Subscriber): void {
    this.subscribers.add(sub);
  }

  public unsubscribe(sub: Subscriber): void {
    this.subscribers.delete(sub);
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      try {
        sub.updateFromStore();
      } catch (err) {
        console.error('[Store] subscriber threw during notify:', err);
      }
    }
  }
}
