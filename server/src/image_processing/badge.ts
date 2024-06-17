import sharp from 'sharp';

import {
  getPublicBucketDownloadURL,
  publicS3Bucket,
} from 'server/src/files/upload.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { ImageVariantLoader } from 'server/src/entity/image_variant/ImageVariantLoader.ts';
import { ImageVariantMutator } from 'server/src/entity/image_variant/ImageVariantMutator.ts';
import { ExternalAssetMutator } from 'server/src/entity/extrernal_asset/ExternalAssetMutator.ts';
import {
  downloadURL,
  sha384,
  uploadImageToS3,
} from 'server/src/image_processing/util.ts';
import { Logger } from 'server/src/logging/Logger.ts';
export interface BadgedImageOptions {
  size?: number;
}

export async function getBadgedImageURL(
  sourceURL: string,
  badgeURL: string,
  options: BadgedImageOptions = {},
  maxAgeSeconds: number = 48 * 3600, // 48 hours
) {
  // The largest we display the avatar is 56px, so to look good on retina
  // screens, we should render to 112x112 pixels.
  const size = options.size || 112;

  const variantPrefix = `badge_${size}_br:`;

  const serviceViewer = Viewer.createServiceViewer();
  const logger = new Logger(serviceViewer);
  const imageVariantLoader = new ImageVariantLoader(serviceViewer);

  // Check if this variant has been produced already.
  const savedVariant = await imageVariantLoader.getTwoImageCompositionVariant(
    sourceURL,
    badgeURL,
    variantPrefix,
  );

  if (
    savedVariant &&
    savedVariant.sourceAgeSeconds < maxAgeSeconds &&
    savedVariant.overlayAgeSeconds < maxAgeSeconds
  ) {
    // We have produced this image before, and the downloads of the images we
    // used was not older than `maxAgeSeconds`, so we can just return the
    // previously produced image.
    return getPublicBucketDownloadURL(savedVariant.filename);
  }

  // Download the images
  const [sourceDownload, badgeDownload] = await Promise.all([
    downloadURL(sourceURL),
    downloadURL(badgeURL),
  ]);

  // Calculate the Sha384 hashes of the images we have just downloaded
  const sourceSha384 = sha384(sourceDownload);
  const badgeSha384 = sha384(badgeDownload);

  // And update the external_assets table to save the information that at this
  // time, the given URLs reolve to those content hashes.
  const externalAssetMutator = new ExternalAssetMutator(serviceViewer);
  await Promise.all([
    externalAssetMutator
      .update(sourceURL, sourceSha384)
      .catch(logger.exceptionLogger('update source image asset')),
    externalAssetMutator
      .update(badgeURL, badgeSha384)
      .catch(logger.exceptionLogger('update badge image asset')),
  ]);

  // Now check again: if we produced this image variant before, and the images
  // we downloaded now are still the same as when we produced the variant, we
  // can just return that image.
  if (
    savedVariant &&
    savedVariant.sourceSha384 === sourceSha384 &&
    savedVariant.overlaySha384 === badgeSha384
  ) {
    return getPublicBucketDownloadURL(savedVariant.filename);
  }

  // Now that we have downloaded source image and badge image, let's produce the
  // image variant!
  const sourceImage = sharp(sourceDownload)
    .pipelineColourspace('rgb16')
    .resize(size, size, { fit: 'cover' })
    .rotate();

  const badgeImage = sharp(badgeDownload).pipelineColourspace('rgb16');
  const metadata = await badgeImage.metadata();
  const badgeInputAspectRatio =
    metadata.width && metadata.height ? metadata.width / metadata.height : 1;
  const scaledBadgeWidth = Math.round(size * 0.4 * badgeInputAspectRatio);
  const scaledBadgeHeight = Math.round((size * 0.4) / badgeInputAspectRatio);
  const scaledBadge = badgeImage.resize(scaledBadgeWidth, scaledBadgeHeight);
  const outputImageBuffer = await sourceImage
    .composite([
      {
        input: await scaledBadge.png().toBuffer(),
        gravity: 'southeast',
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  // Construct a filename for this image. We use this to save this image in S3.
  // We use the Sha384 hash of the output image as filename, so that if we
  // produce the exact same image multiple times, we just overwrite the same
  // file in S3.
  const outputSha384 = sha384(outputImageBuffer);
  const outputFilename = `${outputSha384}.jpg`;

  // Upload to S3
  await uploadImageToS3(
    outputFilename,
    outputImageBuffer,
    'image/jpeg',
    publicS3Bucket,
  );

  // Save this image variant in the database.
  const variant = `${variantPrefix}${badgeSha384}`;
  const imageVariantMutator = new ImageVariantMutator(serviceViewer);
  await imageVariantMutator
    .saveImageVariant(sourceSha384, variant, outputFilename)
    .catch(logger.exceptionLogger('update image_variants table'));

  return getPublicBucketDownloadURL(outputFilename);
}
