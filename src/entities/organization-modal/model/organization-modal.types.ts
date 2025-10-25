import type { DialogProps, DialogState } from '@entities/base-modal/model';
import type { IOrganization } from '@entities/organization/model';
import type IOrganizationModal from '@entities/organization-modal';

export interface IOrganizationModalProps extends DialogProps {
  isOpen: boolean;
  onSubmit: (data: IOrganization) => void;
  ref?: (c: IOrganizationModal) => void;
  onClose?: () => void;
}
export interface IOrganizationModalState extends DialogState {
  isOpen: boolean;
  data: IOrganization;
}
