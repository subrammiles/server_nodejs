// SQS: a message QUEUE. The API puts work on the queue and answers fast; a worker processes it later.
// If the worker crashes, the message reappears after the visibility timeout and is retried.
import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs';

export async function publishOrderPlaced(sqs, queueUrl, order) {
  const { MessageId } = await sqs.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ type: 'OrderPlaced', order }),
  }));
  return MessageId;
}

// One polling round of a worker: receive -> handle -> delete. Delete ONLY after success.
export async function processBatch(sqs, queueUrl, handler) {
  const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: queueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 20,   // long polling: fewer empty responses
  }));
  let processed = 0;
  for (const message of Messages) {
    try {
      await handler(JSON.parse(message.Body));
      await sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }));
      processed++;
    } catch (error) {
      console.error('failed, will be retried by SQS:', error.message);   // NOT deleted: it comes back later
    }
  }
  return processed;
}
