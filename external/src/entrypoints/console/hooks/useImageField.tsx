import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Image, InputGroup } from 'react-bootstrap';

import { createUseStyles } from 'react-jss';
import { Button } from '@mui/material';
import {
  ArrowUpOnSquareIcon as UploadIcon,
  TrashIcon,
} from '@heroicons/react/20/solid';
import { Colors } from 'common/const/Colors.ts';
import { CustomButton } from 'external/src/entrypoints/console/components/CustomButton.tsx';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import type { ApplicationAssetNameType } from 'common/uploads/index.ts';
import { assertValid, validateFileForUpload } from 'common/uploads/index.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { useConsoleAssetFileUploader } from 'external/src/effects/useConsoleAssetFileUploader.ts';
import type { UUID } from 'common/types/index.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import EmptyImage from 'external/src/static/empty-image.svg';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

const useStyles = createUseStyles({
  container: {
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    border: `1px solid ${Colors.GREY_LIGHT}`,
  },
  pictureContainer: {
    padding: Sizes.XXLARGE,
    display: 'flex',
    justifyContent: 'center',
  },
  footer: {
    borderTop: `1px solid ${Colors.GREY_LIGHT}`,
    display: 'flex',
    flexDirection: 'row',
  },
  uploadButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
    padding: Sizes.LARGE,
  },
  urlInput: {
    flexGrow: 1,
    border: 'none',
    margin: Sizes.LARGE,
  },
});

type Props = {
  label?: string;
  tooltipContent?: string;
  imageWidth?: number;
  imageHeight?: number;
  placeholder?: string | ((useNoImageToggled: boolean) => string);
  includeNoImageToggle?: boolean;
  defaultImagePreviewUrl?: string;
  // Bootstrap's thumbnail prop gives an image a rounded 1px border appearance
  thumbnail?: boolean;
  required?: boolean;
  inlinePreview?: boolean;
  newDesign?: boolean;
  maxImageHeight?: number;
  maxImageWidth?: number;
  disabled?: boolean;
};

