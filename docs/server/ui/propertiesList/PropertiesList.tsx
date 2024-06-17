/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';

import { getHeaderTag } from 'docs/server/ui/typography/Typography.tsx';
import type { PropertiesDictionary } from 'docs/server/ui/propertiesList/types.ts';
import SwitchCodeButton from 'docs/server/ui/switchCodeButton/SwitchCodeButton.tsx';
import {
  ClientLanguageDisplayNames,
  PreferenceContext,
} from 'docs/server/state/PreferenceContext.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';

type PropertiesListProps = {
  properties: PropertiesDictionary;
  // If the viewer changes tabs in the properties list and
  // this value is specified, we'll store their choice
  // in the preference context so that they see the same
  // code across the site (i.e. if they pick React here, they'll
  // see React everywhere).
  savePreferenceFor?: 'client' | 'server';

  headings?: Record<string, string>;
  headingLevel?: 2 | 3;

  showRequired?: boolean;
};

export default function PropertiesList({
  properties,
  savePreferenceFor,
  headings = {
    [ClientLanguageDisplayNames.VANILLA_JS]: 'Attributes & Events',
    [ClientLanguageDisplayNames.REACT]: 'Properties',
  },
  headingLevel = 2,
  showRequired = true,
}: PropertiesListProps) {
  const displayNames = React.useMemo(
    () => Object.keys(properties),
    [properties],
  );
  if (!displayNames.length) {
    throw new Error('Cannot display a properties list with no properties');
  }
  const preferenceContext = useContext(PreferenceContext);

  const [selectedDefinition, setSelectedDefinition] = useState(displayNames[0]);

  useEffect(() => {
    if (
      savePreferenceFor === 'client' &&
      displayNames.includes(preferenceContext.clientLanguage)
    ) {
      setSelectedDefinition(preferenceContext.clientLanguage);
    } else if (
      savePreferenceFor === 'server' &&
      displayNames.includes(preferenceContext.serverLanguage)
    ) {
      setSelectedDefinition(preferenceContext.serverLanguage);
    }
  }, [
    setSelectedDefinition,
    preferenceContext,
    savePreferenceFor,
    displayNames,
  ]);

  const onChange = useCallback(
    (idx: number) => {
      const displayName = displayNames[idx];
      if (!displayName) {
        throw new Error("Attempting to switch to a list that doesn't exist");
      }
      if (savePreferenceFor === 'client') {
        preferenceContext.setClientLanguage(displayName);
      } else if (savePreferenceFor === 'server') {
        preferenceContext.setServerLanguage(displayName);
      } else {
        setSelectedDefinition(displayName);
      }
    },
    [setSelectedDefinition, displayNames, savePreferenceFor, preferenceContext],
  );

  const heading: string | undefined = headings[selectedDefinition];
  const HeadingElement = getHeaderTag(headingLevel);

  return (
    <section>
      <div
        css={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {heading && <HeadingElement data-collapsible>{heading}</HeadingElement>}
        <div css={{ display: 'flex', whiteSpace: 'nowrap' }}>
          {displayNames.map((displayName, idx) => (
            <SwitchCodeButton
              key={displayName}
              displayName={displayName}
              selected={idx === displayNames.indexOf(selectedDefinition)}
              value={idx}
              disabled={displayNames.length === 1}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
      <SimplePropertiesList
        properties={properties[selectedDefinition]}
        showRequired={showRequired}
        level={headingLevel + 1}
      />
    </section>
  );
}
