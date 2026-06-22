# Crons

Every scheduled background task in liferay-one-etc-spring-boot. Each is unit-tested at the handler level (JUnit + Mockito), including idempotency. The real in-action integration coverage is tracked as journeys in flows.md.

> Auto-scaffolded from the code surface (5 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION | Scheduled task runs correctly and is idempotent: scheduledAssetObjectsCacheEviction | unit | P1 | planned | cron:scheduledAssetObjectsCacheEviction |
| CRON-SCHEDULEDCLEANUP | Scheduled task runs correctly and is idempotent: scheduledCleanUp | unit | P1 | planned | cron:scheduledCleanUp |
| CRON-SCHEDULEDDELETETICKETATTACHMENT | Scheduled task runs correctly and is idempotent: scheduledDeleteTicketAttachment | unit | P1 | planned | cron:scheduledDeleteTicketAttachment |
| CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS | Scheduled task runs correctly and is idempotent: scheduledSendExpiringLicenseKeyEmails | unit | P1 | planned | cron:scheduledSendExpiringLicenseKeyEmails |
| CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY | Scheduled task runs correctly and is idempotent: scheduledUpdateTicketAttachmentDraftCommentBody | unit | P1 | planned | cron:scheduledUpdateTicketAttachmentDraftCommentBody |
