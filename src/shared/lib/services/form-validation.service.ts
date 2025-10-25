import type { FormFieldConfig } from '@entities/form-generator/model/types';

export class FormsValidation {
  selectors = {
    form: '[data-js-form]',
  };

  errorMessages = {
    valueMissing: () => 'Пожалуйста, заполните это поле',
    patternMismatch: ({ title }: HTMLInputElement | HTMLSelectElement) => title || 'Данные не соответствуют формату',
    tooShort: ({ minLength }: HTMLInputElement) => `Слишком короткое значение, минимум символов — ${minLength}`,
    tooLong: ({ maxLength }: HTMLInputElement) => `Слишком длинное значение, ограничение символов — ${maxLength}`,
  };

  private readonly boundOnBlur: (event: Event) => void;
  private readonly boundOnFocus: (event: Event) => void;
  private readonly boundOnSubmit: (event: SubmitEvent) => void;

  constructor(bindEventsImmediately: boolean = true) {
    this.boundOnBlur = this.onBlur.bind(this);
    this.boundOnFocus = this.onFocus.bind(this);
    this.boundOnSubmit = this.onSubmit.bind(this);
    if (bindEventsImmediately) {
      this.bindEvents();
    }
  }

  validateField(
    fieldControlElement: HTMLInputElement | HTMLSelectElement,
    customValidator?: (value: string) => string | null
  ): string | null {
    const errors = fieldControlElement.validity;
    let errorMessage: string | null = null;

    for (const [errorType, getErrorMessage] of Object.entries(this.errorMessages)) {
      if (errors[errorType as keyof ValidityState]) {
        errorMessage = getErrorMessage(fieldControlElement as HTMLInputElement);
        break;
      }
    }

    if (!errorMessage && customValidator) {
      errorMessage = customValidator(fieldControlElement.value);
    }

    fieldControlElement.setAttribute('aria-invalid', String(!!errorMessage));

    return errorMessage;
  }

  validateForm(formElement: HTMLFormElement, fields: FormFieldConfig[]): Record<string, string | null> {
    const requiredControlElements = Array.from(formElement.elements).filter(
      (el): el is HTMLInputElement | HTMLSelectElement =>
        (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) && el.required
    );
    const errors: Record<string, string | null> = {};
    let firstInvalidFieldControl: HTMLInputElement | HTMLSelectElement | null = null;

    requiredControlElements.forEach((element) => {
      const fieldConfig = fields.find((f) => f.name === element.name) || this.findFieldInGroup(element.name, fields);
      const error = this.validateField(element, fieldConfig?.validator);
      errors[element.name] = error;
      if (error && !firstInvalidFieldControl) {
        firstInvalidFieldControl = element;
      }
    });

    if (firstInvalidFieldControl) {
      (firstInvalidFieldControl as HTMLInputElement).focus();
    }

    return errors;
  }

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

  onBlur(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const isFormField = target.closest(this.selectors.form);
    const isRequired = target.required;

    if (isFormField && isRequired) {
      this.validateField(target);
    }
  }

  onFocus(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const isFormField = target.closest(this.selectors.form);

    if (isFormField) {
      target.setAttribute('aria-invalid', 'false');
    }
  }

  onSubmit(event: SubmitEvent) {
    const formElement = event.target as HTMLElement;
    const isFormElement = formElement.matches(this.selectors.form);
    if (!isFormElement) {
      return;
    }

    const errors = this.validateForm(formElement as HTMLFormElement, []);
    const isValid = Object.values(errors).every((error) => error === null);
    if (!isValid) {
      event.preventDefault();
    }
  }

  bindEvents(formElement?: HTMLElement) {
    const target = formElement || document;
    target.addEventListener('blur', this.boundOnBlur, { capture: true });
    target.addEventListener('focus', this.boundOnFocus, { capture: true });

    target.addEventListener('submit', this.boundOnSubmit as EventListenerOrEventListenerObject);
  }

  destroy() {
    document.removeEventListener('blur', this.boundOnBlur, { capture: true });
    document.removeEventListener('focus', this.boundOnFocus, { capture: true });
    document.removeEventListener('submit', this.boundOnSubmit);
  }
}
