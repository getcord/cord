/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';
import type {
  PropertiesList,
  Property,
} from 'docs/server/ui/propertiesList/types.ts';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import AnyOfItem from 'docs/server/ui/propertiesList/AnyOfItem.tsx';
import { PropertiesListHeader } from 'docs/server/ui/propertiesList/PropertiesListHeader.tsx';

type SinglePropertyProps = {
  name?: string;
  property: Property;
  isLast: boolean;
  required: boolean;
  showRequired?: boolean;
  level: number;
};

function typeAttribute(property: Property): string {
  const types = Array.isArray(property.type) ? property.type : [property.type];
  // Track whether we saw null, we always want it at the end
  let hasNull = false;
  const result = [];
  for (const type of types) {
    if (type === 'string') {
      if (property.enum) {
        result.push(...property.enum.map((enumVal) => JSON.stringify(enumVal)));
      } else if (property.format) {
        result.push(property.format);
      } else {
        result.push('string');
      }
    } else if (type === 'null') {
      hasNull = true;
    } else if (type === 'array' && property.items && 'type' in property.items) {
      if (Array.isArray(property.items.type)) {
        result.push(`(${typeAttribute(property.items)})[]`);
      } else {
        result.push(`${typeAttribute(property.items)}[]`);
      }
    } else {
      result.push(type);
    }
  }
  if (hasNull) {
    result.push('null');
  }
  return result.join(' | ');
}

export default function SingleProperty({
  name,
  property,
  isLast,
  required,
  showRequired = true,
  level,
}: SinglePropertyProps) {
  const [collapsed, setCollapsed] = React.useState(true);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  let nestedList = null;
  let description =
    property.description &&
    (typeof property.description === 'string' ? (
      <CordDocsMarkdown value={property.description} />
    ) : (
      property.description
    ));

  if (
    property.items &&
    'properties' in property.items &&
    property.items.properties
  ) {
    description = (
      <>
        {description}
        <p>
          This is an array of objects, each of which has the following fields:
        </p>
      </>
    );
    nestedList = (
      <div>
        <CollapseToggle onToggle={toggleCollapsed} collapsed={collapsed} />
        {collapsed ? null : (
          <SimplePropertiesList
            nested
            showRequired={showRequired}
            properties={{
              properties: property.items.properties,
              propertyOrder:
                property.items.propertyOrder ||
                Object.keys(property.items.properties),
              required: property.items.required,
            }}
            level={level + 1}
          />
        )}
      </div>
    );
  } else if (property.items && 'anyOf' in property.items) {
    description = (
      <>
        {description}
        <p>This is an array of items. Each item can be one of the following:</p>
      </>
    );

    // We use SingleProperty here, instead of a nested SimplePropertiesList,
    // because that is too much nesting -- we are already inside a property list
    // inside an anyOf list of options, that's enough. (At least without some
    // better way of displaying all of this, ideally arbitrary nesting.)
    const anyOf = property.items.anyOf;
    nestedList = (
      <ul>
        {anyOf.map((subProp, idx) => (
          <AnyOfItem isLast={idx === anyOf.length - 1} key={idx}>
            <SingleProperty
              property={subProp}
              required={false}
              // This is the anyOf objects, so they're neither required or
              // optional, they're a set of options.  So don't show
              // required/optional.
              showRequired={false}
              isLast={false}
              level={level + 1}
            />
          </AnyOfItem>
        ))}
      </ul>
    );
  }
  // we ignore if the property itself is nested so we can extract all the
  // nested/deeply-nested properties
  else if ('properties' in property && 'propertyOrder' in property) {
    description = (
      <>
        {description}
        <p>This is an object with the following fields:</p>
      </>
    );
    nestedList = (
      <div>
        <CollapseToggle onToggle={toggleCollapsed} collapsed={collapsed} />
        {collapsed ? null : (
          <SimplePropertiesList
            nested
            showRequired={showRequired}
            properties={property as PropertiesList}
            level={level + 1}
          />
        )}
      </div>
    );
  }

  const attributes = [typeAttribute(property)];
  if (showRequired) {
    attributes.unshift(required ? 'required' : 'optional');
  }

  return (
    <React.Fragment>
      <PropertiesListHeader
        name={name ?? ''}
        attributes={attributes}
        level={level}
      />
      <div style={isLast ? { paddingBottom: 0 } : undefined}>
        {description}
        {nestedList}
      </div>
    </React.Fragment>
  );
}

function CollapseToggle({
  onToggle,
  collapsed,
}: {
  onToggle: () => void;
  collapsed: boolean;
}) {
  return (
    <div onClick={onToggle}>
      <p
        css={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 4,
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {collapsed ? (
          <>
            <ChevronDownIcon width={20} />
            Show property details
          </>
        ) : (
          <>
            <ChevronUpIcon width={20} />
            Hide property details
          </>
        )}
      </p>
    </div>
  );
}
