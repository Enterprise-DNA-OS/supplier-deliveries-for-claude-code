---
description: Accept or reject a supplier promise after the buyer instructs you.
---

Read CLAUDE.md. Accept or reject a supplier promise after the buyer instructs you.

1. Run `npm run deliveries -- decide-promise --promise="<id>" --decision=accepted --reason="<buyer reason>" --actor="<operator>"`. Replace placeholders with known records and dates. Add --json for structured output.
2. Before a change, read the affected line or supplier and its history. Use the operator's name for --actor. Never infer receipt evidence or a buyer decision.
3. Report the result, quantities and dates in plain words. If several records match, list them and request the exact record.
4. Drafts remain in drafts/. Do not send, publish or write to an ERP.

Use --decision=rejected to reject. An accepted date records the supplier commitment locally. It does not change the original need date or update an external order.
