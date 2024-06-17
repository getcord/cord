import cx from 'classnames';
import { componentAttributes } from '@cord-sdk/components';

import { CordComponent } from 'sdk/client/core/components/index.tsx';
import type {
  LiveCursorsCursorProps,
  LiveCursorsReactComponentProps,
} from '@cord-sdk/react';
import { LiveCursors } from '@cord-sdk/react';
import type {
  HTMLCordLiveCursorsElement,
  LiveCursorsEventToLocationFn,
  LiveCursorsLocationToDocumentFn,
} from '@cord-sdk/types';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import * as classes from '@cord-sdk/react/components/LiveCursors.classnames.ts';

export class LiveCursorsWebComponent
  extends CordComponent(
    componentAttributes.LiveCursors,
  )<LiveCursorsReactComponentProps>
  implements HTMLCordLiveCursorsElement
{
  eventListeners = {};
  canOptInShadow = false;

  private _translations: LiveCursorsReactComponentProps['translations'];
  protected _cursorComponent: LiveCursorsReactComponentProps['cursorComponent'];

  public setTranslations(
    eventToLocation: LiveCursorsEventToLocationFn,
    locationToDocument: LiveCursorsLocationToDocumentFn,
  ) {
    this._translations = { eventToLocation, locationToDocument };
    this.onPropsChanged?.(this.props);
  }

  render() {
    return (
      <LiveCursors
        translations={this._translations}
        cursorComponent={this._cursorComponent}
        {...this.props}
      />
    );
  }
}

export class MultipleCursorsWebComponent extends LiveCursorsWebComponent {
  // Frozen-in-time cursor element, for BC.
  private _CURSOR_COLORS = ['#9A6AFF', '#EB5757', '#71BC8F', '#F88D76'];
  private _colorIndex = 0;
  private _colors: Record<string, string> = {};
  _cursorComponent = ({ user, pos }: LiveCursorsCursorProps) => {
    let color = this._colors[user.id];
    if (!color) {
      color =
        this._CURSOR_COLORS[this._colorIndex++ % this._CURSOR_COLORS.length];
      this._colors[user.id] = color;
    }

    return (
      <div
        className={classes.cursor}
        style={{ left: pos.viewportX + 'px', top: pos.viewportY + 'px' }}
      >
        <Icon name="Cursor" size="large" style={{ color: color }} />
        <span
          className={cx(classes.name, classes.label)}
          style={{ backgroundColor: color }}
        >
          {user.name}
        </span>
      </div>
    );
  };
}
