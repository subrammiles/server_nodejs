// AWS SDK v3: one small package per service, imported separately (v2's monolithic "aws-sdk" is end-of-life).
//
// CREDENTIALS are found automatically by the default provider chain, in this order:
// env vars (AWS_ACCESS_KEY_ID...) -> ~/.aws/credentials / SSO profile -> container/EC2/Lambda role.
// NEVER put keys in code, and never print them (the old version of this repo logged the secret key).
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION ?? 'ap-south-1';
// Set AWS_ENDPOINT_URL=http://localhost:4566 to use LocalStack (AWS emulator in Docker) instead of real AWS
const endpoint = process.env.AWS_ENDPOINT_URL;

// Create clients ONCE and reuse them (they hold connection pools)
export const s3 = new S3Client({ region, endpoint, forcePathStyle: Boolean(endpoint) });
export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region, endpoint }), {
  marshallOptions: { removeUndefinedValues: true },
});
export const sqs = new SQSClient({ region, endpoint });
