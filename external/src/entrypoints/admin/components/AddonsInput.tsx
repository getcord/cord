import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { ADDONS } from 'common/const/Billing.ts';
import type { AddonInput } from 'external/src/entrypoints/admin/graphql/operations.ts';

const useStyles = createUseStyles({
  freeFormRow: {
    flexGrow: 1,
    border: '1px solid #ced4da',
    borderRadius: '8',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: '8px 16px',
    color: '#495057',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  addonsBox: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  addonsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});

export function AddonsInput({
  data,
  onChange,
}: {
  data: AddonInput[];
  onChange: (addons: AddonInput[]) => void;
}) {
  const classes = useStyles();

  const existingAddons = data.map((addon) => addon.key);
  const missingAddons = ADDONS.filter(
    (addon) => !existingAddons.includes(addon.name),
  ).map((addon) => addon.name);

  return (
    <div className={cx([classes.freeFormRow, classes.addonsBox])}>
      {data.map((addon, i) => {
        return (
          <AddonRow
            key={`${addon.key}`}
            addon={addon.key}
            value={addon.value}
            onChange={(e) => {
              const newAddons = [...data];
              newAddons[i].value = e.target.checked;
              onChange(newAddons);
            }}
          />
        );
      })}
      {missingAddons.map((addon) => (
        <AddonRow
          key={`${addon}`}
          addon={addon}
          value={false}
          onChange={(e) => {
            const newAddons = [...data];
            newAddons.push({
              key: addon,
              value: e.target.checked,
            });

            onChange(newAddons);
          }}
        />
      ))}
    </div>
  );
}

function AddonRow({
  addon,
  value,
  onChange,
}: {
  addon: string;
  value: boolean;
  onChange: (event: any) => void;
}) {
  const classes = useStyles();

  return (
    <div className={classes.addonsRow}>
      <input
        type="checkbox"
        checked={value}
        value={addon}
        id={addon}
        onChange={onChange}
      />
      <label htmlFor={addon} style={{ marginBottom: 0 }}>
        {addon}
      </label>
    </div>
  );
}
