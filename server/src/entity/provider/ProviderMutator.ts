import UrlPattern from 'url-pattern';

import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ProviderEntity } from 'server/src/entity/provider/ProviderEntity.ts';

export class ProviderMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async createProvider(
    fields: Partial<ProviderEntity>,
  ): Promise<ProviderEntity> {
    validateDomainPatterns(fields.domains);
    return await ProviderEntity.create(fields);
  }

  async updateProvider(
    id: UUID,
    fields: Partial<ProviderEntity>,
  ): Promise<boolean> {
    validateDomainPatterns(fields.domains);
    const [updated] = await ProviderEntity.update(fields, { where: { id } });

    return updated === 1;
  }

  async delete(id: UUID): Promise<boolean> {
    const deleted = await ProviderEntity.destroy({
      where: { id },
    });

    return deleted === 1;
  }
}

function validateDomainPatterns(domainPatterns: string[] | undefined) {
  // This function will throw an exception if UrlPattern cannot parse any
  // of the domain patterns.

  if (domainPatterns) {
    for (const domainPattern of domainPatterns) {
      try {
        new UrlPattern(domainPattern);
      } catch (err) {
        throw new Error(`Invalid domain pattern: '${domainPattern}' (${err})`);
      }
    }
  }
}
