import type { VNode } from '@entities/core/vdom/vnode.ts';

export interface DialogState {
  isOpen: boolean;
}

export interface DialogSlots {
  header?: VNode<{}>[];
  body?: VNode<{}>[];
  footer?: VNode<{}>[] | ((close: () => void) => VNode<{}>[]);
}

export interface DialogProps {
  isOpen: boolean;
  slots?: DialogSlots;
  onOpen?: () => void;
  onClose?: () => void;
}
