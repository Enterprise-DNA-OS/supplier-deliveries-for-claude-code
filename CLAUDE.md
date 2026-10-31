# Supplier Deliveries for Claude Code

A buyer's desk for manufacturers and distributors: purchase order lines, supplier promises, goods receipts and expediting. The database is the source of truth.

## Operating rules

Read records before every answer or change. Ask the operator for the intended business and actor if they are not known. Run npm run deliveries -- help for accepted flags. All commands support --json. Dates are ISO YYYY-MM-DD and operational day boundaries use UTC.

Never send messages, place orders, process payments or write to an ERP. Drafts go to drafts/. Record a promise decision only on the buyer's instruction. Record receipts only from evidence of actual goods received. Retention findings are reviews, not deletion instructions. No automated sending or deletion exists.

An actor is a label, not authentication. Operate locally as a trusted user. Multi-user access needs a separate deployment design. Do not put secrets, personal data, imports, snapshots or generated reports in git. Do not seed a real working database.

## One route per job

| Job | Purpose |
|---|---|
| /suppliers | Read suppliers and their delivery position. |
| /lines | List purchase order lines, outstanding quantities and dates. |
| /expedite-list | Prioritise missing parts, late promises and unconfirmed deliveries. |
| /acknowledgements-due | Find open lines without an accepted supplier commitment. |
| /promise-changes | Read supplier proposals awaiting a buyer decision. |
| /receipts-due | Read deliveries expected in the next seven days, including overdue ones. |
| /stale-promises | Find accepted commitments last confirmed over seven days ago. |
| /supplier-scorecard | Compare open lines and completed delivery evidence by supplier. |
| /followups | Read the action list, including completed follow-ups. |
| /overdue | Find overdue follow-ups and their owners. |
| /compliance | Check retention metadata and supplier purpose reviews. |
| /activity | Read who recorded each operational change. |
| /help | Read command names and supported flags. |
| /line | Read one line with its promises, receipts and follow-ups. |
| /add-supplier | Register a supplier with an owner and a retention review date. |
| /add-line | Record a purchase order line from an authorised source. |
| /propose-promise | Record a supplier promise for buyer review. |
| /decide-promise | Accept or reject a supplier promise after the buyer instructs you. |
| /receive | Record a physical receipt from its delivery docket. |
| /log-followup | Record follow-up work with an owner and due date. |
| /close-followup | Close a follow-up with the actual outcome. |
| /cancel-line | Mark an open line cancelled without deleting its history. |
| /retention | Set a line retention date from the agreed jurisdiction policy. |
| /review-supplier | Record a reviewed purpose and next review date for supplier information. |
| /import | Validate and import a SourceDay view CSV. |
| /export | Write a complete private JSON snapshot to a new file. |
| /weekly-review | Draft Monday review from the expedite list, pending promises and overdue actions. |
| /draft-chase | Draft one supplier follow-up from the outstanding delivery records. |
| /customise | Add a tested migration, then update the import, CLI and views. |
| /new-view | Add a read-only report from existing records. |

Use partial ids or case-insensitive names. Exact code matches take precedence. Ambiguous names list candidates and exit 1. Get the exact id before continuing.

## Files

scripts/deliveries.mjs is the CLI. supabase/migrations holds numbered migrations. npm run migrate applies new migrations atomically. DATABASE_URL selects PostgreSQL, otherwise DATA_DIR selects local PGlite storage. brand.json sets document colours, logo and business name. views.json and documents.json define read-only HTML.

Read docs/replace-sourceday.md before importing. Read docs/compliance.md before interpreting checks. Run npm test after domain changes. Never modify an applied migration on a working installation.

Built and run for owners through Omni by Enterprise DNA. https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=sourceday
