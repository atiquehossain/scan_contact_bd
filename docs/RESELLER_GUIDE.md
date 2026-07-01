# NoNumQR Reseller Guide

1. Login as a user.
2. Apply from the reseller panel.
3. Admin approves the reseller profile.
4. Admin allocates inventory through a reseller batch.
5. Each batch has a unique `batchCode` and a fixed set of pending QR tags.
6. Reseller sees assigned batches through `GET /reseller/batches`.
7. Reseller assigns only tags allocated to their approved reseller account.
8. Reseller assigns tags to customers by mobile number.
9. When all tags in a batch are assigned, the batch is marked `CLOSED`.
10. Commissions and payout requests are tracked in the reseller module.

Important inventory rule:

- A loose text batch code is not enough to claim a tag.
- The QR tag must be linked to the reseller through `resellerId` and, for new allocations, `resellerBatchId`.
- Cancelled or closed batches cannot be used for new assignments.
