import './styles.css';

import BaseComponent from '@entities/base-component';
import type { IButtonProps, IButtonState } from '@shared/ui/button/model';
import { clsx } from 'clsx';

export default class Button extends BaseComponent<IButtonProps, IButtonState> {
  constructor(props: IButtonProps) {
    super(props);
  }

  render(_state: IButtonState, props: IButtonProps) {
    const { text, size = 'md', variant = 'primary', disabled = false, onClick, children: _, ...rest } = props;

    const classes = clsx('ui-button', `ui-button--${size}`, `ui-button--${variant}`, {
      'ui-button--disabled': disabled,
    });

    return this.h(
      'button',
      {
        ...rest,
        class: classes,
        onclick: disabled ? undefined : onClick,
        disabled: disabled,
        key: 'button',
      },
      text
    );
  }

  protected shouldComponentUpdate(nextProps: IButtonProps): boolean {
    return (
      this.props.text !== nextProps.text ||
      this.props.size !== nextProps.size ||
      this.props.variant !== nextProps.variant ||
      this.props.disabled !== nextProps.disabled ||
      this.props.onClick !== nextProps.onClick
    );
  }
}
