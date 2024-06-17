import { v4 as uuidv4 } from 'uuid';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export class CustomerEntityExample {
  defaultFields = {
    id: uuidv4(),
    name: 'testCustomer',
  };

  async create(fields: Partial<CustomerEntity>): Promise<CustomerEntity> {
    return await CustomerEntity.create({ ...this.defaultFields, ...fields });
  }
}
