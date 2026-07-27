# Crons

Every scheduled background task in liferay-one-etc-spring-boot. Each is unit-tested at the handler level (JUnit + Mockito), including idempotency. The real in-action integration coverage is tracked as journeys in flows.md.

> Auto-scaffolded from the code surface (9 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffoldPlan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION | Scheduled task runs correctly and is idempotent: scheduledAssetObjectsCacheEviction | unit | P1 | planned | cron:scheduledAssetObjectsCacheEviction |
| CRON-SCHEDULEDCLEANUP | Scheduled task runs correctly and is idempotent: scheduledCleanUp | unit | P1 | planned | cron:scheduledCleanUp |
| CRON-SCHEDULEDDELETETICKETATTACHMENT | Scheduled task runs correctly and is idempotent: scheduledDeleteTicketAttachment | unit | P1 | planned | cron:scheduledDeleteTicketAttachment |
| CRON-SCHEDULEDPROCESSTRIALS | Drives the trial lifecycle each run: expires and notifies in-progress trials, then provisions on-hold trials as seats free; a failure in one phase is logged and the other still runs; idempotent on re-run (E04/E05, LPD-88274; E07, LPD-88259) | unit | P1 | planned | cron:scheduledProcessTrials |
| CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS | Scheduled task runs correctly and is idempotent: scheduledSendExpiringLicenseKeyEmails | unit | P1 | planned | cron:scheduledSendExpiringLicenseKeyEmails |
| CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY | Scheduled task runs correctly and is idempotent: scheduledUpdateTicketAttachmentDraftCommentBody | unit | P1 | planned | cron:scheduledUpdateTicketAttachmentDraftCommentBody |
| CRON-SYNCACCOUNTROLES | Mirrors every account role to JSM on the schedule and at application-ready; a per-role failure is logged and the loop continues; idempotent re-sync (E15, LPD-88258) | unit | P1 | planned | cron:syncAccountRoles |
| CRON-SYNCORGANIZATIONROLES | Mirrors every organization role to JSM on the schedule and at application-ready; a per-role failure is logged and the loop continues; idempotent re-sync (E15, LPD-88258) | unit | P1 | planned | cron:syncOrganizationRoles |
| CRON-SYNCPRODUCTVERSIONS | Refreshes the product version cache from the releases feed on the schedule and at application-ready; an HTTP or parse failure is logged without clobbering the last good cache (E11, LPD-88254) | unit | P2 | planned | cron:syncProductVersions |
