import { v4 as uuidv4 } from 'uuid';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';

export class ConsoleUserEntityExample {
  defaultFields = {
    name: 'Test User',
  };

  async create(fields: Partial<ConsoleUserEntity>): Promise<ConsoleUserEntity> {
    const uuid = uuidv4();
    return await ConsoleUserEntity.create({
      email: uuid + '@cord.com',
      ...this.defaultFields,
      ...fields,
    });
  }
}
