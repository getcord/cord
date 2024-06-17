import { useMemo, useState } from 'react';
import { useCordTranslation } from '@cord-sdk/react';

import * as classes from 'external/src/components/ui3/SlackChannelsList.css.ts';
import { MenuItem } from 'external/src/components/ui3/MenuItem.tsx';
import { Separator } from 'external/src/components/ui3/Separator.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { SlackChannelsSearchBar } from 'external/src/components/ui3/SlackChannelsSearchBar.tsx';
import { useSlackChannels } from 'external/src/effects/useSlackChannels.ts';

type Props = {
  onClickChannel: (...args: any[]) => unknown;
};

export function SlackChannelsList({ onClickChannel }: Props) {
  const { t } = useCordTranslation('thread');

  const [searchTerm, setSearchTerm] = useState('');
  const { joinableSlackChannels, joinedSlackChannels } = useSlackChannels();

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
    <>
      <SlackChannelsSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder={t('share_via_slack_channel_placeholder')}
      />
      <div className={classes.slackChannelsContainer}>
        {filteredJoinedSlackChannels.map((channel) => (
          <MenuItem
            key={channel.slackID}
            menuItemAction={`thread-share-to-slack-channel-joined-${channel.name}`}
            leftItem={<Icon name="Hash" />}
            label={channel.name}
            onClick={() => onClickChannel(channel, true)}
          />
        ))}

        {filteredJoinedSlackChannels.length > 0 &&
          filteredJoinableSlackChannels.length > 0 && <Separator />}

        {filteredJoinableSlackChannels.map((channel) => (
          <MenuItem
            key={channel.slackID}
            menuItemAction={`thread-share-to-slack-channel-${channel.name}`}
            leftItem={<Icon name="Hash" />}
            label={channel.name}
            labelColorOverride={'content-secondary'}
            onClick={() => onClickChannel(channel, false)}
          />
        ))}

        {noChannelsFound && (
          <p className={classes.noChannelsText}>
            {t('share_via_slack_no_channels')}
          </p>
        )}
      </div>
    </>
  );
}
