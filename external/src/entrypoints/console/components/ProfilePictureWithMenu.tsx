import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
} from '@material-ui/core';
import { createUseStyles } from 'react-jss';
import { useAuth0 } from '@auth0/auth0-react';

import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';

const useStyles = createUseStyles({
  profileIcon: {
    height: Sizes.XXLARGE,
    width: Sizes.XXLARGE,
  },
  profileMenu: {
    color: Colors.GREY_DARK,
    backgroundColor: Colors.WHITE,
  },
});

type Props = {
  name?: string;
  email?: string;
  pictureURL?: string;
};

export function ProfilePictureWithMenu({ name, email, pictureURL }: Props) {
  const classes = useStyles();
  const [menuAnchorElement, setMenuAnchorElement] =
    useState<HTMLElement | null>(null);

  const { logout } = useAuth0();

  return (
    <>
      <IconButton
        disableFocusRipple
        disableRipple
        size={'small'}
        onClick={(e) => setMenuAnchorElement(e.currentTarget)}
      >
        <Avatar alt={name} src={pictureURL} className={classes.profileIcon} />
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={menuAnchorElement}
        keepMounted
        open={!!menuAnchorElement}
        onClose={() => setMenuAnchorElement(null)}
        classes={{ paper: classes.profileMenu }}
      >
        {(name || email) && (
          <ListItem>
            <ListItemText
              primary={name ?? email}
              secondary={name ? email : undefined}
            />
          </ListItem>
        )}
        {(name || email) && <Divider style={{ marginBottom: '8px' }} />}
        <MenuItem
          onClick={() => logout({ returnTo: `${CONSOLE_ORIGIN}/login` })}
        >
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
