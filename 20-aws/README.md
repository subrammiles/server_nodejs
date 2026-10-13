# 20: AWS from Node (SDK v3)

The old repo used AWS SDK **v2** (`aws-sdk`), which is end-of-life. This lesson uses **v3**: one small package per service,
and every operation is `client.send(new SomeCommand(input))`.

| File | Service | Typical use |
|---|---|---|
| `storage.js` | **S3** object storage | uploads, reports, backups, static assets |
| `orders-table.js` | **DynamoDB** NoSQL | key-value and document data at any scale |
| `order-queue.js` | **SQS** queue | background jobs, decoupling services |
| `lambda-handler.js` | **Lambda** | functions triggered by HTTP, queues, schedules |

## Concepts
- **Credentials**: never in code. The default provider chain finds env vars, `~/.aws` profiles (SSO), or the IAM **role**
  of the machine, container or Lambda. Roles are best because no keys exist to leak.
  Grant **least privilege** (only the actions and resources needed).
- Create clients **once** and reuse them. Pick the region explicitly.
- **DynamoDB design**: start from access patterns. Partition key plus sort key, `Query` (not `Scan`), and
  `ConditionExpression` to prevent overwrites. `lib-dynamodb` converts plain JS objects for you.
- **Queues**: receive, process, then **delete only after success**. Failures reappear and are retried
  (add a dead-letter queue for poison messages). Long polling with `WaitTimeSeconds`.
- **Lambda**: an exported `handler(event)` returning `{ statusCode, body }`. Deploy with SAM, CDK, Serverless Framework or Terraform.
- **Testing without AWS**: `aws-sdk-client-mock` intercepts `send()`. For integration tests, run **LocalStack**
  (`AWS_ENDPOINT_URL=http://localhost:4566`).
- Also worth knowing: SNS (pub/sub fan-out), SES (email), Secrets Manager / Parameter Store (configuration and secrets),
  S3 presigned URLs (let browsers upload directly).

## Run
```bash
node --test "20-aws/*.test.js"      # no AWS account needed
# Against LocalStack:  docker run -d -p 4566:4566 localstack/localstack
#   AWS_ENDPOINT_URL=http://localhost:4566 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test node ...
```
