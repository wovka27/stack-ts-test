import './styles.css';

import BaseComponent from '@entities/base-component';
import type { ISelectProps, ISelectState } from '@shared/ui/select/model';

export class Select extends BaseComponent<ISelectProps, ISelectState> {
  constructor(props: ISelectProps) {
    super(props);
  }

  protected shouldComponentUpdate(nextProps: ISelectProps): boolean {
    return (
      this.props.label !== nextProps.label ||
      this.props.options !== nextProps.options ||
      this.props.value !== nextProps.value ||
      this.props.error !== nextProps.error ||
      this.props.name !== nextProps.name ||
      this.props.disabled !== nextProps.disabled ||
      this.props.onChange !== nextProps.onChange
    );
  }

  render(_state: ISelectState, props: ISelectProps) {
    const { label, options, value, error, disabled = false, onChange } = props;

    const children = [];

    const selectClasses = ['ui-select', { 'ui-select--error': error }, { 'ui-select--disabled': disabled }];

    const optionNodes = options.map((option) =>
      this.h(
        'option',
        {
          value: option.value,
          selected: option.value === value,
          key: option.value,
        },
        option.label
      )
    );

    const selectNode = this.h(
      'div',
      { class: 'ui-select__container', key: 'select-container' },
      this.h(
        'select',
        {
          class: selectClasses,
          value,
          disabled: disabled,
          onchange: disabled ? undefined : (e: Event) => onChange?.((e.target as HTMLSelectElement).value),
        },
        ...optionNodes
      ),
      this.h('span', { class: 'ui-select__arrow', key: 'arrow' }, '▼')
    );

    if (label) children.push(this.h('label', { class: 'ui-select__label', key: 'label' }, label));

    children.push(selectNode);

    if (error) children.push(this.h('span', { class: 'ui-select__error', key: 'error' }, error));

    return this.h('div', { class: 'ui-select__wrapper', key: 'select-wrapper' }, ...children);
  }
}
