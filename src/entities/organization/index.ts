import BaseComponent from '@entities/base-component';
import type { VNode } from '@entities/core/vdom/vnode.ts';
import type { IOrganization } from '@entities/organization/model';
import { orgStore } from '@entities/organization/model/organization.store.ts';
import OrganizationModal from '@entities/organization-modal';
import OrganizationTable from '@entities/organization-table';
import type { IOrganizationTableProps } from '@entities/organization-table/model';
import { generateId } from '@shared/lib/utils';

interface IOrganizationProps {}
interface IOrganizationState {
  isOpen: boolean;
  isMounted: boolean;
}

export class Organization extends BaseComponent<IOrganizationProps, IOrganizationState> {
  constructor(props: {}) {
    super(props);
  }

  protected getInitialState(): IOrganizationState {
    return { isOpen: false, isMounted: true };
  }

  private onAdd = () => {
    this.setState({ isOpen: true });
    orgStore.setItem({} as IOrganization);
  };

  private onRowChange = (row: IOrganization) => {
    this.setState({ isOpen: true });
    orgStore.setItem(row);
  };

  private onSubmit = (data: IOrganization) => {
    const id = orgStore.getState().current.id;
    if (!id) {
      orgStore.addItem({ ...data, id: generateId() });
    } else {
      orgStore.updateItem(id, { ...data, id: id });
    }
  };

  private onClose = () => {
    this.setState({ isOpen: false });
  };

  protected shouldComponentUpdate(_nextProps: {}, nextState: IOrganizationState): boolean {
    const shouldUpdate = this.state.isOpen !== nextState.isOpen || this.state.isMounted !== nextState.isMounted;
    return shouldUpdate;
  }

  render(state: IOrganizationState, _props: IOrganizationProps) {
    const children: VNode<IOrganizationTableProps | {}>[] = [
      this.h(OrganizationTable, {
        onAdd: this.onAdd,
        onRowChange: this.onRowChange,
        key: 'org-table',
      }) 
    ];

    if (state.isMounted) {
      children.push(
        this.h(OrganizationModal, {
          isOpen: state.isOpen,
          onSubmit: this.onSubmit,
          onClose: this.onClose,
          key: 'org-modal',
        }) 
      );
    }

    return this.h(
      'div',
      {
        class: 'app',
        key: 'organization',
      },
      ...children
    ) 
  }
}
