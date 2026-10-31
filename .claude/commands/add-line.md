---
description: Record a purchase order line from an authorised source.
---

Read CLAUDE.md. Record a purchase order line from an authorised source.

1. Run `npm run deliveries -- add-line --supplier="<supplier>" --po="<PO>" --line-no="<line>" --release="0" --item="<part>" --site="<site>" --buyer="<buyer>" --quantity=10 --opened=YYYY-MM-DD --needed=YYYY-MM-DD --evidence="<source reference>" --actor="<operator>"`. Replace placeholders with known records and dates. Add --json for structured output.
2. Before a change, read the affected line or supplier and its history. Use the operator's name for --actor. Never infer receipt evidence or a buyer decision.
3. Report the result, quantities and dates in plain words. If several records match, list them and request the exact record.
4. Drafts remain in drafts/. Do not send, publish or write to an ERP.
