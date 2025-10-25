import { VDom } from '@entities/core/vdom';
import { applyPatches } from '@entities/core/vdom/lib/utils.ts';
import type { ComponentConstructor, VNodeProps } from '@entities/core/vdom/model/vdom.types.ts';
import type { VNode } from '@entities/core/vdom/vnode.ts';
import type { Store } from '@shared/lib/store';
import type { Subscriber } from '@shared/lib/store/model';

export default abstract class BaseComponent<P = {}, S = {}> implements Subscriber {
  props: P;
  state: S;
  public dom: Node | null = null;
  public currentVNode: VNode<P> | null = null;
  private vDom: VDom = VDom.getInstance();
  private stores: Store<any>[] = [];

  constructor(props: P) {
    this.props = props;
    this.state = this.getInitialState();
  }

  protected getInitialState(): S {
    return {} as S;
  }

  protected h<P>(
    type: string | HTMLElementTagNameMap | ComponentConstructor<P>,
    props: VNodeProps<P> = {} as VNodeProps<P>,
    ...children: (VNode<P> | string)[]
  ): any {
    return this.vDom.createElement(type, props, ...children);
  }

  public abstract render(state: S, props: P): any;

  public mount(container: HTMLElement): void {
    this.dom = this.vDom.mount(this.h(this.constructor as ComponentConstructor<P, unknown>, this.props as VNodeProps<P>), container);
    this.currentVNode = this.render(this.state, this.props);
    this.componentDidMount();
  }

  public setState(newState: Partial<S>, callback?: () => void): void {
    const nextState = { ...this.state, ...newState };
    if (this.shouldComponentUpdate(this.props, nextState)) {
      this.state = nextState;
      this.update(this.props);
    } else {
      this.state = nextState;
    }
    if (callback) {
      callback();
    }
  }

  public update(newProps: P): void {
    const vDom = VDom.getInstance();
    const oldVNode = this.currentVNode;
    this.props = newProps;
    const newVNode = this.render(this.state, this.props);
    const patches = vDom.diff(oldVNode, newVNode, this.dom?.parentNode as HTMLElement);

    if (this.dom) applyPatches(this.dom, patches);

    this.currentVNode = newVNode;
    this.componentDidUpdate(this.props, this.state);
  }

  protected reRender(prevStateOrProps?: S | P): void {
    if (!this.dom || !this.currentVNode) {
      return;
    }

    const prevProps = prevStateOrProps && 'props' in this ? { ...this.props } : prevStateOrProps;
    const prevState = prevStateOrProps && 'state' in this ? { ...this.state } : prevStateOrProps;
    const newVNode = this.render(this.state, this.props);

    const patches = this.vDom.diff(this.currentVNode, newVNode, this.dom as HTMLElement);
    applyPatches(this.dom, patches);
    this.currentVNode = newVNode;
    this.componentDidUpdate(prevProps as P, prevState as S);
  }

  public destroy(): void {
    this.componentWillUnmount();
    this.stores.forEach((store) => store.unsubscribe(this));
    if (this.currentVNode && this.currentVNode.dom) {
      this.vDom.unmount(this.currentVNode.dom);
    }
    this.dom = null;
    this.currentVNode = null;
  }

  public updateFromStore(): void {
    this.reRender();
  }

  protected subscribeToStore(store: Store<any>): void {
    this.stores.push(store);
    store.subscribe(this);
  }

  public componentDidMount(): void {}
  protected componentDidUpdate(_prevProps: P, _prevState: S): void {}
  public componentWillReceiveProps(_nextProps: Partial<P>): void {}
  protected componentWillUnmount(): void {}
  protected shouldComponentUpdate(_nextProps: P, _nextState: S): boolean {
    return true;
  }
}
