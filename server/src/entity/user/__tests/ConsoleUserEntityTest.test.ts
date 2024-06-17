import { Viewer } from 'server/src/auth/index.ts';
import 'server/src/tests/setupEnvironment';
import { ConsoleUserEntityExample } from 'server/src/entity/user/__tests/ConsoleUserEntityExample.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { ConsoleUserLoader } from 'server/src/entity/user/ConsoleUserLoader.ts';
import { CustomerEntityExample } from 'server/src/entity/customer/tests/CustomerEntityExample.ts';

const viewer = Viewer.createServiceViewer();

describe('Console User tests', () => {
  test('can manage customer access', async () => {
    const customer = await new CustomerEntityExample().create({});
    let consoleUser = await new ConsoleUserEntityExample().create({});
    expect(consoleUser).not.toBeNull();
    expect(consoleUser.customerID).toBeNull();
    expect(consoleUser.pendingCustomerID).toBeNull();

    const mutator = new ConsoleUserMutator(viewer);

    await mutator.grantCustomerAccess(consoleUser, customer.id);
    consoleUser = await consoleUser.reload();
    expect(consoleUser).not.toBeNull();
    expect(consoleUser.customerID).toBe(customer.id);

    await mutator.removeCustomerAccess(consoleUser, customer.id);
    consoleUser = await consoleUser.reload();
    expect(consoleUser).not.toBeNull();
    expect(consoleUser.customerID).toBeNull();
  });

  test('can create user', async () => {
    const loader = new ConsoleUserLoader(viewer);
    const mutator = new ConsoleUserMutator(viewer, loader);

    const user = await mutator.upsertUser({
      email: 'alan@example.com',
      name: 'Alan',
    });
    expect(user).not.toBeNull();
    expect(user.name).toEqual('Alan');

    const updatedUser = await mutator.upsertUser({
      email: user.email,
      name: 'Steve',
    });
    expect(updatedUser).not.toBeNull();
    expect(updatedUser.name).toEqual('Steve');
  });
});
