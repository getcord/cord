import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const customerIssueQueryResolver: Resolvers['Query']['customerIssue'] = (
  _,
  args,
  _context,
) =>
  AdminCRTCustomerIssueEntity.findOne({
    where: { id: args.id },
    rejectOnEmpty: true,
  });
