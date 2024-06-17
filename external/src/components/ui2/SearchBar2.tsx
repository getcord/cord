import { createUseStyles } from 'react-jss';

import { cssVar } from 'common/ui/cssVariables.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  searchBar: {
    display: 'flex',
  },
  searchInput: {
    border: 'none',
    '&:focus': {
      outline: 'none',
    },
    background: cssVar('color-base-strong'),
    color: cssVar('color-content-primary'),
    marginLeft: cssVar('space-2xs'),
    width: '100%',
    filter: 'opacity(90%)',
  },
});

type Props = {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
};

/**
 * @deprecated Please use `ui3/SlackChannelsSearchBar` instead.
 */
export const SearchBar2 = ({
  searchTerm,
  setSearchTerm,
  placeholder,
}: Props) => {
  const classes = useStyles();

  return (
    <Row2
      padding="xs"
      marginBottom="2xs"
      borderRadius="medium"
      backgroundColor="base-strong"
      className={classes.searchBar}
    >
      <Icon2 name="MagnifyingGlass" size="large" color="content-secondary" />
      <input
        aria-label="search bar"
        role="search"
        className={classes.searchInput}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
      />
    </Row2>
  );
};
