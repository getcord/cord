import * as jwt from 'jsonwebtoken';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import { deprecatedFunction } from 'server/src/logging/deprecate.ts';
import type {
  Resolvers,
  ApplicationLinks,
  ApplicationEmailTemplate,
} from 'server/src/schema/resolverTypes.ts';

export const applicationResolver: Resolvers['Application'] = {
  customLinks: (application, _args, _context) => {
    return application.customLinks as ApplicationLinks;
  },

  customEmailTemplate: (application, _args, _context) => {
    return application.customEmailTemplate as ApplicationEmailTemplate;
  },

  customS3Bucket: async (application, _args, context) => {
    return await context.loaders.s3BucketLoader.loadForApplication(application);
  },

  supportBotInfo: async (application, _args, _context) => {
    if (!application.supportBotID) {
      return null;
    }
    const user = await UserEntity.findByPk(application.supportBotID);
    return user
      ? {
          name: userDisplayName(user),
          profilePictureURL: user.profilePictureURL,
        }
      : null;
  },

  deploymentInfo: async (application, _args, context) => {
    if (!context.session.isAdmin) {
      throw new Error('Admin only');
    }
    return application;
  },

  usageMetrics: (application, args, context) => {
    if (!context.session.isAdmin) {
      throw new Error('Admin only');
    }

    const { metrics, days } = args;

    return context.loaders.applicationUsageMetricLoader.loadUsageMetrics(
      application.id,
      metrics,
      days,
    );
  },

  serverAccessToken: (application, _args, _context) => {
    return jwt.sign({ app_id: application.id }, application.sharedSecret, {
      algorithm: 'HS512',
      expiresIn: '24 h',
    });
  },

  customerAccessToken: async (application, _args, _context) => {
    const customer = await CustomerEntity.findByPk(application.customerID);
    if (!customer) {
      throw new Error(`Customer not found`);
    }

    return jwt.sign({ customer_id: customer.id }, customer.sharedSecret, {
      algorithm: 'HS512',
      expiresIn: '24 h',
    });
  },

  setupInfo: async (application, _args, context) => {
    const [firstUser, firstOrg, isComponentInitialized] = await Promise.all([
      context.loaders.applicationLoader.getFirstUserInApplication(
        application.id,
      ),
      context.loaders.applicationLoader.getFirstOrgInApplication(
        application.id,
      ),
      context.loaders.applicationLoader.isComponentInitializedForApplication(
        application.id,
      ),
    ]);

    return {
      firstUser,
      firstOrg,
      isComponentInitialized,
    };
  },

  defaultProvider: deprecatedFunction(
    () => null,
    'graphql: application.defaultProvider',
  ),
};
