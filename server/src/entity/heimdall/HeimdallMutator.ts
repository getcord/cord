import type { Viewer } from 'server/src/auth/index.ts';
import { HeimdallEntity } from 'server/src/entity/heimdall/HeimdallEntity.ts';
import { HeimdallLoader } from 'server/src/entity/heimdall/HeimdallLoader.ts';
import env from 'server/src/config/Env.ts';

export class HeimdallMutator {
  viewer: Viewer;
  loader: HeimdallLoader;

  constructor(viewer: Viewer, loader?: HeimdallLoader) {
    this.viewer = viewer;
    this.loader = loader ?? new HeimdallLoader(this.viewer);
  }

  async createOnOffSwitch(name: string): Promise<HeimdallEntity> {
    const [entity, _exists] = await HeimdallEntity.findOrCreate({
      where: { key: name, tier: env.CORD_TIER },
      defaults: { value: false },
    });
    return entity;
  }

  async changeOnOffSwitchState(key: string, on: boolean): Promise<boolean> {
    const [updated] = await HeimdallEntity.update(
      { value: on },
      { where: { key, tier: env.CORD_TIER } },
    );

    return updated === 1;
  }
}
