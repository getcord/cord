import { useMemo, useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { CopyButton } from 'external/src/entrypoints/admin/components/CopyButton.tsx';

const PREFIX = 'Sequelize: Executed (';

function doBind(param: any): string {
  if (typeof param === 'string') {
    return `'${param}'`;
  } else if (Array.isArray(param)) {
    return `'{ ${param
      .map((x) => doBind(x).replaceAll("'", '"'))
      .join(', ')} }'`;
  } else {
    throw new Error(`Unknown type: ${typeof param}`);
  }
}

function parseQuery(query: string, explain: boolean): string | null {
  if (query.length === 0) {
    return null;
  }
  const parsed = JSON.parse(query);
  if (
    !('message' in parsed) ||
    !('sequelize' in parsed) ||
    !parsed.message.startsWith(PREFIX)
  ) {
    throw new Error("Parsed JSON doesn't look like a sequelize log");
  }
  if (!('type' in parsed.sequelize) || parsed.sequelize.type !== 'SELECT') {
    throw new Error("Don't use this with non-SELECT queries");
  }

  const sql = parsed.message.substring(
    parsed.message.indexOf(':', PREFIX.length) + ': '.length,
  );
  const explainPrefix = explain
    ? 'EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS) '
    : '';

  if (parsed.sequelize.bind?.length > 0) {
    const id = `parsed_query${Math.floor(Math.random() * 1000000)}`;
    const bind = `( ${parsed.sequelize.bind.map(doBind).join(', ')} )`;
    return `PREPARE ${id} AS ${sql};\n${explainPrefix}EXECUTE ${id} ${bind};\n`;
  } else {
    return `${explainPrefix}${sql}`;
  }
}

export function ParseQuery() {
  const [query, setQuery] = useState('');
  const [explain, setExplain] = useState(false);

  const decoded = useMemo(() => {
    try {
      return parseQuery(query, explain);
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }, [query, explain]);

  return (
    <>
      <Form.Group style={{ width: 1200 }}>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Logged Query</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            as="textarea"
            required={true}
            value={query}
            rows={10}
            cols={200}
            autoFocus={true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQuery(e.target.value.trim());
            }}
          />
        </InputGroup>
      </Form.Group>
      <Form.Group>
        <Form.Check
          type="checkbox"
          label="EXPLAIN"
          checked={explain}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setExplain(e.target.checked)
          }
        />
      </Form.Group>
      {decoded && (
        <>
          <CopyButton value={decoded} />
          <pre
            style={{
              margin: 0,
              padding: 8,
              background: '#eee',
            }}
          >
            <code>{decoded}</code>
          </pre>
        </>
      )}
    </>
  );
}
