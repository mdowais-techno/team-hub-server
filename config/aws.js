// config/aws.js
export const AWS_CONFIG = {
  bucketName: process.env.VITE_AWS_BUCKET_NAME || 'techno-t-hub',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_KEY || ''
  },
  // For local development, you can enable this mode
  localStorageMode: {
    enabled: false, // Set to false when using actual S3
    key: 'localS3Storage'
  }
};
