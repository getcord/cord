import { aws_s3 as S3 } from 'aws-cdk-lib';

// To be kept in sync with local-s3-cors-config.json in /ops/local-s3
export const CORS_RULES: S3.CorsRule[] = [
  {
    allowedOrigins: ['*'],
    allowedHeaders: ['*'],
    allowedMethods: [
      S3.HttpMethods.GET,
      S3.HttpMethods.POST,
      S3.HttpMethods.PUT,
      S3.HttpMethods.DELETE,
      S3.HttpMethods.HEAD,
    ],
  },
];
