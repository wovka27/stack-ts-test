import './styles.css';

import BaseComponent from '@entities/base-component';
import { deepEqual, getNestedValue, setNestedValue } from '@entities/core/vdom/lib/utils.ts';
import type { FormFieldConfig, FormGeneratorProps } from '@entities/form-generator/model/types.ts';
import { FormsValidation } from '@shared/lib/services';
import { Input } from '@shared/ui/input';

export class FormGenerator<T> extends BaseComponent<FormGeneratorProps<T>, { errors: Record<string, string | null> }> {
  private validation: FormsValidation;
  private formRef: HTMLElement | BaseComponent<any, any> | null = null;

  constructor(deps: FormGeneratorProps<T>) {
    super(deps);
    this.state = this.getInitialState();
    this.validation = new FormsValidation(false);
    if (deps.ref) deps.ref(this);
  }

  protected getInitialState(): { errors: Record<string, string | null> } {
    return { errors: {} };
  }

  public reset(): void {
    this.setState({ errors: {} });
    (this.formRef as HTMLFormElement)?.reset();
  }

  private onSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    const formElement = e.target as HTMLFormElement;
    const errors = this.validation.validateForm(formElement, this.props.fields);
    this.setState({ errors });
    const isValid = Object.values(errors).every((error) => error === null);
    if (isValid) {
      const formData = Object.fromEntries(new FormData(formElement));
      const data = this.flatten(formData as T);
      this.props.onSubmit?.(data as T);
      this.reset();
    }
  };

  private flatten(flatData: Record<keyof T, T[keyof T]>): T {
    const result: T = {} as T;
    for (const [key, value] of Object.entries(flatData)) {
      setNestedValue(result, key, value);
    }
    return result;
  }

  private onInput = (e: Event): void => {
    e.preventDefault();
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name;
    if (!name) return;

    const value =
      target.type === 'checkbox' || target.type === 'radio'
        ? target.checked
        : target.value.match(/^\d+$/) && target.type !== 'select-one'
          ? Number(target.value)
          : target.value;

    const newForm = { ...this.props.form };
    setNestedValue(newForm, name, value);
    this.props.onInput?.(name, value);
  };

  private onBlur = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name;
    if (!name) return;

    const fieldConfig =
      this.props.fields.find((f) => f.name === name) || this.findFieldInGroup(name, this.props.fields);
    const error = fieldConfig ? this.validation.validateField(target, fieldConfig.validator) : null;
    this.setState({ errors: { ...this.state.errors, [name]: error } });
  };

  private onFocus = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name;
    if (!name) return;

    this.setState({ errors: { ...this.state.errors, [name]: null } });
  };

  private ref = (instance: HTMLElement | BaseComponent<any, any> | null) => {
    this.formRef = instance;
  };

  private findFieldInGroup(name: string, fields: FormFieldConfig[]): FormFieldConfig | undefined {
    for (const field of fields) {
      if (field.name === name) return field;
      if (field.group) {
        const found = this.findFieldInGroup(name, field.group);
        if (found) return found;
      }
    }
    return undefined;
  }

  private renderFields = (field: FormFieldConfig): any => {
    if (field.group && field.group.length) {
      return this.h(
        'div',
        { class: ['ui-form__group', field.class], key: `group-${field.name || field.label || 'group'}` },
        ...field.group.map(this.renderFields)
      ) 
    }

    if (!field.name || !field.label) {
      return this.h('span', { key: `empty-${field.type}` }) 
    }

    if (field.type === 'select') {
      //...
    }

    return this.h(
      'label',
      {
        class: 'form-field',
        key: `field-${field.name}`,
        type: '',
      },
      this.h(Input, {
        ...field,
        type: field.type!,
        value: getNestedValue(this.props.form, field.name ?? '') ?? ('' as T[keyof T]),
        oninput: this.onInput,
        onblur: this.onBlur,
        onfocus: this.onFocus,
        error: this.state.errors[field.name] || undefined,
        key: `input-${field.name}`,
      })
    );
  };

  protected shouldComponentUpdate(
    nextProps: FormGeneratorProps<T>,
    nextState: { form: T; errors: Record<string, string | null> }
  ): boolean {
    const shouldUpdate =
      this.props.formId !== nextProps.formId ||
      this.props.onInput !== nextProps.onInput ||
      this.props.onSubmit !== nextProps.onSubmit ||
      !deepEqual(this.props.form, nextProps.form) ||
      !deepEqual(this.state.errors, nextState.errors) ||
      !deepEqual(this.props.fields, nextProps.fields);

    return shouldUpdate;
  }

  componentWillReceiveProps(nextProps: Partial<FormGeneratorProps<T>>) {
    if (!deepEqual(this.props.form, nextProps.form) || this.props.formId !== nextProps.formId) {
      //...
    }
  }

  componentDidMount(): void {
    this.validation.bindEvents(this.dom as HTMLElement);
  }

  componentDidUpdate(
    _prevProps: FormGeneratorProps<T>,
    _prevState: { form: T; errors: Record<string, string | null> }
  ): void {}

  destroy(): void {
    this.validation.destroy();
    this.reset();
    this.formRef = null;
    super.destroy();
  }

  public render(_state: { form: T; errors: Record<string, string | null> }) {
    return this.h(
      'form',
      {
        ref: this.ref,
        class: 'ui-form',
        id: this.props.formId,
        'data-js-form': '',
        noValidate: true,
        method: this.props.method,
        onsubmit: this.onSubmit,
      },
      ...this.props.fields.map(this.renderFields)
    ) 
  }
}
