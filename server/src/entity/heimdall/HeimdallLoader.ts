import type { Viewer } from 'server/src/auth/index.ts';
import { HeimdallEntity } from 'server/src/entity/heimdall/HeimdallEntity.ts';
import env from 'server/src/config/Env.ts';

export class HeimdallLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    // TODO: Add caching.
  }

  async load(key: string) {
    return await HeimdallEntity.findOne({
      where: { key, tier: env.CORD_TIER },
    });
  }

  async loadAll() {
    return await HeimdallEntity.findAll({ where: { tier: env.CORD_TIER } });
  }
}
