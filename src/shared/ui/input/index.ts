import './styles.css';

import BaseComponent from '@entities/base-component';
import type { VNode } from '@entities/core/vdom/vnode.ts';
import type { IInputProps, IInputState } from '@shared/ui/input/model';
import IMask from 'imask';

export class Input extends BaseComponent<IInputProps, IInputState> {
  private mask?: any;
  constructor(props: IInputProps) {
    super(props);
  }

  componentDidMount(): void {
    if (this.props.type === 'phone' && this.dom) {
      const inputElement = (this.dom as HTMLDivElement).querySelector('input');
      if (inputElement) {
        this.mask = IMask(inputElement, {
          mask: '+{0} 000 000 00 00',
          lazy: false,
          placeholderChar: '_',
        });
        if (this.props.value) {
          this.mask.value = this.props.value;
        }
      }
    }
  }

  componentDidUpdate(prevProps: IInputProps): void {
    if (this.props.type === 'phone' && this.mask && this.props.value !== prevProps?.value) {
      this.mask.value = this.props.value || '';
    }
  }

  shouldComponentUpdate(nextProps: IInputProps): boolean {
    return (
      this.props.label !== nextProps.label ||
      this.props.type !== nextProps.type ||
      this.props.value !== nextProps.value ||
      this.props.error !== nextProps.error ||
      this.props.name !== nextProps.name ||
      this.props.disabled !== nextProps.disabled ||
      this.props.onChange !== nextProps.onChange
    );
  }

  destroy(): void {
    if (this.mask) {
      this.mask.destroy();
    }
    super.destroy();
  }

  render(_state: IInputState, props: IInputProps) {
    const { label, type = 'text', error, disabled = false, children: _, value, onChange, ...rest } = props;

    const children: VNode<unknown>[] = [];

    const inputClasses = ['ui-input', { 'ui-input--error': error }, { 'ui-input--disabled': disabled }];

    const inputNode = this.h('input', {
      ...rest,
      type: type === 'phone' ? 'tel' : type,
      class: inputClasses,
      disabled,
      value: value || '',
      oninput: disabled
        ? undefined
        : (e: Event) => {
            const inputValue = (e.target as HTMLInputElement).value;
            const unmaskedValue = this.mask ? this.mask.unmaskedValue : inputValue;
            onChange?.(unmaskedValue);
          },
    });
    if (label) children.push(this.h('label', { class: 'ui-input__label', key: 'label' }, label));

    children.push(inputNode);

    if (error) children.push(this.h('span', { class: 'ui-input__error', key: 'error' }, error));

    return this.h(
      'div',
      { class: 'ui-input__wrapper', key: 'ui-input__wrapper' },
      ...children
    ) 
  }
}
