import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ProviderDocumentMutatorEntity } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorEntity.ts';

export class ProviderDocumentMutatorMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async create(
    fields: Partial<ProviderDocumentMutatorEntity>,
  ): Promise<ProviderDocumentMutatorEntity> {
    return await ProviderDocumentMutatorEntity.create(fields);
  }

  async update(
    id: UUID,
    fields: Partial<ProviderDocumentMutatorEntity>,
  ): Promise<boolean> {
    const [updated] = await ProviderDocumentMutatorEntity.update(fields, {
      where: { id },
    });

    return updated === 1;
  }

  async delete(id: UUID): Promise<boolean> {
    const deleted = await ProviderDocumentMutatorEntity.destroy({
      where: { id },
    });

    return deleted === 1;
  }
}
