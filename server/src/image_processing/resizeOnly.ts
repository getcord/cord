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
export interface ProcessedImageOptions {
  size?: number;
}

export async function getResizedImageURL(
  sourceURL: string,
  options: ProcessedImageOptions = {},
  maxAgeSeconds: number = 48 * 3600,
) {
  // Slack avatars are displayed as 36x36 pixels, so to look good on retina
  // screens, we should render to 72x72 pixels.
  const size = options.size || 72;

  const variant = `source_resized_${size}`;

  const serviceViewer = Viewer.createServiceViewer();
  const logger = new Logger(serviceViewer);
  const imageVariantLoader = new ImageVariantLoader(serviceViewer);

  // Check if this variant has been produced already.
  const savedVariant = await imageVariantLoader.getSingleImageVariant(
    sourceURL,
    variant,
  );

  if (savedVariant && savedVariant.sourceAgeSeconds < maxAgeSeconds) {
    // We have produced this image before, and the downloads of the image we
    // used was not older than `maxAgeSeconds`, so we can just return the
    // previously produced image.
    return getPublicBucketDownloadURL(savedVariant.filename);
  }

  // Download the source image
  const sourceDownload = await downloadURL(sourceURL);

  // Calculate the Sha384 hash of the image we have just downloaded
  const sourceSha384 = sha384(sourceDownload);

  // And update the external_assets table to save the information that at this
  // time, the given URL resolves to the content hash.
  const externalAssetMutator = new ExternalAssetMutator(serviceViewer);
  await externalAssetMutator
    .update(sourceURL, sourceSha384)
    .catch(logger.exceptionLogger('update source image asset'));

  // Now check again: if we produced this image variant before, and the image
  // we downloaded now are still the same as when we produced the variant, we
  // can just return that image.
  if (savedVariant && savedVariant.sourceSha384 === sourceSha384) {
    return getPublicBucketDownloadURL(savedVariant.filename);
  }

  // Now that we have downloaded source image, let's produce the
  // image variant!
  const outputImageBuffer = await sharp(sourceDownload)
    .pipelineColourspace('rgb16')
    .resize(size, size, { fit: 'cover' })
    .rotate()
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
  const imageVariantMutator = new ImageVariantMutator(serviceViewer);
  await imageVariantMutator
    .saveImageVariant(sourceSha384, variant, outputFilename)
    .catch(logger.exceptionLogger('update image_variants table'));

  return getPublicBucketDownloadURL(outputFilename);
}
