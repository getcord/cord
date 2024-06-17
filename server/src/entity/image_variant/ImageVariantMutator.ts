import type { Viewer } from 'server/src/auth/index.ts';
import { assertServiceViewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export class ImageVariantMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async saveImageVariant(
    sourceSha384: string,
    variant: string,
    outputFilename: string,
  ) {
    assertServiceViewer(this.viewer);

    await getSequelize().query(
      `INSERT INTO image_variants ("sourceSha384", "variant", "filename")
       VALUES ($1,$2,$3)
       ON CONFLICT ("sourceSha384", "variant")
       DO UPDATE SET "filename"=EXCLUDED."filename", "timestamp"=DEFAULT;`,
      { bind: [sourceSha384, variant, outputFilename] },
    );
  }
}
