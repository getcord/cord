/** @jsxImportSource @emotion/react */
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import WithTooltip from 'docs/server/ui/tooltip/WithTooltip.tsx';

export function CommunityHeaderLink() {
  return (
    <a
      href="https://community.cord.com"
      css={{
        alignItems: 'center',
        display: 'flex',
        flexShrink: 0,
        fontSize: 14,
        textDecoration: 'none',
        color: 'var(--color-contentSecondary)',
      }}
    >
      <WithTooltip label="Not finding the answer you need? Ask our Developer Community!">
        <span css={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <QuestionMarkCircleIcon height={16} width={16} /> Ask the Community
        </span>
      </WithTooltip>
    </a>
  );
}
