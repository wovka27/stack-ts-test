import BaseComponent from '@entities/base-component';
import { Organization } from '@entities/organization';

export default class App extends BaseComponent<{}, {}> {
  render(_state: {}, _props: {}) {
    return this.h(Organization, {});
  }
}
