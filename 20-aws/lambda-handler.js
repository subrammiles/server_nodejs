// AWS Lambda: run a function per event, no servers to manage (the old repo's serverless examples).
// This handler serves GET /orders/{customerId} behind API Gateway (HTTP API, payload v2).
import { dynamo } from './clients.js';
import { ordersOf } from './orders-table.js';

export function createHandler(db = dynamo) {
  return async (event) => {
    const customerId = event.pathParameters?.customerId;
    if (!customerId) return json(400, { error: 'customerId is required' });
    try {
      return json(200, await ordersOf(db, customerId));
    } catch (error) {
      console.error(error);   // goes to CloudWatch Logs
      return json(500, { error: 'Internal Server Error' });
    }
  };
}

// Lambda looks for this export (configured as "lambda-handler.handler")
export const handler = createHandler();

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
