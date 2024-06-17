import { RADICAL_TEST_ORG_ID } from 'common/const/Ids.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { HeimdallLoader } from 'server/src/entity/heimdall/HeimdallLoader.ts';
import { HeimdallMutator } from 'server/src/entity/heimdall/HeimdallMutator.ts';
import 'server/src/tests/setupEnvironment';

const viewer = Viewer.createOrgViewer(RADICAL_TEST_ORG_ID);

describe('check creations and update.', () => {
  test('Check creation of Heimdall on-off switch works', async () => {
    const loader = new HeimdallLoader(viewer);
    const mutator = new HeimdallMutator(viewer, loader);
    const name = 'flip-this-switch';

    const created = await mutator.createOnOffSwitch(name);
    expect(created.key).toEqual(name);
    expect(created.isOn()).toEqual(false);

    const createAgain = await mutator.createOnOffSwitch(name);
    expect(createAgain.key).toEqual(name);
    expect(createAgain.isOn()).toEqual(false);

    await mutator.changeOnOffSwitchState(name, true);

    const modified = await loader.load(name);
    expect(modified).not.toBeNull();
    expect(modified!.key).toEqual(name);
    expect(modified!.isOn()).toEqual(true);

    const createAgainTwo = await mutator.createOnOffSwitch(name);
    expect(createAgainTwo.key).toEqual(name);
    expect(createAgainTwo.isOn()).toEqual(true);

    const createNew = await mutator.createOnOffSwitch('another-switch');
    expect(createNew.key).toEqual('another-switch');
    expect(createNew.isOn()).toEqual(false);
  });
});
