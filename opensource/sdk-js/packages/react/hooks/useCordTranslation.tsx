import * as React from 'react';
import { useContext } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Trans, useTranslation } from 'react-i18next';
import { CordContext } from '../index.js';

// We're exporting constants that are functions so that we can infer that their
// types are the same as the i18next types.  i18next uses some really involved
// generics to make typechecking work, and I don't want to repeat them.

export const useCordTranslation: typeof useTranslation =
  function useCordTranslation(ns, options) {
    const cordContext = useContext(CordContext);
    return useTranslation(ns, {
      ...options,
      i18n: options?.i18n ?? cordContext.i18n,
    });
  };

export const CordTrans: typeof Trans = function CordTrans(props) {
  const cordContext = useContext(CordContext);
  return <Trans {...props} i18n={props.i18n ?? cordContext.i18n}></Trans>;
};
