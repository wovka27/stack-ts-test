import type BaseComponent from '@entities/base-component';
import { componentMap } from '@entities/core/vdom/config';
import { applyPatches, isFn, isNonNullable, shallowEqual, updateProps } from '@entities/core/vdom/lib/utils.ts';
import type { ComponentConstructor, Patch, VNodeProps } from '@entities/core/vdom/model/vdom.types.ts';
import { VNode } from '@entities/core/vdom/vnode.ts';

export class VDom {
  private static instance: VDom;
  private unmountingNodes: Set<Node> = new Set();

  private constructor() {}

  public static getInstance(): VDom {
    if (!VDom.instance) {
      VDom.instance = new VDom();
    }
    return VDom.instance;
  }

  public createElement<P>(
    type: string | HTMLElementTagNameMap | ComponentConstructor<P>,
    props: VNodeProps<P> = {} as VNodeProps<P>,
    ...children: (VNode<P> | string)[]
  ): VNode<P> {
    const flatChildren = children.flatMap((child) =>
      typeof child === 'string' ? (new VNode('text', { text: child }) as unknown as string) : child
    );
    return new VNode(type, { ...props, children: flatChildren } as VNodeProps<P>, flatChildren);
  }

  public mount<P>(vnode: VNode<P> | string, container: HTMLElement, clearContainer: boolean = false): Node {
    if (typeof vnode !== 'string' && vnode.dom && vnode.dom.isConnected) {
      return vnode.dom;
    }

    if (clearContainer) {
      while (container.firstChild) {
        this.unmount(container.firstChild);
      }
    }

    if (typeof vnode === 'string') {
      const textNode = document.createTextNode(vnode);
      container.appendChild(textNode);
      return textNode;
    }

    const vNode = vnode as VNode<P>;
    if (typeof vNode.type === 'string') {
      if (vNode.type === 'text') {
        const textNode = document.createTextNode(String(vNode.props.text));
        container.appendChild(textNode);
        vNode.dom = textNode;
        return textNode;
      }

      const el = document.createElement(vNode.type);

      updateProps(el, vNode.props);
      vNode.children?.forEach((child) => {
        const childDom = this.mount(child, el, false);
        el.appendChild(childDom);
      });
      container.appendChild(el);
      vNode.dom = el;
      return el;
    } else {
      const component = new (vNode.type as ComponentConstructor<P>)(vNode.props as P);

      const childVNode = component.render(component.state, component.props);
      const dom = this.mount(childVNode, container, false);
      component.dom = dom;
      component.currentVNode = childVNode;
      componentMap.set(dom, component);
      if (isNonNullable(vNode.props.ref) && isFn(vNode.props.ref)) {
        vNode.props.ref(component);
      }
      component.componentDidMount();
      vNode.dom = dom;
      return dom;
    }
  }

  public unmount(node: Node): void {
    if (this.unmountingNodes.has(node)) {
      return;
    }
    this.unmountingNodes.add(node);
    try {
      const component = this.getComponentFromDom(node);
      if (component) {
        componentMap.delete(node);
        component.destroy();
      }
      if (node.parentNode && node.parentNode.contains(node)) {
        node.parentNode.removeChild(node);
      }
    } finally {
      this.unmountingNodes.delete(node);
    }
  }

