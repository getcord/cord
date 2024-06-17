import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import * as classes from 'external/src/components/ui3/SlackChannelsSearchBar.css.ts';

type Props = {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
};
export function SlackChannelsSearchBar({
  searchTerm,
  setSearchTerm,
  placeholder,
}: Props) {
  return (
    <div className={classes.slackChannelsSearchBar}>
      <Icon
        name="MagnifyingGlass"
        size="large"
        color="content-secondary"
        className={classes.slackChannelsSearchBarIcon}
      />
      <input
        aria-label="search bar"
        role="search"
        className={classes.slackChannelsSearchBarInput}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
