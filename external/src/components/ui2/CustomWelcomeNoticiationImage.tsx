/* eslint-disable i18next/no-literal-string */
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { MESSAGE_BLOCK_AVATAR_SIZE } from 'common/const/Sizes.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { CustomSvgIcon } from '@cord-sdk/react/common/icons/customIcons/CustomSvgIcon.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { AnnotationPin2 } from 'external/src/components/ui2/icons/customIcons/AnnotationPinSvg.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

export function CustomWelcomeNotificationImage() {
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const { logError } = useLogger();

  if (!user) {
    logError('user-missing', { location: 'CustomeWelcomeNotificationImage' });
    return null;
  }

  const pinIcon = (
    <AnnotationPin2
      fillColour={cssVar('annotation-pin-unplaced-color')}
      outlineColour={cssVar('annotation-pin-unplaced-color')}
      width={36}
      style={{
        position: 'absolute',
        left: '86px',
        top: '-9px',
      }}
    />
  );

  return (
    <Box2
      backgroundColor="base-x-strong"
      padding="m"
      borderRadius="medium"
      style={{ position: 'relative', width: 288, height: 128 }}
    >
      <Box2 style={{ height: 96, position: 'relative' }}>
        <BackgroundSVG
          backgroundColor={cssVar('color-base')}
          color={cssVar('color-base-x-strong')}
        />
        {pinIcon}
        <Cursor style={{ position: 'absolute', left: 75, top: 20 }} />
      </Box2>
      <ContentBox2
        type="large"
        padding="xs"
        borderRadius="large"
        style={{
          maxWidth: 138,
          position: 'absolute',
          top: 44,
          right: 16,
        }}
      >
        <Row2 marginBottom="4xs">
          <Avatar2
            user={userToUserData(user)}
            size={MESSAGE_BLOCK_AVATAR_SIZE}
          />
          <Text2
            marginLeft="2xs"
            color="content-emphasis"
            font="small-emphasis"
            ellipsis
          >
            {user.displayName}
          </Text2>
        </Row2>
        <Text2 color="content-emphasis" font="small">
          Can you look at this please <strong>@Sam</strong>?
        </Text2>
      </ContentBox2>
    </Box2>
  );
}

function BackgroundSVG({
  backgroundColor,
  ...otherProps
}: JSX.IntrinsicElements['svg'] & { backgroundColor: string }) {
  return (
    <CustomSvgIcon
      width="168"
      height="104"
      viewBox="0 0 168 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <g filter="url(#filter0_d_525_41931)">
        <rect
          x="4"
          y="2"
          width="160"
          height="96"
          rx="2"
          fill={backgroundColor}
        />
        <rect
          x="16"
          y="14"
          width="50"
          height="72"
          rx="4"
          fill={otherProps.color}
        />
        <rect
          x="78"
          y="26"
          width="78"
          height="16"
          rx="4"
          fill={otherProps.color}
        />
        <rect
          x="78"
          y="54"
          width="32"
          height="16"
          rx="4"
          fill={otherProps.color}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_525_41931"
          x="0"
          y="0"
          width="168"
          height="104"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_525_41931"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_525_41931"
            result="shape"
          />
        </filter>
      </defs>
    </CustomSvgIcon>
  );
}

function Cursor(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon
      width="37"
      height="37"
      viewBox="0 0 37 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.677 27.1385V6.43506L25.687 21.4451H16.888L16.3705 21.5745L10.677 27.1385Z"
        fill="white"
      />
      <path
        d="M22.4518 28.0444L17.7936 29.9854L11.7119 15.6223L16.4996 13.6814L22.4518 28.0444Z"
        fill="white"
      />
      <path
        d="M16.7257 17.5871L14.3394 18.5889L18.3465 28.1342L20.7328 27.1324L16.7257 17.5871Z"
        fill="black"
      />
      <path
        d="M11.9709 9.54077V24.0332L15.8528 20.2807L16.3704 20.1513H22.5815L11.9709 9.54077Z"
        fill="black"
      />
    </CustomSvgIcon>
  );
}
