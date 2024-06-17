import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export class ApplicationEntityExample {
  defaultFields = {
    name: 'testApplication',
    sharedSecret: 'abracadabra',
  };
  async create(fields: Partial<ApplicationEntity>): Promise<ApplicationEntity> {
    const customer = await CustomerEntity.create({ name: 'test' });
    return await ApplicationEntity.create({
      ...this.defaultFields,
      ...fields,
      customerID: customer.id,
    });
  }
}
