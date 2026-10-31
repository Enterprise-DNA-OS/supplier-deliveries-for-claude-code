---
description: Validate and import a SourceDay view CSV.
---

Read CLAUDE.md. Validate and import a SourceDay view CSV.

1. Run `npm run deliveries -- import sourceday --file="<private export.csv>" --dry-run --actor="<operator>"`. Replace placeholders with known records and dates. Add --json for structured output.
2. Before a change, read the affected line or supplier and its history. Use the operator's name for --actor. Never infer receipt evidence or a buyer decision.
3. Report the result, quantities and dates in plain words. If several records match, list them and request the exact record.
4. Drafts remain in drafts/. Do not send, publish or write to an ERP.

Read docs/replace-sourceday.md first. Check the account headers and date format, add --map when necessary, and reconcile the dry-run count. Remove --dry-run only within the operator's import instruction. Do not treat an imported promise as a new acknowledgement.
