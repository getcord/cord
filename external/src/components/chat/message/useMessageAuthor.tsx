import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type {
  MessageFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

export function useMessageAuthor(message: MessageFragment): UserFragment {
  const { logError } = useLogger();
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  let author = userByID(message.source.id);
  if (!author) {
    logError('user-missing', { userID: message.source.id });
    author = {
      id: message.source.id,
      externalID: message.source.externalID,
      displayName: 'unknown',
      fullName: 'Unknown',
      name: 'Unknown',
      shortName: null,
      profilePictureURL: null,
      metadata: {},
    };
  }
  return author;
}
