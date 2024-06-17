/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { Fragment } from 'react';
import HR from 'docs/server/ui/hr/HR.tsx';
import SingleProperty from 'docs/server/ui/propertiesList/SingleProperty.tsx';
import type {
  PropertiesList,
  Property,
} from 'docs/server/ui/propertiesList/types.ts';
import AnyOfItem from 'docs/server/ui/propertiesList/AnyOfItem.tsx';
import { collapseList } from 'docs/server/ui/propertiesList/util.ts';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';
import { PropertiesListHeader } from 'docs/server/ui/propertiesList/PropertiesListHeader.tsx';

/**
 * A PropertiesList but much simpler, without the language switching stuff etc.
 */
export default function SimplePropertiesList({
  properties,
  nested,
  showRequired = true,
  level = 4,
}: {
  properties: PropertiesList;
  nested?: boolean;
  showRequired?: boolean;
  level?: number;
}) {
  return (
    <section style={nested ? { marginLeft: '40px' } : undefined}>
      {properties.propertyOrder.length === 0 ? (
        <strong>None</strong>
      ) : (
        properties.propertyOrder.map((propName) => {
          const property = properties.properties[propName];
          if (!property) {
            throw new Error(
              `SimplePropertiesList error: ${propName} is present in propertyOrder but not properties`,
            );
          }
          let propList: readonly Property[];
          if ('anyOf' in property) {
            propList = property.anyOf;
          } else if ('$ref' in property) {
            if (!property['$ref'].startsWith('#/definitions/')) {
              throw new Error(
                `SimplePropertiesList error: ${propName} is a non-local ref, which is unsupported`,
              );
            }
            const ref = property['$ref'].substring('#/definitions/'.length);
            const definition = properties.definitions?.[ref];
            if (definition) {
              propList = [{ ...definition, description: property.description }];
            } else if (ref === 'ID') {
              // This definition is a top-level definition, but we know what it is
              propList = [
                {
                  type: 'string',
                  description: property.description,
                },
              ];
            } else {
              throw new Error(
                `SimplePropertiesList error: ${propName} refers to a non-existent definition ${ref}`,
              );
            }
          } else {
            propList = [property];
          }
          propList = collapseList(propList, property);

          const required = properties.required?.includes(propName) ?? false;
          const isLast = propName === properties.propertyOrder.at(-1);
          return (
            <Fragment key={propName}>
              <HR noMargin />
              {propList.length === 1 && (
                <SingleProperty
                  name={propName}
                  property={propList[0]}
                  required={required}
                  showRequired={showRequired}
                  isLast={isLast}
                  level={level}
                />
              )}
              {propList.length > 1 && (
                <>
                  <PropertiesListHeader
                    name={propName}
                    attributes={
                      showRequired ? [required ? 'required' : 'optional'] : []
                    }
                    level={level}
                  />
                  {'description' in property &&
                    (typeof property.description === 'string' ? (
                      <CordDocsMarkdown value={property.description} />
                    ) : (
                      property.description
                    ))}
                  <p>This property can be one of the following:</p>
                  <ul>
                    {propList.map((prop, idx) => {
                      return (
                        <AnyOfItem
                          isLast={idx === propList.length - 1}
                          key={idx}
                        >
                          <SingleProperty
                            property={prop}
                            required={required}
                            showRequired={false}
                            isLast={false}
                            level={level}
                          />
                        </AnyOfItem>
                      );
                    })}
                  </ul>
                </>
              )}
              {isLast ? null : <HR noMargin />}
            </Fragment>
          );
        })
      )}
    </section>
  );
}
