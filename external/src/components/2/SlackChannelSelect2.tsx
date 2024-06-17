import { useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';

import { SearchBar2 } from 'external/src/components/ui2/SearchBar2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useSlackChannels } from 'external/src/effects/useSlackChannels.ts';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  scrollable: {
    overflow: 'auto',
    flex: 1,
    paddingBottom: cssVar('space-3xs'),
  },
});

type Props = {
  className?: string;
  onClickChannel: (...args: any[]) => unknown;
};

/**
 * @deprecated Please use `ui3/SlackChannelsList` instead.
 */
export const SlackChannelSelect2 = ({ onClickChannel }: Props) => {
  const { t } = useCordTranslation('thread');
  const classes = useStyles();

  const [searchTerm, setSearchTerm] = useState('');

  const { joinedSlackChannels, joinableSlackChannels } = useSlackChannels();
  const { filteredJoinedSlackChannels, filteredJoinableSlackChannels } =
    useMemo(() => {
      if (searchTerm) {
        const myRegex = new RegExp(searchTerm, 'i');
        return {
          filteredJoinedSlackChannels: joinedSlackChannels.filter((channel) =>
            myRegex.test(channel.name),
          ),
          filteredJoinableSlackChannels: joinableSlackChannels.filter(
            (channel) => myRegex.test(channel.name),
          ),
        };
      } else {
        return {
          filteredJoinedSlackChannels: joinedSlackChannels,
          filteredJoinableSlackChannels: joinableSlackChannels,
        };
      }
    }, [joinableSlackChannels, joinedSlackChannels, searchTerm]);

  const noChannelsFound =
    filteredJoinedSlackChannels.length === 0 &&
    filteredJoinableSlackChannels.length === 0;

  return (
    <Box2 className={classes.container}>
      <SearchBar2
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder={t('share_via_slack_channel_placeholder')}
      />
      <Box2 className={classes.scrollable}>
        {filteredJoinedSlackChannels.map((channel) => (
          <MenuItem2
            key={channel.slackID}
            leftItem={<Icon2 name={'Hash'} />}
            label={channel.name}
            onClick={() => onClickChannel(channel, true)}
          />
        ))}

        {filteredJoinedSlackChannels.length > 0 &&
          filteredJoinableSlackChannels.length > 0 && <Separator2 />}

        {filteredJoinableSlackChannels.map((channel) => (
          <MenuItem2
            key={channel.slackID}
            leftItem={<Icon2 name={'Hash'} />}
            label={channel.name}
            labelColorOverride={'content-secondary'}
            onClick={() => onClickChannel(channel, false)}
          />
        ))}

        {noChannelsFound && (
          <Text2 paddingVertical="xl" color="content-secondary" center={true}>
            {t('share_via_slack_no_channels')}
          </Text2>
        )}
      </Box2>
    </Box2>
  );
};
