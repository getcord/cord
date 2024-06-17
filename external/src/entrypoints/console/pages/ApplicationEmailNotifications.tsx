import type { WheelEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  OutlinedInput,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { createUseStyles } from 'react-jss';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { Sizes } from 'common/const/Sizes.ts';
import type {
  LogoConfigInput,
  UpdateApplicationForConsoleMutationVariables,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { useUpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import {
  createDefaultSenderEmailName,
  getEmailInfoFromSenderData,
} from 'common/util/index.ts';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';
import { useImageField } from 'external/src/entrypoints/console/hooks/useImageField.tsx';
import { Colors } from 'common/const/Colors.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { DEFAULT_EMAIL_DOMAIN } from 'external/src/entrypoints/console/const.ts';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import { UnsavedChangesBanner } from 'external/src/entrypoints/console/components/UnsavedChangesBanner.tsx';

const DEFAULT_CORD_LOGO = `${APP_ORIGIN}/static/email/cord/wordmark.png`;
const MAX_LOGO_WIDTH = 240;
const MAX_LOGO_HEIGHT = 120;

const useStyles = createUseStyles({
  boxContent: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: Sizes.XLARGE,
  },
  form: { display: 'contents' },
  label: { fontWeight: 500, margin: 0 },
  senderSuffix: {
    // Setting height to 100% doesn't really do the right thing on the
    // endAdornment prop where this is used, so setting an absolute value instead
    height: '54px',
    borderLeft: `2px solid ${Colors.GREY_LIGHT}`,
    backgroundColor: Colors.GREY_X_LIGHT,
    marginLeft: Sizes.DEFAULT_PADDING_PX,
    padding: `0 ${Sizes.DEFAULT_PADDING_PX}px`,
    width: '300px',
    display: 'flex',
    alignItems: 'center',
  },
});

export default function ApplicationEmailNotifications() {
  const classes = useStyles();
  const { application, refetch, id } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [updateApplication] = useUpdateApplicationForConsoleMutation();

  const [partnerName, setPartnerName] = useState('');
  const [sender, setSender] = useState('');
  const [logoSize, setLogoSize] = useState<number>(0);
  const [logoSizeMode, setLogoSizeMode] = useState<'width' | 'height'>('width');
  const [enableNotifications, setEnableNotifications] = useState(true);

  const {
    imageURL,
    setInitialImageURLRef,
    uploadImageFile,
    imageFieldElement,
    imageValid,
    imageFile,
  } = useImageField({
    imageWidth: logoSizeMode === 'width' ? logoSize : undefined,
    imageHeight: logoSizeMode === 'height' ? logoSize : undefined,
    newDesign: true,
    placeholder: 'Your logo URL',
    defaultImagePreviewUrl: DEFAULT_CORD_LOGO,
    maxImageWidth: MAX_LOGO_WIDTH,
    maxImageHeight: MAX_LOGO_HEIGHT,
    disabled: !enableNotifications,
  });

  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<
    string | null
  >(null);
  const [validationErrorMessage, setValidationErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultSenderEmail = createDefaultSenderEmailName(
    application?.name ?? '',
  );
  const senderEmail = getEmailInfoFromSenderData(
    application?.customEmailTemplate?.sender ?? undefined,
  );
  const senderDomain = `@${senderEmail?.domain ?? DEFAULT_EMAIL_DOMAIN}`;
  const {
    billingInfo: { pricingTier },
  } = useContextThrowingIfNoProvider(CustomerInfoContext);

  const isDirty = useMemo(() => {
    const appSender =
      application?.customEmailTemplate?.sender &&
      application?.customEmailTemplate?.sender.split('<')[1].split('@')[0];

    const logoConfig = application?.customEmailTemplate?.logoConfig;
    let mode = logoSizeMode;
    let size = logoSize;
    if (logoConfig) {
      if (logoConfig.height === 'auto' && logoConfig.width) {
        mode = 'width';
        size = parseInt(logoConfig.width, 10);
      } else if (logoConfig.width === 'auto' && logoConfig.height) {
        mode = 'height';
        size = parseInt(logoConfig.height, 10);
      }
    }

    if (
      (application?.customEmailTemplate?.partnerName ?? '') !== partnerName ||
      (appSender ?? '') !== sender ||
      application?.enableEmailNotifications !== enableNotifications ||
      application?.customEmailTemplate?.imageURL !== imageURL ||
      imageFile ||
      mode !== logoSizeMode ||
      size !== logoSize
    ) {
      return true;
    }
    return false;
  }, [
    application?.customEmailTemplate,
    partnerName,
    sender,
    application?.enableEmailNotifications,
    enableNotifications,
    imageURL,
    imageFile,
    logoSizeMode,
    logoSize,
  ]);

  const onSave = useCallback(async () => {
    setSubmissionErrorMessage(null);
    setSuccessMessage(null);
    try {
      const variables: UpdateApplicationForConsoleMutationVariables = {
        id: id!,
        customEmailTemplate: undefined,
        enableEmailNotifications: enableNotifications,
        name: undefined,
        customLinks: undefined,
        segmentWriteKey: undefined,
        iconURL: undefined,
        customNUX: undefined,
        redirectURI: undefined,
        eventWebhookURL: undefined,
        eventWebhookSubscriptions: undefined,
      };
      if (imageValid === false) {
        throw new Error('Image is not valid format');
      }

      const uploadedLogoURL = await uploadImageFile(id!, 'email-logo');

      let logoConfig: LogoConfigInput | null = null;
      if (uploadedLogoURL || imageURL) {
        logoConfig =
          logoSizeMode === 'height'
            ? { height: `${logoSize}`, width: 'auto' }
            : {
                height: 'auto',
                width: `${logoSize}`,
              };
      }
      variables.customEmailTemplate = {
        partnerName,
        imageURL: uploadedLogoURL ?? imageURL ?? '',
        sender: `${partnerName} <${
          sender || defaultSenderEmail
        }${senderDomain}>`,
        logoConfig: logoConfig ?? null,
      };

      const result = await updateApplication({
        variables,
      });

      if (result.data?.updateApplication.success === false) {
        throw new Error();
      } else if (
        !result.errors &&
        result.data?.updateApplication.success === true
      ) {
        setSuccessMessage('Changes saved successfully.');
        void refetch();
      }
    } catch (error) {
      if (error instanceof Error) {
        setSubmissionErrorMessage(
          error?.message ??
            'An unexpected error has occurred. Please try again.',
        );
      }
    }
    return false;
  }, [
    imageValid,
    uploadImageFile,
    id,
    partnerName,
    imageURL,
    sender,
    defaultSenderEmail,
    enableNotifications,
    senderDomain,
    updateApplication,
    refetch,
    logoSize,
    logoSizeMode,
  ]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      await onSave();
    },
    [onSave],
  );

  useEffect(() => {
    if (logoSizeMode === 'width') {
      setLogoSize(MAX_LOGO_WIDTH / 2);
    } else {
      setLogoSize(MAX_LOGO_HEIGHT / 2);
    }
  }, [logoSizeMode]);

  useEffect(() => {
    if (application?.customEmailTemplate) {
      setInitialImageURLRef.current(application.customEmailTemplate.imageURL);

      const logoConfig = application.customEmailTemplate?.logoConfig;
      if (logoConfig) {
        if (logoConfig.height === 'auto' && logoConfig.width) {
          setLogoSize(parseInt(logoConfig.width, 10));
          setLogoSizeMode('width');
        } else if (logoConfig.width === 'auto' && logoConfig.height) {
          setLogoSize(parseInt(logoConfig.height, 10));
          setLogoSizeMode('height');
        }
      }
      setPartnerName(
        application.customEmailTemplate.partnerName ?? application.name,
      );
      setSender(
        getEmailInfoFromSenderData(
          application.customEmailTemplate.sender ?? undefined,
        )?.username ?? '',
      );
    }
    setEnableNotifications(!!application?.enableEmailNotifications);
  }, [
    application?.enableEmailNotifications,
    application?.customEmailTemplate,
    application?.name,
    setInitialImageURLRef,
  ]);

  function onEmailSenderInputChange(value: string) {
    setValidationErrorMessage('');
    setSender(value);

    if (!value) {
      return;
    }
    const pattern = /^[^@;=\s]+$/;
    if (!pattern.test(value)) {
      setValidationErrorMessage(
        'Please ensure that the input does not contain the characters @ ; = or any extra whitespace.',
      );
    }
  }

  const logoSizeInput = useMemo(
    () => (
      <TextField
        type="number"
        value={logoSize}
        InputProps={{
          endAdornment: <InputAdornment position="end">px</InputAdornment>,
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          if (event.target.value === '') {
            setLogoSize(0);
          } else {
            const value = parseInt(event.target.value, 10);
            if (logoSizeMode === 'width') {
              setLogoSize(Math.max(0, Math.min(value, MAX_LOGO_WIDTH)));
            } else {
              setLogoSize(Math.max(0, Math.min(value, MAX_LOGO_HEIGHT)));
            }
          }
        }}
        sx={{ maxWidth: '30%', marginInlineStart: Sizes.XLARGE / SPACING_BASE }}
        onWheel={(e: WheelEvent<HTMLInputElement>) =>
          (e.target as HTMLElement).blur()
        }
      />
    ),
    [logoSize, logoSizeMode],
  );

  return (
    <Stack gap={Sizes.XLARGE / SPACING_BASE}>
      {isDirty && <UnsavedChangesBanner onSave={onSave} />}
      <Box className={classes.boxContent}>
        <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
          Email Notifications
        </Typography>
        <BoxRow label="Notifications">
          <FormControlLabel
            control={
              <Switch
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
              />
            }
            label={enableNotifications ? 'Enabled' : 'Disabled'}
          />
        </BoxRow>
        <form onSubmit={onSubmit} className={classes.form}>
          <BoxRow label="Sender email address">
            <Stack direction="column" gap={Sizes.MEDIUM / SPACING_BASE}>
              <OutlinedInput
                disabled={!enableNotifications}
                error={!!validationErrorMessage}
                type="text"
                placeholder={defaultSenderEmail}
                value={sender}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onEmailSenderInputChange(e.target.value)
                }
                sx={{ paddingRight: 0 }}
                endAdornment={
                  <div className={classes.senderSuffix}>{senderDomain}</div>
                }
              />
              {validationErrorMessage && (
                <Typography
                  variant="body2"
                  color="error"
                  marginBottom={`${Sizes.MEDIUM}px`}
                >
                  <ExclamationCircleIcon height={20} />{' '}
                  <span>{validationErrorMessage}</span>
                </Typography>
              )}
              <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
                The email address from which your notifications will be sent.{' '}
                {senderDomain === `@${DEFAULT_EMAIL_DOMAIN}` &&
                  pricingTier !== 'scale' && (
                    <span>
                      The domain for this email address is currently set to{' '}
                      <strong>{DEFAULT_EMAIL_DOMAIN}</strong>. If you would like
                      to customize this please{' '}
                      <Link href={'/settings/billing'}>upgrade</Link>.
                    </span>
                  )}
              </Typography>
            </Stack>
          </BoxRow>
          <BoxRow label="Sender name">
            <Stack direction="column" gap={Sizes.MEDIUM / SPACING_BASE}>
              <TextField
                type="text"
                disabled={!enableNotifications}
                placeholder={application!.name}
                value={partnerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPartnerName(e.target.value)
                }
              />
              <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
                The name shown in both the subject and body of email
                notifications. Defaults to your project&apos;s name.
              </Typography>
            </Stack>
          </BoxRow>
          <BoxRow label="Logo in email">
            <Stack direction="column" gap={Sizes.MEDIUM / SPACING_BASE}>
              {imageFieldElement}
              <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
                The logo shown in email notifications. Defaults to your
                project&apos;s icon. Enter a URL or upload an file. Images must
                be a square .png or .jpg, and ideally 240 x 120px.
              </Typography>
            </Stack>
          </BoxRow>
          {imageValid && (
            <BoxRow label="Logo size">
              <Stack direction="column" gap={Sizes.XLARGE / SPACING_BASE}>
                <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
                  Customize the size of your logo in emails by setting a fixed
                  width or height. The logo will be scaled proportionally based
                  on the specified size. The preview above shows the actual size
                  of the logo.
                </Typography>
                <Stack direction="column">
                  <Stack alignItems="center" direction="row">
                    <Checkbox
                      disabled={!enableNotifications}
                      inputProps={{ 'aria-label': 'Checkbox height' }}
                      checked={logoSizeMode === 'height'}
                      onClick={() => {
                        setLogoSizeMode('height');
                      }}
                      sx={{ marginInlineStart: '-12px' }}
                      id="checkbox-height"
                    />
                    <label className={classes.label} htmlFor="checkbox-height">
                      Height
                    </label>
                  </Stack>
                  {logoSizeMode === 'height' ? logoSizeInput : null}
                </Stack>
                <Stack direction="column">
                  <Stack alignItems="center" direction="row">
                    <Checkbox
                      disabled={!enableNotifications}
                      inputProps={{ 'aria-label': 'Checkbox width' }}
                      checked={logoSizeMode === 'width'}
                      onClick={() => {
                        setLogoSizeMode('width');
                      }}
                      sx={{ marginInlineStart: '-12px' }}
                      id="checkbox-width"
                    />
                    <label className={classes.label} htmlFor="checkbox-width">
                      Width
                    </label>
                  </Stack>
                  {logoSizeMode === 'width' ? logoSizeInput : null}
                </Stack>
              </Stack>
            </BoxRow>
          )}
          <BoxRow>
            <div style={{ display: 'flex' }}>
              <Button
                type={'submit'}
                variant="contained"
                disabled={!!validationErrorMessage || !isDirty}
              >
                Save
              </Button>
              {!isDirty && (
                <HelpIconWithTooltip
                  tooltipName="disabled save"
                  tooltipContent="You have no changes"
                />
              )}
            </div>
          </BoxRow>
          <SubmitFormResultMessage
            errorMessage={submissionErrorMessage}
            clearErrorMessage={() => setSubmissionErrorMessage(null)}
            successMessage={successMessage}
            clearSuccessMessage={() => setSuccessMessage(null)}
            warningMessage={null}
            clearWarningMessage={() => {}}
          />
        </form>
      </Box>
    </Stack>
  );
}