  public diff<P>(oldVNode: VNode<P> | null, newVNode: VNode<P> | null, parentDom?: HTMLElement): Patch[] {
    const patches: Patch[] = [];

    if (!oldVNode && newVNode) {
      patches.push((dom) => {
        const newDom = this.mount(newVNode, parentDom || (dom.parentNode as HTMLElement));
        if (parentDom) {
          parentDom.appendChild(newDom);
        }
        newVNode.dom = newDom;
      });
      return patches;
    }

    if (oldVNode && !newVNode) {
      patches.push((dom) => {
        this.unmount(dom);
      });
      return patches;
    }

    if (!oldVNode || !newVNode) {
      return patches;
    }

    if (typeof oldVNode.type === 'string' && typeof newVNode.type === 'string') {
      if (oldVNode.type === 'text' && newVNode.type === 'text') {
        if (oldVNode.props.text !== newVNode.props.text) {
          patches.push((dom) => {
            (dom as Text).textContent = String(newVNode.props.text);
            newVNode.dom = dom;
          });
        } else {
          newVNode.dom = oldVNode.dom;
        }
        return patches;
      }

      if (oldVNode.type === newVNode.type) {
        patches.push((dom) => {
          updateProps(dom as HTMLElement, newVNode.props, oldVNode.props);
          const childPatches = this.diffChildren(
            (oldVNode.children || []) as (VNode<P> | string)[],
            (newVNode.children || []) as (VNode<P> | string)[],
            dom as HTMLElement
          );
          childPatches.forEach((patch, i) => {
            const childDom = (dom as HTMLElement).childNodes[i];
            if (childDom) {
              patch(childDom);
            } else if (newVNode.children && newVNode.children[i]) {
              const newDom = this.mount(newVNode.children[i], dom as HTMLElement);
              (dom as HTMLElement).appendChild(newDom);
            }
          });
          newVNode.dom = dom;
        });
        return patches;
      }
    } else if (
      typeof oldVNode.type !== 'string' &&
      typeof newVNode.type !== 'string' &&
      oldVNode.type === newVNode.type
    ) {
      patches.push((dom) => {
        const component = this.getComponentFromDom(dom);
        if (component) {
          if (!shallowEqual(oldVNode.props, newVNode.props)) {
            component.componentWillReceiveProps(newVNode.props);
            component.update(newVNode.props);
          }
          if (
            newVNode.props.ref !== oldVNode.props.ref &&
            isNonNullable(newVNode.props.ref) &&
            isFn(newVNode.props.ref)
          ) {
            if (isNonNullable(oldVNode.props.ref) && isFn(oldVNode.props.ref)) {
              oldVNode.props.ref(null);
            }
            newVNode.props.ref(component);
          }
          newVNode.dom = component.dom;
        } else {
          const newDom = this.mount(newVNode, parentDom || (dom.parentNode as HTMLElement));
          if (dom.parentNode && dom.parentNode.contains(dom)) {
            try {
              dom.parentNode.replaceChild(newDom, dom);
            } catch (error) {
              if (parentDom) {
                parentDom.appendChild(newDom);
              }
            }
          } else {
            if (parentDom) {
              parentDom.appendChild(newDom);
            }
          }
          newVNode.dom = newDom;
        }
      });
      return patches;
    }

    patches.push((dom) => {
      const newDom = this.mount(newVNode, parentDom || (dom.parentNode as HTMLElement));
      if (dom.parentNode && dom.parentNode.contains(dom)) {
        try {
          dom.parentNode.replaceChild(newDom, dom);
        } catch (error) {
          if (parentDom) {
            parentDom.appendChild(newDom);
          }
        }
      } else {
        if (parentDom) {
          parentDom.appendChild(newDom);
        }
      }
      newVNode.dom = newDom;
    });

    return patches;
  }

