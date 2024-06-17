import { forwardRef } from 'react';
import { betaV2, experimental, user as userSDK } from '@cord-sdk/react';

export function CordReplacementsExample() {
  const viewer = userSDK.useViewerData();

  if (!viewer) {
    return <div>No viewer provided</div>;
  }

  const REPLACE_TOOLTIP = { AvatarTooltip: MyAvatarTooltip };
  const REPLACE_FALLBACK = { AvatarFallback: MyAvatarFallback };
  const REPLACE_ALL: betaV2.ReplaceConfig = {
    AvatarFallback: MyAvatarFallback,
    AvatarTooltip: MyAvatarTooltip,
    Avatar: MyAvatar,
  };
  const REPLACE_WITHIN = {
    within: { Facepile: REPLACE_ALL },
  };

  return (
    <>
      <h2>Facepile</h2>
      <h4>Thread ID: `abc123`</h4>
      <experimental.ThreadFacepile threadId={'abc123'} />
      <h2>Avatar Component - showing current user</h2>
      <betaV2.Avatar.ByID userID={viewer.id} enableTooltip={true} />
      <h4>Replace Tooltip directly on Avatar</h4>
      <p>
        On avatar:
        <betaV2.Avatar.ByID
          userID={viewer.id}
          enableTooltip={true}
          replace={REPLACE_TOOLTIP}
        />
      </p>
      <p>
        On facepile:
        <betaV2.Facepile.ByID
          userIDs={['nimrod', 'flooey', 'invalid_user_details']}
          replace={REPLACE_TOOLTIP}
        />
      </p>
      <h4>Replace Fallback</h4>
      <betaV2.Replace replace={REPLACE_FALLBACK}>
        <betaV2.Avatar.ByID
          userID="invalid_user_details"
          enableTooltip={true}
        />
        <h4>Replace Tooltip nested in Replace Fallback</h4>
        <betaV2.Replace replace={REPLACE_TOOLTIP}>
          <betaV2.Avatar.ByID userID={viewer.id} enableTooltip={true} />
        </betaV2.Replace>
      </betaV2.Replace>

      <h4>Replace all</h4>
      <betaV2.Replace replace={REPLACE_ALL}>
        <betaV2.Avatar.ByID
          userID={viewer.id}
          enableTooltip={true}
          replace={{ AvatarTooltip: MyAvatarTooltip }}
        />
        <betaV2.Facepile.ByID
          userIDs={['nimrod', 'flooey', 'invalid_user_details']}
        />
        <span>This avatar is an onion</span>
        <cord-avatar user-id={viewer.id} enable-tooltip="true" />
      </betaV2.Replace>

      <h4>Replace within Facepile</h4>
      <betaV2.Replace replace={REPLACE_WITHIN}>
        <betaV2.Facepile.ByID
          userIDs={['nimrod', 'flooey', 'invalid_user_details']}
        />
        <betaV2.Avatar.ByID userID={viewer.id} enableTooltip={true} />
      </betaV2.Replace>
    </>
  );
}

function MyAvatarTooltip(props: betaV2.AvatarTooltipProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'oklch(0.61 0.24 25.78 / 0.4)',
        backdropFilter: 'blur(2px)',
        textShadow: '1px 1px black',
        padding: '2px 4px',
      }}
    >
      <div>{props.userData.displayName} does not like 🧅 very much </div>
      <betaV2.Avatar.ByID userID={props.userData.id} />
      <div>There is 🍄 in this tooltip. </div>
      <div>{props.viewerData.groupID}</div>
    </div>
  );
}

function MyAvatarFallback({ userData }: betaV2.AvatarFallbackProps) {
  const { displayName } = userData;
  return (
    <div className="cord-avatar-fallback">
      {displayName[0].toUpperCase() + displayName[1].toUpperCase()}
    </div>
  );
}

const MyAvatar = forwardRef(function MyAvatar(
  { user }: betaV2.AvatarProps,
  ref: React.ForwardedRef<HTMLImageElement>,
) {
  return user?.profilePictureURL ? (
    <img
      ref={ref}
      src={user.profilePictureURL}
      style={{
        height: 25,
        width: 25,
        filter: 'blur(0.7px) brightness(1.5) contrast(0.9) hue-rotate(47deg)',
      }}
    />
  ) : (
    <div>no url</div>
  );
});
