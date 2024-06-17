import { Button, ListItemText, Menu, MenuItem, TableCell } from '@mui/material';
import { useCallback, useState } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';

interface Option {
  text: string;
  callback: () => void;
}

export function MoreCell({ options }: { options: Option[] }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <TableCell sx={{ textWrap: 'nowrap' }}>
      <Button
        variant="contained"
        color="secondary"
        sx={{ boxShadow: 'none', minWidth: '0', padding: '10px' }}
        onClick={handleClick}
      >
        <EllipsisHorizontalIcon style={{ height: 20 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem>
          {options.map(({ text, callback }) => (
            <ListItemText
              key={text}
              onClick={() => {
                callback();
                handleClose();
              }}
            >
              {text}
            </ListItemText>
          ))}
        </MenuItem>
      </Menu>
    </TableCell>
  );
}
