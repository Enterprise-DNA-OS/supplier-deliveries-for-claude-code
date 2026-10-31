---
description: Set a line retention date from the agreed jurisdiction policy.
---

Read CLAUDE.md. Set a line retention date from the agreed jurisdiction policy.

1. Run `npm run deliveries -- retention --line="<line>" --tax-year-end=YYYY-MM-DD --retain-until=YYYY-MM-DD --actor="<operator>"`. Replace placeholders with known records and dates. Add --json for structured output.
2. Before a change, read the affected line or supplier and its history. Use the operator's name for --actor. Never infer receipt evidence or a buyer decision.
3. Report the result, quantities and dates in plain words. If several records match, list them and request the exact record.
4. Drafts remain in drafts/. Do not send, publish or write to an ERP.
