import { Form } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import { CustomInputGroup } from 'external/src/entrypoints/console/components/Filter/CustomInputGroup.tsx';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  wrapper: {
    display: 'flex',
    justifyItems: 'space-between',
    gap: Sizes.DEFAULT_PADDING_PX,
    margin: `${Sizes.XLARGE}px 0`,
  },
  customInput: {
    //TODO: change this to be more flexible once we add more filters
    width: '378px',
  },
});

type FlterByProps = {
  metadata: boolean;
  location: boolean;
};

export function Filter({
  filterBy,
  location,
  setLocation,
  metadata,
  setMetadata,
}: {
  filterBy: FlterByProps;
  location: string;
  setLocation: (location: string) => void;
  metadata: string;
  setMetadata: (obj: string) => void;
}) {
  const classes = useStyles();

  const { location: filterByLocation, metadata: filterByMetadata } = filterBy;

  return (
    <Form>
      <Form.Group className={classes.wrapper}>
        {filterByLocation && (
          <CustomInputGroup
            label={'Location'}
            id={'location'}
            value={location}
            placeholder={JSON.stringify({ page: 'location' })}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocation(e.target.value || '')
            }
            className={classes.customInput}
          />
        )}
        {filterByMetadata && (
          <CustomInputGroup
            label={'Metadata'}
            id={'metadata'}
            value={metadata}
            placeholder={JSON.stringify({ data: 1 })}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMetadata(e.target.value || '')
            }
            className={classes.customInput}
          />
        )}
      </Form.Group>
    </Form>
  );
}
