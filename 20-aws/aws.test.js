// AWS code tested WITHOUT AWS: aws-sdk-client-mock intercepts client.send() calls.
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { listReports, readReport, saveReport } from './storage.js';
import { getOrder, ordersOf, putOrder } from './orders-table.js';
import { processBatch, publishOrderPlaced } from './order-queue.js';
import { createHandler } from './lambda-handler.js';

const s3 = new S3Client({ region: 'ap-south-1' });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-south-1' }));
const sqs = new SQSClient({ region: 'ap-south-1' });
const s3Mock = mockClient(s3);
const dynamoMock = mockClient(dynamo);
const sqsMock = mockClient(sqs);

beforeEach(() => {
  s3Mock.reset();
  dynamoMock.reset();
  sqsMock.reset();
});

describe('S3', () => {
  it('uploads under a dated key and reads it back', async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    s3Mock.on(GetObjectCommand).resolves({ Body: { transformToString: async () => 'sales: 42' } });

    const key = await saveReport(s3, 'my-bucket', 'sales.txt', 'sales: 42');
    assert.match(key, /^reports\/\d{4}-\d{2}-\d{2}\/sales\.txt$/);
    assert.deepEqual(s3Mock.commandCalls(PutObjectCommand)[0].args[0].input,
      { Bucket: 'my-bucket', Key: key, Body: 'sales: 42', ContentType: 'text/plain' });
    assert.equal(await readReport(s3, 'my-bucket', key), 'sales: 42');
  });

  it('lists keys and copes with an empty bucket', async () => {
    s3Mock.on(ListObjectsV2Command).resolvesOnce({ Contents: [{ Key: 'reports/a' }] }).resolvesOnce({});
    assert.deepEqual(await listReports(s3, 'b'), ['reports/a']);
    assert.deepEqual(await listReports(s3, 'b'), []);
  });
});

describe('DynamoDB', () => {
  it('puts with a condition, gets and queries by partition key', async () => {
    dynamoMock.on(PutCommand).resolves({});
    dynamoMock.on(GetCommand).resolves({ Item: { customerId: 'c1', orderId: 'o1' } });
    dynamoMock.on(QueryCommand).resolves({ Items: [{ orderId: 'o2' }, { orderId: 'o1' }] });

    await putOrder(dynamo, { customerId: 'c1', orderId: 'o1', total: 99 });
    const put = dynamoMock.commandCalls(PutCommand)[0].args[0].input;
    assert.equal(put.ConditionExpression, 'attribute_not_exists(orderId)');
    assert.ok(put.Item.createdAt);

    assert.equal((await getOrder(dynamo, 'c1', 'o1')).orderId, 'o1');
    assert.equal((await ordersOf(dynamo, 'c1')).length, 2);
    assert.equal(dynamoMock.commandCalls(QueryCommand)[0].args[0].input.ExpressionAttributeValues[':c'], 'c1');
  });

  it('returns null for a missing item', async () => {
    dynamoMock.on(GetCommand).resolves({});
    assert.equal(await getOrder(dynamo, 'c1', 'nope'), null);
  });
});

describe('SQS', () => {
  it('publishes JSON events', async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: 'm-1' });
    assert.equal(await publishOrderPlaced(sqs, 'https://queue', { id: 1 }), 'm-1');
    assert.deepEqual(JSON.parse(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody),
      { type: 'OrderPlaced', order: { id: 1 } });
  });

  it('deletes only successfully processed messages', async () => {
    sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [
      { Body: '{"order":{"id":1}}', ReceiptHandle: 'r1' },
      { Body: '{"order":{"id":2}}', ReceiptHandle: 'r2' },
    ] });
    sqsMock.on(DeleteMessageCommand).resolves({});
    const handled = await processBatch(sqs, 'https://queue', async (event) => {
      if (event.order.id === 2) throw new Error('payment provider down');
    });
    assert.equal(handled, 1);
    assert.deepEqual(sqsMock.commandCalls(DeleteMessageCommand).map((c) => c.args[0].input.ReceiptHandle), ['r1']);
  });
});

describe('Lambda handler', () => {
  it('maps API Gateway events to responses', async () => {
    dynamoMock.on(QueryCommand).resolves({ Items: [{ orderId: 'o1' }] });
    const handler = createHandler(dynamo);

    const ok = await handler({ pathParameters: { customerId: 'c1' } });
    assert.equal(ok.statusCode, 200);
    assert.deepEqual(JSON.parse(ok.body), [{ orderId: 'o1' }]);
    assert.equal((await handler({})).statusCode, 400);
  });

  it('hides internal errors', async () => {
    dynamoMock.on(QueryCommand).rejects(new Error('ProvisionedThroughputExceeded'));
    const res = await createHandler(dynamo)({ pathParameters: { customerId: 'c1' } });
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body, /Provisioned/);
  });
});
