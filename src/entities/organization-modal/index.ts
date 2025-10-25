import { Modal } from '@entities/base-modal';
import { FormGenerator } from '@entities/form-generator';
import type { IOrganization } from '@entities/organization/model';
import { orgStore } from '@entities/organization/model/organization.store.ts';
import { fields } from '@entities/organization-modal/config/fields';
import type { IOrganizationModalProps, IOrganizationModalState } from '@entities/organization-modal/model';
import type { Subscriber } from '@shared/lib/store/model';
import Button from '@shared/ui/button';

export default class OrganizationModal
  extends Modal<IOrganizationModalProps, IOrganizationModalState>
  implements Subscriber
{
  private unsubscribe: (() => void) | null = null;

  constructor(props: IOrganizationModalProps) {
    super(props);
  }

  get data() {
    return orgStore.getState().current;
  }

  private onSubmit = (data: IOrganization) => {
    if (this.props.onSubmit) {
      this.props.onSubmit(data);
    }
    this.close();
    if (this.props.onClose) {
      this.props.onClose();
    }
    orgStore.setItem({} as IOrganization);
  };

  protected resetForm = (): void => {
    orgStore.setItem({} as IOrganization);
  };

  private onChange = (data: IOrganization) => {
    this.setState({ data });
  };

  componentDidMount() {
    this.subscribeToStore(orgStore);
    super.componentDidMount();
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  shouldComponentUpdate(nextProps: IOrganizationModalProps, _nextState: IOrganizationModalState): boolean {
    const shouldUpdate = this.props.isOpen !== nextProps.isOpen;
    return shouldUpdate;
  }

  render(state: IOrganizationModalState, props: IOrganizationModalProps) {
    const { isOpen, onOpen, onClose, onSubmit } = props;

    const slots = {
      header: [
        this.h(
          'h2',
          { key: 'base-modal__title', class: 'base-modal__title' },
          this.data?.id ? 'Редактировать организацию' : 'Добавить организацию'
        ),
      ],
      body: [
        this.h(FormGenerator<IOrganization>, {
          fields,
          method: 'dialog',
          form: this.data,
          formId: 'organization-modal',
          onChange: this.onChange,
          onSubmit: this.onSubmit,
          key: 'form',
        }),
      ],
      footer: [
        this.h(Button, {
          text: 'Отмена',
          variant: 'outline',
          onClick: () => {
            this.resetForm();
            this.close();
          },
          key: 'reset-button',
        }),
        this.h(Button, {
          text: 'Сохранить',
          variant: 'primary',
          form: 'organization-modal',
          type: 'submit',
          key: 'submit-button',
        }),
      ],
    };

    return super.render(state, { slots, isOpen, onOpen, onClose, onSubmit });
  }
}
