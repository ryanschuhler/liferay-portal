# Crons & Async Subscribers

Scheduled background tasks and async Pub/Sub subscribers. Covered by a JUnit/integration test exercising the task or message handler, including idempotency.

> Auto-scaffolded from the code surface (6 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

### Crons

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION | Scheduled task runs correctly and is idempotent: scheduledAssetObjectsCacheEviction | integration | P1 | planned | cron:scheduledAssetObjectsCacheEviction |
| CRON-SCHEDULEDCLEANUP | Scheduled task runs correctly and is idempotent: scheduledCleanUp | integration | P1 | planned | cron:scheduledCleanUp |
| CRON-SCHEDULEDDELETETICKETATTACHMENT | Scheduled task runs correctly and is idempotent: scheduledDeleteTicketAttachment | integration | P1 | planned | cron:scheduledDeleteTicketAttachment |
| CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS | Scheduled task runs correctly and is idempotent: scheduledSendExpiringLicenseKeyEmails | integration | P1 | planned | cron:scheduledSendExpiringLicenseKeyEmails |
| CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY | Scheduled task runs correctly and is idempotent: scheduledUpdateTicketAttachmentDraftCommentBody | integration | P1 | planned | cron:scheduledUpdateTicketAttachmentDraftCommentBody |

### Subscribers

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER | Async subscriber processes and dedupes messages: SalesforceObjectPubsubSubscriber | integration | P0 | planned | subscriber:SalesforceObjectPubsubSubscriber |