import './styles.css';

import BaseComponent from '@entities/base-component';
import type { DialogProps, DialogState } from '@entities/base-modal/model';

export class Modal<P extends DialogProps = DialogProps, S extends DialogState = DialogState> extends BaseComponent<
  P,
  S
> {
  protected dialogEl: HTMLDialogElement | null = null;

  constructor(props: P) {
    super(props);
  }

  componentDidMount(): void {
    if (this.dialogEl) {
      this.dialogEl.addEventListener('click', this.handleBackdropClick);
      this.dialogEl.addEventListener('cancel', this.close);
      if (this.props.isOpen && !this.dialogEl.open) {
        try {
          this.dialogEl.showModal();

          if (this.props.onOpen) {
            this.props.onOpen();
          }
        } catch {}
      }
    } else {
    }
  }

  componentWillUnmount(): void {
    if (this.dialogEl) {
      this.dialogEl.removeEventListener('click', this.handleBackdropClick);
      this.dialogEl.removeEventListener('cancel', this.close);
      if (this.dialogEl.open) {
        this.dialogEl.close();
      }
      this.dialogEl = null;
    }
  }

  private handleBackdropClick = (e: MouseEvent): void => {
    if (!this.dialogEl) return;

    const innerEl = this.dialogEl.querySelector('.base-modal__inner');

    if (!innerEl) return;

    const rect = innerEl.getBoundingClientRect();

    const isOutside =
      e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;

    if (isOutside) this.close();
  };

  protected close(): void {
    if (this.dialogEl && this.dialogEl.open) this.dialogEl.close();

    if (this.props.onClose) this.props.onClose();
  }

  render(_state: S, props: P) {
    const { slots = {}, isOpen } = props;

    const children = [];

    if (slots.header?.length) {
      children.push(this.h('header', { class: 'base-modal__header', key: 'header' }, ...slots.header));
    }

    if (slots.body?.length) {
      children.push(this.h('div', { class: 'base-modal__body', key: 'body' }, ...slots.body));
    }

    if (slots.footer) {
      const footer = typeof slots.footer === 'function' ? slots.footer(this.close) : slots.footer;
      children.push(this.h('footer', { class: 'base-modal-footer', key: 'footer' }, ...footer));
    }

    return this.h(
      'dialog',
      {
        class: ['base-modal', { 'base-modal--open': isOpen }],
        ref: (el) => {
          if (this.dialogEl !== el) {
            this.dialogEl = el as HTMLDialogElement;
            if (isOpen && this.dialogEl && !this.dialogEl.open) {
              try {
                this.dialogEl.showModal();

                if (this.props.onOpen) {
                  this.props.onOpen();
                }
              } catch {
                //...
              }
            }
          }
        },
        onclick: this.handleBackdropClick,
        key: 'modal',
      },
      this.h('div', { class: 'base-modal__inner', key: 'inner' }, ...children)
    ) 
  }

  protected componentDidUpdate(prevProps: P, _prevState: S): void {
    if (this.dialogEl) {
      if (this.props.isOpen && !prevProps?.isOpen && !this.dialogEl.open) {
        try {
          this.dialogEl.showModal();

          if (this.props.onOpen) {
            this.props.onOpen();
          }
        } catch {}
      } else if (!this.props.isOpen && prevProps?.isOpen && this.dialogEl.open) {
        try {
          this.dialogEl.close();

          if (this.props.onClose) {
            this.props.onClose();
          }
        } catch {}
      }
    } else {
    }
  }

  protected shouldComponentUpdate(nextProps: P, _nextState: S): boolean {
    const shouldUpdate =
      this.props.isOpen !== nextProps.isOpen ||
      this.props.slots !== nextProps.slots ||
      this.props.onOpen !== nextProps.onOpen ||
      this.props.onClose !== nextProps.onClose;

    return shouldUpdate;
  }

  componentWillReceiveProps(nextProps: P): void {
    if (this.props.slots !== nextProps.slots) {
      this.reRender();
    }
  }

  public destroy(): void {
    if (this.dialogEl) {
      this.dialogEl.removeEventListener('click', this.handleBackdropClick);
      this.dialogEl.removeEventListener('cancel', this.close);
      if (this.dialogEl.open) {
        this.dialogEl.close();
      }
      this.dialogEl = null;
    }
    super.destroy();
  }
}
