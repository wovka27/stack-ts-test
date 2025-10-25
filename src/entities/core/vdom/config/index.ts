import type BaseComponent from '@entities/base-component';

export const componentMap = new WeakMap<Node, BaseComponent<any, any>>();
