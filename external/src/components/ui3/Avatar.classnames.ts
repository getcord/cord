import { MODIFIERS } from 'common/ui/modifiers.ts';
import { cordifyClassname } from 'common/ui/style.ts';

export const avatarContainer = cordifyClassname('avatar-container');
export const avatarFallback = cordifyClassname('avatar-fallback');
export const avatarImage = cordifyClassname('avatar-image');

export const { present, notPresent, loading } = MODIFIERS;

export const avatarClassnamesDocs = {
  [avatarContainer]:
    'Applied to the container div. This class is always present.',
  [avatarFallback]:
    "Applied to the container div which is shown only when a user doesn't have a profile picture.",
  [avatarImage]: 'Applied to the img tag.',
  [MODIFIERS.notPresent]:
    'Applied to avatars of users that are not marked as present.',
  [MODIFIERS.present]:
    'Applied to avatars of users that are marked as present.',
  [MODIFIERS.loading]: 'Applied to avatars before profile pictures load.',
};
