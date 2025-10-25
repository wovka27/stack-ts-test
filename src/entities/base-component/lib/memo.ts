import type BaseComponent from '@entities/base-component';
import { deepEqual, shallowEqual } from '@entities/core/vdom/lib/utils.ts';
import type { VNode } from '@entities/core/vdom/vnode';

export function memo<C extends typeof BaseComponent>(WrappedComponent: C, useDeepCompare: boolean = false): C {
  // @ts-ignore
  return class MemoizedComponent<
    P extends Record<keyof P, P[keyof P]>,
    S extends Record<keyof S, S[keyof S]>,
  > extends WrappedComponent<P, S> {
    public render(_state: S, _props: P): VNode<P> {
      throw new Error('Method not implemented.');
    }
    protected shouldComponentUpdate(nextProps: P, nextState: S): boolean {
      const compareFn = useDeepCompare ? deepEqual<P | S> : shallowEqual<P | S>;
      return !compareFn(this.props, nextProps) || !compareFn(this.state, nextState);
    }
  } as unknown as C;
}
