# ADR-002: Use SQS for Async Notifications

## Status

Accepted

## Context

Sending email notifications synchronously in the API request path increases latency and couples the API to email infrastructure. Failures in the email service should not fail task creation.

## Decision

Use **AWS SQS** as a message queue. The Backend publishes a message after creating a task; the Worker consumes it asynchronously and sends the email.

## Consequences

**Positive:**
- Decoupled services — email failures don't affect API availability
- Messages are durable (configurable retention)
- Dead-letter queue captures failed messages for inspection
- Easy to scale the Worker independently

**Negative:**
- Eventual consistency — notifications may be delayed by seconds
- Adds operational complexity (DLQ monitoring required)
