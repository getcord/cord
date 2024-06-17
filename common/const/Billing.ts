export const PRO_PRODUCT_ID = 'pro';
export const PRO_APP_LIMIT = 5;
export const FREE_APP_LIMIT = 1;
export const PRO_SEATS_LIMIT = 5;
export const FREE_SEATS_LIMIT = 2;
export const PRO_MAU_LIMIT = 25000;
export const FREE_MAU_LIMIT = 5000;

export interface Addon {
  name: string;
  description: string;
}

export const ADDONS = [
  {
    name: 'custom_s3_bucket',
    description: 'Custom S3 Bucket',
  },
  {
    name: 'custom_segment_write_key',
    description: 'Custom Segment Write Key',
  },
  {
    name: 'customer_support',
    description: 'Direct Customer Support via Community',
  },
];