  private diffChildren<P>(
    oldChildren: (VNode<P> | string)[],
    newChildren: (VNode<P> | string)[],
    parentDom: HTMLElement
  ): Patch[] {
    const patches: Patch[] = [];

    const validOldChildren = oldChildren.filter((child) => child !== '' && child !== null && child !== undefined);
    const validNewChildren = newChildren.filter((child) => child !== '' && child !== null && child !== undefined);
    const maxLen = Math.max(validOldChildren.length, validNewChildren.length);
    const hasKeys =
      validNewChildren.some((child) => typeof child !== 'string' && isNonNullable(child.key)) ||
      validOldChildren.some((child) => typeof child !== 'string' && isNonNullable(child.key));

    while (parentDom.childNodes.length > validNewChildren.length) {
      const lastChild = parentDom.lastChild;
      if (lastChild && !this.unmountingNodes.has(lastChild)) {
        this.unmount(lastChild);
      }
    }

    if (!hasKeys) {
      for (let i = 0; i < maxLen; i++) {
        const oldChild = validOldChildren[i] || null;
        const newChild = validNewChildren[i] || null;

        if (
          oldChild &&
          newChild &&
          typeof oldChild === 'object' &&
          typeof newChild === 'object' &&
          oldChild.type === newChild.type
        ) {
          const childPatches = this.diff(oldChild as VNode<P>, newChild as VNode<P>, parentDom);
          if (childPatches.length > 0) {
            patches.push((childDom: Node) => {
              applyPatches(childDom, childPatches);
            });
          }
        } else if (newChild && !oldChild) {
          patches.push(() => {
            const newDom = this.mount(newChild, parentDom);
            const refNode = i < parentDom.childNodes.length ? parentDom.childNodes[i] : null;
            if (refNode && parentDom.contains(refNode)) {
              parentDom.insertBefore(newDom, refNode);
            } else {
              parentDom.appendChild(newDom);
            }
          });
        } else if (oldChild && !newChild) {
          patches.push((childDom: Node) => {
            this.unmount(childDom);
          });
        } else {
          patches.push((childDom: Node) => {
            const newDom = this.mount(newChild!, parentDom);
            if (childDom.parentNode && childDom.parentNode.contains(childDom)) {
              try {
                childDom.parentNode.replaceChild(newDom, childDom);
              } catch {
                parentDom.appendChild(newDom);
              }
            } else {
              parentDom.appendChild(newDom);
            }
          });
        }
      }
    } else {
      const oldKeyMap = new Map<string, { vNode: VNode<P> | string; domIndex: number }>();
      validOldChildren.forEach((child, index) => {
        if (typeof child !== 'string' && isNonNullable(child.key)) {
          oldKeyMap.set(String(child.key), { vNode: child, domIndex: index });
        }
      });

      validNewChildren.forEach((newChild, newIndex) => {
        if (typeof newChild === 'string') {
          patches.push(() => {
            const newDom = this.mount(newChild, parentDom);
            const refNode = newIndex < parentDom.childNodes.length ? parentDom.childNodes[newIndex] : null;
            if (refNode && parentDom.contains(refNode)) {
              parentDom.insertBefore(newDom, refNode);
            } else {
              parentDom.appendChild(newDom);
            }
          });
          return;
        }

        const key = newChild.key;
        if (!isNonNullable(key)) {
          const oldChild = validOldChildren[newIndex];
          if (oldChild && typeof oldChild === 'object' && oldChild.type === newChild.type) {
            const childPatches = this.diff(oldChild as VNode<any>, newChild, parentDom);
            if (childPatches.length > 0) {
              patches.push((childDom: Node) => {
                applyPatches(childDom, childPatches);
              });
            }
          } else {
            patches.push(() => {
              const newDom = this.mount(newChild, parentDom);
              const refNode = newIndex < parentDom.childNodes.length ? parentDom.childNodes[newIndex] : null;
              if (refNode && parentDom.contains(refNode)) {
                parentDom.insertBefore(newDom, refNode);
              } else {
                parentDom.appendChild(newDom);
              }
            });
          }
          return;
        }

        const oldInfo = oldKeyMap.get(String(key));
        if (!oldInfo) {
          patches.push(() => {
            const newDom = this.mount(newChild, parentDom);
            const refNode = newIndex < parentDom.childNodes.length ? parentDom.childNodes[newIndex] : null;
            if (refNode && parentDom.contains(refNode)) {
              parentDom.insertBefore(newDom, refNode);
            } else {
              parentDom.appendChild(newDom);
            }
          });
        } else {
          const childPatches = this.diff(oldInfo.vNode as VNode<any>, newChild, parentDom);
          if (childPatches.length > 0) {
            patches.push((childDom: Node) => {
              applyPatches(childDom, childPatches);
              if (oldInfo.domIndex !== newIndex && !this.unmountingNodes.has(childDom)) {
                const refNode = newIndex < parentDom.childNodes.length ? parentDom.childNodes[newIndex] : null;
                if (refNode && parentDom.contains(refNode)) {
                  parentDom.insertBefore(childDom, refNode);
                } else {
                  parentDom.appendChild(childDom);
                }
              }
            });
          }
        }

        oldKeyMap.delete(String(key));
      });

      oldKeyMap.forEach((_, key) => {
        const oldIndex = oldKeyMap.get(key)!.domIndex;
        patches.push(() => {
          const domNode = parentDom.childNodes[oldIndex];
          if (domNode && !this.unmountingNodes.has(domNode)) {
            this.unmount(domNode);
          }
        });
      });
    }

    return patches;
  }

  public getComponentFromDom(dom: Node): BaseComponent | null {
    return componentMap.get(dom) || null;
  }
}
