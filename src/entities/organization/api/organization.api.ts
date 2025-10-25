import type { IOrganization } from '@entities/organization/model';
import { storage } from '@shared/lib/utils';

const STORAGE_KEY = 'organization';

export const storageApi = {
  get: () => storage.get<IOrganization[]>(STORAGE_KEY),
  set: (value: IOrganization[]) => storage.set(STORAGE_KEY, value),
  remove: () => storage.remove(STORAGE_KEY),
};
