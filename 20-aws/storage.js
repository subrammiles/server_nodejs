// S3: object storage for files (uploads, reports, backups). Objects live in buckets, addressed by key.
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';

export async function saveReport(s3, bucket, name, content) {
  const key = `reports/${new Date().toISOString().slice(0, 10)}/${name}`;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content, ContentType: 'text/plain' }));
  return key;
}

export async function readReport(s3, bucket, key) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return Body.transformToString();   // Body is a stream: large objects can be piped instead (lesson 06)
}

export async function listReports(s3, bucket, prefix = 'reports/') {
  const { Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  return Contents.map((o) => o.Key);
}
