import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { ProviderDocumentMutatorEntity } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorEntity.ts';

export class ProviderDocumentMutatorLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadForProvider(id: UUID) {
    const documentMutators = await ProviderDocumentMutatorEntity.findAll({
      where: { providerID: id },
    });
    documentMutators.forEach((dm) => dm.populateDefaultCSS());
    return documentMutators;
  }
}
