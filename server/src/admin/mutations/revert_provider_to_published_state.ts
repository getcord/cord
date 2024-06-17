import { Transaction } from 'sequelize';

import { ProviderEntity } from 'server/src/entity/provider/ProviderEntity.ts';
import { ProviderRuleEntity } from 'server/src/entity/provider_rule/ProviderRuleEntity.ts';
import { ProviderDocumentMutatorEntity } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorEntity.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const revertProviderToPublishedStateMutationResolver: Resolvers['Mutation']['revertProviderToPublishedState'] =
  async (_, args, context) => {
    const { id } = args;

    const [provider, publishedProvider] = await Promise.all([
      ProviderEntity.findByPk(id),
      context.loaders.publishedProviderLoader.getRuleProvider(id),
    ]);

    if (!provider || !publishedProvider) {
      return { success: false, failureDetails: null };
    }

    await context.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (transaction) => {
        await provider.update(
          {
            name: publishedProvider.name,
            domains: publishedProvider.domains,
            iconURL: publishedProvider.iconURL,
            nuxText: publishedProvider.nuxText,
            mergeHashWithLocation: publishedProvider.mergeHashWithLocation,
            disableAnnotations: publishedProvider.disableAnnotations,
            visibleInDiscoverToolsSection:
              publishedProvider.visibleInDiscoverToolsSection,
          },
          { transaction },
        );

        await Promise.all([
          ProviderRuleEntity.destroy({
            where: { providerID: id },
            transaction,
          }),
          ProviderDocumentMutatorEntity.destroy({
            where: { providerID: id },
            transaction,
          }),
        ]);

        await Promise.all([
          ProviderRuleEntity.bulkCreate(
            publishedProvider.rules.map((rule, index) => ({
              id: rule.id,
              providerID: id,
              type: rule.type,
              order: index,
              matchPatterns: rule.matchPatterns,
              observeDOMMutations: rule.observeDOMMutations,
              nameTemplate: rule.nameTemplate,
              contextTransformation: rule.contextTransformation,
            })),
            { transaction },
          ),
          ProviderDocumentMutatorEntity.bulkCreate(
            publishedProvider.documentMutators.map((documentMutator) => ({
              id: documentMutator.id,
              providerID: id,
              type: documentMutator.type,
              config: documentMutator.config,
            })),
            { transaction },
          ),
        ]);

        await provider.update({ dirty: false }, { transaction });
      },
    );

    return { success: true, failureDetails: null };
  };
