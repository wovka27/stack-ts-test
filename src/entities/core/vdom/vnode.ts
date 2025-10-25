import type { ComponentConstructor, VNodeProps } from '@entities/core/vdom/model/vdom.types.ts';

export class VNode<P> {
  public readonly type: string | HTMLElementTagNameMap | ComponentConstructor<P>;
  public readonly props: Readonly<VNodeProps<P>>;
  public readonly children?: ReadonlyArray<VNode<P> | string>;
  public readonly key?: string | number;
  public dom: Node | null = null;

  constructor(
    type: string | HTMLElementTagNameMap | ComponentConstructor<P>,
    props: VNodeProps<P> = {} as VNodeProps<P>,
    children?: (VNode<P> | string)[]
  ) {
    this.type = type;
    this.props = Object.freeze({ ...(props || {}) });
    this.children = children ? Object.freeze(children.slice()) : undefined;
    this.key = props?.key;
  }
}