export function useImageField({
  label,
  tooltipContent,
  placeholder: _placeholder,
  imageWidth,
  imageHeight,
  thumbnail,
  includeNoImageToggle,
  defaultImagePreviewUrl,
  required,
  inlinePreview,
  newDesign,
  maxImageHeight,
  maxImageWidth,
  disabled = false,
}: Props) {
  const classes = useStyles();

  const [initialImageURL, _setInitialImageURL] = useState<string | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [imagePreviewURL, setImagePreviewURL] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [noImageToggled, setNoImageToggled] = useState(false);

  const uploadAssetFile = useConsoleAssetFileUploader();

  const uploadImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (includeNoImageToggle && initialImageURL === '') {
      setNoImageToggled(true);
    }
  }, [includeNoImageToggle, initialImageURL]);

  const setInitialImageURL = useCallback((url: string | null) => {
    _setInitialImageURL(url);
    setImageURL(url);
    setImagePreviewURL(url);
  }, []);
  // Expose ref to avoid possibility of function redefinition triggering effects
  // (in case dependencies are added to the function in future)
  const setInitialImageURLRef = useUpdatingRef(setInitialImageURL);

  const uploadImageFile = useCallback(
    async (applicationID: UUID, assetName: ApplicationAssetNameType) => {
      if (imagePreviewURL && imageFile) {
        URL.revokeObjectURL(imagePreviewURL);
        const downloadURL = await uploadAssetFile(
          applicationID,
          imageFile,
          assetName,
        );

        if (!downloadURL) {
          return null;
        }

        setImageURL(downloadURL);
        setImageFile(null);

        return downloadURL;
      }
      return null;
    },
    [imageFile, imagePreviewURL, uploadAssetFile],
  );

  const previewURL = imagePreviewURL || defaultImagePreviewUrl || null;

  const placeholder =
    !_placeholder || typeof _placeholder === 'string'
      ? _placeholder
      : _placeholder(noImageToggled);

  const [imageLoaded, setImageLoaded] = useState(false);

  const imageFieldElement = useMemo(() => {
    const onImageURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value || null;
      setImageURL(url);
      setImagePreviewURL(url);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        if (!e.target) {
          return;
        }
        const files = e.target.files;
        if (files && files.length > 0) {
          const file = files[0];
          assertValid(
            validateFileForUpload('attachment', {
              name: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          );
          setImageFile(file);
          setImagePreviewURL(URL.createObjectURL(file));
        }
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      } catch (e) {
        // eslint-disable-next-line no-alert
        alert(e);
      }
    };

    const onRemoveImageClick = () => {
      setImageFile(null);
      setImageURL(initialImageURL);
      setImagePreviewURL(initialImageURL);
      if (uploadImageRef.current) {
        uploadImageRef.current.value = '';
      }
    };

    if (!newDesign) {
      return (
        <>
          <Form.Group>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  {label}
                  {tooltipContent && (
                    <HelpIconWithTooltip
                      placement="auto"
                      tooltipName="image"
                      tooltipContent={tooltipContent}
                    />
                  )}
                </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                required={required}
                type="text"
                placeholder={placeholder}
                value={imageURL ?? ''}
                onChange={onImageURLChange}
                disabled={Boolean(imageFile || noImageToggled) || disabled}
              />
              {includeNoImageToggle && (
                <InputGroup.Append>
                  <InputGroup.Text>Use no image</InputGroup.Text>
                  <InputGroup.Checkbox
                    checked={noImageToggled}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNoImageToggled(e.target.checked);
                      if (e.target.checked) {
                        setInitialImageURL(''); // empty string = 'please dont show an image'
                      } else {
                        setInitialImageURL(null);
                      }
                      setImageFile(null);
                    }}
                    disabled={disabled}
                  />
                </InputGroup.Append>
              )}
              {!noImageToggled && previewURL && inlinePreview && (
                <Image
                  style={{
                    height: '2.375rem',
                    width: '2.375rem',
                    padding: '0.375rem',
                  }}
                  src={previewURL}
                  thumbnail={thumbnail}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(false)}
                />
              )}
            </InputGroup>
            {!noImageToggled && previewURL && !inlinePreview && (
              <Image
                src={previewURL}
                thumbnail={thumbnail}
                width={imageWidth}
                height={imageHeight}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
            )}
          </Form.Group>
          {!noImageToggled && (
            <Form.Group>
              <Form.Control
                type="file"
                hidden
                ref={uploadImageRef}
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={onFileChange}
                disabled={disabled}
              />
              <label style={{ width: 'fit-content' }}>
                <CustomButton
                  onClick={() => uploadImageRef.current?.click()}
                  disabled={disabled}
                >
                  Upload Image
                </CustomButton>
              </label>
              {imageFile && (
                <CustomButton
                  onClick={onRemoveImageClick}
                  style={{ marginLeft: Sizes.MEDIUM }}
                  disabled={disabled}
                >
                  Remove image
                </CustomButton>
              )}
            </Form.Group>
          )}
        </>
      );
    } else {
      return (
        <div className={classes.container}>
          <section className={classes.pictureContainer}>
            {previewURL ? (
              <Image
                src={previewURL}
                thumbnail={thumbnail}
                width={imageWidth}
                height={imageHeight}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
                style={{ maxHeight: maxImageHeight, maxWidth: maxImageWidth }}
              />
            ) : (
              <EmptyImage height={56} color={Colors.GREY_LIGHT} />
            )}
          </section>
          <section className={classes.footer}>
            {imageFile ? (
              <div className={classes.urlInput} />
            ) : (
              <input
                required={required}
                className={classes.urlInput}
                placeholder={placeholder}
                value={imageURL ?? ''}
                onChange={onImageURLChange}
                disabled={Boolean(imageFile) || disabled}
              />
            )}
            <div>
              <input
                type="file"
                hidden
                ref={uploadImageRef}
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={onFileChange}
              />
              <section className={classes.uploadButtonContainer}>
                <Button
                  size="small"
                  color="secondary"
                  variant="contained"
                  onClick={() => uploadImageRef.current?.click()}
                  sx={{ boxShadow: 'none' }}
                  disabled={disabled}
                >
                  <UploadIcon
                    height={16}
                    style={{ marginInlineEnd: Sizes.XSMALL }}
                  />
                  Upload image
                </Button>
                {imageFile && (
                  <Button
                    size="small"
                    color="secondary"
                    variant="contained"
                    onClick={onRemoveImageClick}
                    sx={{
                      marginLeft: Sizes.MEDIUM / SPACING_BASE,
                      boxShadow: 'none',
                    }}
                    disabled={disabled}
                  >
                    <TrashIcon
                      height={16}
                      style={{ marginInlineEnd: Sizes.XSMALL }}
                    />
                    Remove image
                  </Button>
                )}
              </section>
            </div>
          </section>
        </div>
      );
    }
  }, [
    disabled,
    newDesign,
    initialImageURL,
    label,
    tooltipContent,
    required,
    placeholder,
    imageURL,
    imageFile,
    noImageToggled,
    includeNoImageToggle,
    previewURL,
    inlinePreview,
    thumbnail,
    imageWidth,
    imageHeight,
    setInitialImageURL,
    classes,
    maxImageHeight,
    maxImageWidth,
  ]);

  const imageValid = imageLoaded && (imageURL || imageFile);

  return useMemo(
    () => ({
      setInitialImageURLRef,
      imageURL,
      uploadImageFile,
      imageFieldElement,
      imageValid,
      noImageToggled,
      imageFile,
    }),
    [
      imageFieldElement,
      imageURL,
      setInitialImageURLRef,
      uploadImageFile,
      imageValid,
      noImageToggled,
      imageFile,
    ],
  );
}
