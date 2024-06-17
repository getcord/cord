import { QueryTypes } from 'sequelize';

import type { Viewer } from 'server/src/auth/index.ts';
import { assertServiceViewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

interface TwoImageVariantInformation {
  filename: string;
  sourceSha384: string;
  sourceAgeSeconds: number;
  overlaySha384: string;
  overlayAgeSeconds: number;
}

interface SingleImageVariantInformation {
  filename: string;
  sourceSha384: string;
  sourceAgeSeconds: number;
}

export class ImageVariantLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async getTwoImageCompositionVariant(
    sourceURL: string,
    overlayURL: string,
    variantPrefix: string,
  ) {
    assertServiceViewer(this.viewer);

    const rows = await getSequelize().query<TwoImageVariantInformation>(
      `SELECT
         iv.filename,
         iv."sourceSha384",
         EXTRACT(EPOCH FROM NOW()-src."downloadTimestamp") AS "sourceAgeSeconds",
         overlay."sha384" AS "overlaySha384",
         EXTRACT(EPOCH FROM NOW()-overlay."downloadTimestamp") AS "overlayAgeSeconds"
       FROM image_variants iv
       INNER JOIN external_assets src ON iv."sourceSha384"=src."sha384"
       INNER JOIN external_assets overlay
         ON iv."variant"=($1::text || overlay."sha384")
       WHERE src.url=$2 AND overlay.url=$3;`,
      {
        type: QueryTypes.SELECT,
        bind: [variantPrefix, sourceURL, overlayURL],
      },
    );

    if (rows.length > 0) {
      return rows[0];
    }
    return null;
  }

  async getSingleImageVariant(sourceURL: string, variant: string) {
    assertServiceViewer(this.viewer);

    const rows = await getSequelize().query<SingleImageVariantInformation>(
      `SELECT
         iv.filename,
         iv."sourceSha384",
         EXTRACT(EPOCH FROM NOW()-src."downloadTimestamp") AS "sourceAgeSeconds"
       FROM image_variants iv
       INNER JOIN external_assets src ON iv."sourceSha384"=src."sha384"
       WHERE iv.variant=$1
       AND src.url=$2;`,
      {
        type: QueryTypes.SELECT,
        bind: [variant, sourceURL],
      },
    );

    if (rows.length > 0) {
      return rows[0];
    }
    return null;
  }
}
