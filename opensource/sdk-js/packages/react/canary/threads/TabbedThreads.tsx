import React, { forwardRef, useMemo } from 'react';
import cx from 'classnames';
import { experimental } from '../../index.js';
import { Button } from '../../betaV2.js';
import type {
  ReplaceConfig,
  StyleProps,
  ThreadsByOptionsProps,
} from '../../betaV2.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import * as classes from './TabbedThreads.css.js';

export type TabbedThreadOptions = {
  name: string;
  threadsOptions: ThreadsByOptionsProps;
  replace?: ReplaceConfig;
};

export type TabbedThreadsProps = {
  tabbedThreadsOptions: TabbedThreadOptions[];
  currentTab: string;
  onChangeTab: (tab: string) => void;
} & StyleProps;

export const TabbedThreads = withCord<
  React.PropsWithChildren<TabbedThreadsProps>
>(
  forwardRef(function TabbedThreads(
    {
      tabbedThreadsOptions,
      currentTab,
      onChangeTab,
      className,
      style,
    }: TabbedThreadsProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const tabButtons = useMemo(() => {
      return tabbedThreadsOptions.map((tab) => (
        <Button
          canBeReplaced
          buttonAction={`${tab.name}-tab`}
          key={tab.name}
          onClick={() => {
            onChangeTab(tab.name);
          }}
          className={cx(classes.threadsTab, {
            [classes.threadsActiveTab]: tab.name === currentTab,
          })}
        >
          {tab.name}
        </Button>
      ));
    }, [currentTab, onChangeTab, tabbedThreadsOptions]);

    const tabThreads = useMemo(() => {
      return tabbedThreadsOptions.map(({ name, threadsOptions, replace }) => {
        return (
          <experimental.Threads.ByOptions
            key={name}
            options={threadsOptions.options}
            composerOptions={threadsOptions.composerOptions}
            className={cx({
              [classes.threadsActiveTab]: name === currentTab,
            })}
            replace={replace}
          />
        );
      });
    }, [currentTab, tabbedThreadsOptions]);

    if (tabbedThreadsOptions.length === 0) {
      console.warn('tabbedThreadOptions should not be empty');
      return null;
    }

    return (
      <div
        className={cx(classes.tabbedThreads, className)}
        style={style}
        ref={ref}
      >
        <div className={classes.threadsTabsContainer}>{tabButtons}</div>
        {tabThreads}
      </div>
    );
  }),
  'TabbedThreads',
);
