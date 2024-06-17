import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { Menu, MenuItem, Typography } from '@mui/material';
import { CircularProgress } from '@material-ui/core';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useApplicationsQuery } from 'external/src/entrypoints/console/graphql/operations.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

const useStyles = createUseStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gridTemplateAreas: '"icon text chevron"',
    columnGap: Sizes.MEDIUM,
    alignItems: 'center',
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    backgroundColor: Colors.GREY_X_LIGHT,
    padding: Sizes.MEDIUM,
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    marginBlockEnd: '4px',
    '&:focus': {
      outlineColor: Colors.PURPLE,
    },
    '&:hover, &$selected, &$selected:hover': {
      color: Colors.BRAND_PURPLE_DARK,
    },
  },
  appIconContainer: {
    height: '20px',
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    gridArea: 'icon',
  },
  appIcon: {
    maxHeight: '100%',
    width: 'auto',
    display: 'block',
  },
  chevron: {
    gridArea: 'chevron',
  },
  appName: {
    gridArea: 'text',
    textAlign: 'start',
  },
});

export function ApplicationSelector() {
  const classes = useStyles();
  const { application, id, setApplicationID } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );
  const [profilePictureError, setProfilePictureError] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const { data: applicationList, loading: applicationListLoading } =
    useApplicationsQuery();

  useEffect(() => {
    if (
      applicationList?.applications &&
      applicationList.applications.length > 0 &&
      !id
    ) {
      setApplicationID(applicationList.applications[0].application.id);
    }
  }, [applicationList, id, setApplicationID]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClickApplication = useCallback(
    (appID: string) => {
      setApplicationID(appID);
      navigate('/projects/' + appID);
      setProfilePictureError(false);
      handleClose();
    },
    [handleClose, navigate, setApplicationID],
  );

  return applicationListLoading || !applicationList ? (
    <button
      disabled
      type="button"
      aria-label="Select project"
      className={classes.container}
    >
      <Typography noWrap className={classes.appName}>
        <strong>Loading projects...</strong>
      </Typography>
      <CircularProgress className={classes.chevron} size={Sizes.LARGE} />
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Select project"
        className={classes.container}
      >
        {application?.iconURL && !profilePictureError && (
          <div className={classes.appIconContainer}>
            <img
              src={application?.iconURL}
              className={classes.appIcon}
              onError={() => {
                setProfilePictureError(true);
              }}
            />
          </div>
        )}
        <Typography noWrap className={classes.appName}>
          <strong>{application?.name}</strong>
        </Typography>
        <ChevronUpDownIcon height={Sizes.LARGE} className={classes.chevron} />
      </button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            style: {
              maxHeight: '200px',
              borderRadius: Sizes.SMALL,
              border: `1px solid ${Colors.GREY_LIGHT}`,
              boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
            },
          },
        }}
      >
        {applicationList.applications.map((appData) => (
          <MenuItem
            key={appData.application.id}
            onClick={() => handleClickApplication(appData.application.id)}
            sx={{
              margin: Sizes.MEDIUM / SPACING_BASE,
              borderRadius: Sizes.MEDIUM / SPACING_BASE,
            }}
          >
            {appData.application.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
