// DynamoDB: a serverless key-value / document database. You design tables around ACCESS PATTERNS:
// here partition key = customerId, sort key = orderId, so "all orders of a customer" is one Query.
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.ORDERS_TABLE ?? 'orders';

export async function putOrder(dynamo, order) {
  await dynamo.send(new PutCommand({
    TableName: TABLE,
    Item: { ...order, createdAt: new Date().toISOString() },
    ConditionExpression: 'attribute_not_exists(orderId)',   // don't silently overwrite an existing order
  }));
}

export async function getOrder(dynamo, customerId, orderId) {
  const { Item } = await dynamo.send(new GetCommand({ TableName: TABLE, Key: { customerId, orderId } }));
  return Item ?? null;
}

export async function ordersOf(dynamo, customerId) {
  const { Items = [] } = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'customerId = :c',
    ExpressionAttributeValues: { ':c': customerId },
    ScanIndexForward: false,   // newest first (sort key descending)
  }));
  return Items;
}
