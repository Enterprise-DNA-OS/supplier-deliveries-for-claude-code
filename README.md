# Supplier Deliveries for Claude Code

Keep supplier commitments, overdue parts and receipt evidence in a database you own. Ask what will miss production, what is still unconfirmed and which buyer needs to act.

## Three ways to own it

- **Do it yourself:** install the MIT-licensed base and use Claude Code, Codex, OpenCode or Cursor. Hosting and your agent subscription are separate costs.
- **We customise it:** Enterprise DNA maps your SourceDay records, changes fields and rules, connects your existing systems, and builds a web front end or a different stack when needed. One setup fee, then a retainer for ongoing work.
- **We run it for you:** Omni by Enterprise DNA installs it, manages access and backups, prepares reviews and keeps the system working. One setup fee, then a retainer.

[Book a 30-minute call with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=sourceday).

## Run the synthetic demo

Node 20 or newer. No cloud account is needed.

```sh
npm install
npm test
npm run demo
npm run deliveries -- expedite-list
npm run deliveries -- supplier-scorecard --json
npm run view
npm run docs
```

The invented demo includes a missed need date, a partial receipt, an unacknowledged line, a late promise, an overdue follow-up and a stale confirmation. Repeated seeding preserves edits. Use a new DATA_DIR for real data and never seed it. Set DATABASE_URL for PostgreSQL or leave it empty for PGlite under .data/db.

## What you own

A supplier register and an order-line ledger keyed by supplier, purchase order, line and release. Each line retains its original need date. Supplier date proposals remain pending until a buyer records acceptance or rejection. Accepted promises never rewrite the original need date.

Receipts are append-only, supported by a docket reference and checked against outstanding quantity under a row lock. Partial receipts reduce the balance. Duplicate docket references, over-receipts and future receipts are rejected. Corrections require a reviewed migration so the original evidence remains available.

Imported received balances lack receipt dates and stay outside measured on-time delivery counts. Exported promise dates do not become fresh acknowledgements. Cancelled lines keep their history. Follow-ups and promise decisions have named actors and an append-only activity record. Database owners can bypass controls; this is a trusted operator tool.

This base runs a buyer's delivery review from records. SourceDay also provides supplier interaction and connected ERP workflows. No vendor network, live ERP synchronisation, supplier portal, shipment feed, price negotiation or payment processing is included. Connections and supplier screens are work Enterprise DNA scopes for your version.

## Recurring jobs

| Command | What it does |
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
| /customise | Add a field or change a rule with a tested migration. |
| /new-view | Add a branded read-only report. |

All 28 CLI commands support --json. Flags use --name=value. /customise and /new-view are agent recipes, giving 30 slash commands in total.

## Ten questions your own records answer

1. Which parts have missed the original need date despite a revised supplier promise? (`expedite-list`)
2. Which open lines still lack a buyer-recorded supplier acknowledgement? (`acknowledgements-due`)
3. Which proposed dates are awaiting a buyer decision? (`promise-changes`)
4. How many units are still due after each partial receipt? (`lines`)
5. Which accepted commitments have gone more than a week without reconfirmation? (`stale-promises`)
6. Which follow-ups are overdue and who owns them? (`overdue`)
7. Which suppliers delivered complete lines by the original need date? (`supplier-scorecard`)
8. Which imported balances have no receipt timing evidence? (`supplier-scorecard`)
9. Which records need retention evidence or a supplier purpose review? (`compliance`)
10. Who accepted each promise and what evidence supported it? (`line`)

These are tested analyses, not a claim that SourceDay cannot answer them. Custom rules and joined history are what make an owned system different.

## Your first hour: ten things to ask for

1. Put our name, colours and logo in brand.json.
2. Show the parts that missed their original need date.
3. Show promises waiting for a buyer decision.
4. Show the outstanding balance after each partial receipt.
5. Draft the Monday review from three current reports.
6. Draft a follow-up for one named supplier.
7. Test our SourceDay export and reconcile every release.
8. Show suppliers with unknown receipt timing.
9. Add our production-job reference with a tested migration.
10. Export a private snapshot before changing any rule.

## Switch from SourceDay

[The replace guide](docs/replace-sourceday.md) covers SourceDay's documented Tab Export / View export, required columns, explicit date mapping and reconciliation. A single import command handles the selected CSV view, preserves extra fields and stores the original file. Repeating an identical import is a no-op. A changed row for an existing line is rejected rather than overwriting live work. The supplied fixture is synthetic, not a captured account export. Validate a real export before switching.

SourceDay does not publish a numeric list price on the vendor pages reviewed. [Research](docs/research.md) explains the five-figure buyer evidence and its limits without presenting it as a vendor quote or an ANZ invoice.

## Documents and views

Edit brand.json, then run npm run view for the week, supplier scorecard and record review. npm run docs writes supplier follow-up drafts, goods receipt working records and supplier promise decision records as HTML. Print to PDF for filing. Evidence fields are references; original attachments must stay in your controlled document store. Nothing sends or publishes. [Why no front end](docs/why-no-front-end.md) explains mobile and shared-screen limits.

## Compliance and operations

[Compliance](docs/compliance.md) documents the NZ retention checks and their sources. They identify missing dates and review work. They do not certify compliance or automatically delete information.

npm test uses a temporary database and output folder, exercises all CLI commands and checks quantity arithmetic, approvals, atomic imports, duplicates, date handling, exports and HTML escaping. CI is configured for Windows and Ubuntu on Node 20 and 22, plus PostgreSQL 16. Observed run results belong in the delivery report. TEST_DATABASE_URL must be an empty disposable database.

All domain tables have row-level security enabled and PUBLIC privileges removed. Use a trusted owner connection. There is no multi-tenant login system. Restrict OS and database access and protect reports and exports. export creates a new complete JSON snapshot including original imports, mapping and activity. Use native database backups too; snapshot restore is a reviewed maintenance operation, not an automated command.

## Licence

MIT. Copyright 2026 Enterprise DNA. SourceDay belongs to its owner. This independent implementation contains no vendor code or assets.
