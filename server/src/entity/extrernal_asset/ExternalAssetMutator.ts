import type { Viewer } from 'server/src/auth/index.ts';
import { assertServiceViewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export class ExternalAssetMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async update(url: string, sha384: string) {
    assertServiceViewer(this.viewer);

    await getSequelize().query(
      `INSERT INTO external_assets ("url", "sha384") VALUES ($1,$2)
       ON CONFLICT ("url") DO UPDATE
       SET "sha384"=EXCLUDED."sha384", "downloadTimestamp"=DEFAULT;`,
      { bind: [url, sha384] },
    );
  }
}
