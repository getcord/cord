import { XMarkIcon } from '@heroicons/react/20/solid';
import { useCallback, useState } from 'react';
import { Button } from 'react-bootstrap';
import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';

export interface DescriptionLine {
  text: string;
  id: number;
}

const useStyles = createUseStyles({
  row: {
    flexGrow: 1,
    border: '1px solid #ced4da',
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: '8px 16px',
    color: '#495057',
    display: 'flex',
    gap: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  descriptionRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  textInput: {
    flexGrow: 1,
    padding: 8,
    border: '1px solid #ced4da',
    borderRadius: 4,
  },
});

export function PlanDescription({
  data,
  onChange,
}: {
  data: DescriptionLine[];
  onChange: (lines: DescriptionLine[]) => void;
}) {
  const classes = useStyles();

  return (
    <div className={cx([classes.row])}>
      {data.map((line) => {
        return (
          <PlanDescriptionLine
            key={`${line.id}`}
            line={line}
            onChange={onChange}
          />
        );
      })}
      <NewDescriptionLine onChange={onChange} />
    </div>
  );
}

function NewDescriptionLine({ onChange }: { onChange: (event: any) => void }) {
  const classes = useStyles();

  const [text, setText] = useState('');

  const onTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  const onAddClick = useCallback(
    (_e: any) => {
      if (text.length > 0) {
        onChange((oldValue: DescriptionLine[]) => {
          const newValue = [...oldValue];
          newValue.push({ text, id: oldValue.length });
          return newValue;
        });
        setText('');
      }
    },
    [onChange, text],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.keyCode === 13) {
        e.stopPropagation();
        e.preventDefault();
        onAddClick(e);
      }
    },
    [onAddClick],
  );

  return (
    <div className={classes.descriptionRow}>
      <input
        type="text"
        onChange={onTextChange}
        value={text}
        onKeyDown={onKeyDown}
        className={classes.textInput}
      />
      <Button onClick={onAddClick}>Add</Button>
    </div>
  );
}

function PlanDescriptionLine({
  line,
  onChange,
}: {
  line: DescriptionLine;
  onChange: (event: any) => void;
}) {
  const classes = useStyles();

  const onRemove = useCallback(() => {
    onChange((oldValue: DescriptionLine[]) => {
      const newValue = [...oldValue];
      return newValue.filter((item) => item.id !== line.id);
    });
  }, [line.id, onChange]);

  const onChangeText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange((oldValue: DescriptionLine[]) => {
        const newValue = [...oldValue];
        const idx = newValue.findIndex((item) => item.id === line.id);
        newValue[idx].text = e.target.value;
        return newValue;
      });
    },
    [line.id, onChange],
  );

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  }, []);

  return (
    <div className={classes.descriptionRow}>
      <input
        type="text"
        value={line.text}
        onChange={onChangeText}
        onKeyDown={onKeyDown}
        className={classes.textInput}
      />
      <XMarkIcon
        width={20}
        color={Colors.BLACK}
        onClick={onRemove}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
}
