import type BaseComponent from '@entities/base-component';

export type VDomChild<P = any> = VNode<P> | string | number | null | undefined;

export interface VNode<P = any> {
  type: string | HTMLElementTagNameMap | ComponentConstructor<P>;
  props: VNodeProps<P>;
  children?: VDomChild<P>[];
  key?: string | number | null;
  dom?: Node | null;
}

export type VNodeProps<P = any> = {
  key?: string | number;
  ref?: (instance: HTMLElement | BaseComponent<any, any> | null) => void;
  children?: VDomChild<P>[];
  text?: string;
} & Record<string, any>;

export interface ComponentConstructor<P = unknown, S = unknown> {
  new (props: P): BaseComponent<P, S>;
}

export type Patch = (dom: Node) => void;
