# Move a SourceDay delivery register

## Export the records

SourceDay documents [Tab Export](https://support.sourceday.com/hc/en-us/articles/10179338668564-Tab-Export) and [PO reports](https://support.sourceday.com/hc/en-us/articles/9476174444564-Reports-for-PO-Collaboration-Overview). Open Reports from the buyer navigation, select the relevant dashboard view, choose CSV and run a one-time export. Download the completed report. Repeat for views needed to cover the intended scope. These references were checked on 31 October 2026.

Exports are view-specific. The vendor does not document a universal CSV header contract on those pages. The fixture illustrates supported aliases. It is not a real account extract. Check headers and a representative row before importing. Do not export only overdue lines and describe it as complete history.

## One-command import

```sh
npm run deliveries -- import sourceday --file="imports/orders.csv" --dry-run --actor="Buyer name"
npm run deliveries -- import sourceday --file="imports/orders.csv" --actor="Buyer name"
```

The first command validates every row inside a rolled-back transaction. Once counts and mappings are right, the second records the import. Existing identical files are ignored. Exact repeated source rows in overlapping views are skipped. Changed existing lines fail the whole import for reconciliation; no operational field is silently overwritten.

## Required mapping

| Field | Supported default headers | Meaning |
|---|---|---|
| supplier_code | Supplier ID, Vendor ID, Supplier Code, Vendor Code | Stable supplier identifier |
| supplier | Supplier, Supplier Name, Vendor, Vendor Name | Display name |
| po | PO Number, PO, PO #, Purchase Order | Purchase order identifier |
| line | Line, PO Line, Line Number | Line identifier, leading zeroes preserved |
| release | Release, Release Number | Release identifier; omitted means 0 |
| item | Item P/N, Item, Item Number, Part Number | Part identifier |
| quantity | Quantity, Qty, Order Quantity, Ordered Qty | Total ordered, positive |
| received | Received Qty, Quantity Received, Received | Opening received amount, explicit zero if none |
| opened | Order Date, PO Date, Created Date | Order date |
| needed | Due Date, Needed Date | Original business need date |
| site | Site/Location, Site, Location | Receiving site |
| buyer | Buyer | Responsible buyer |

Optional description, promise and status are mapped from Description / Item Description, Promise Date and Status. The opening promise is context only, never fresh acknowledgement. Unknown status values fail. Open, Pending and Acknowledged become open while outstanding quantity remains. Closed, Completed and Received must have a full received balance. Cancelled and Canceled retain their balance and are excluded from open work. Review status meanings in your account before relying on the mapping.

If your headers differ, write a private JSON object mapping field names above to your actual column names. Example: {"supplier_code":"Vendor No","needed":"Required Date"}. Pass --map=imports/columns.json. Date text must be YYYY-MM-DD, or explicitly select --date-format=mdy or --date-format=dmy for slash-formatted dates. No locale guessing.

Keep distinct releases separate. If a view omits release identifiers but the order has split schedules, include those identifiers in the export before importing. Duplicate supplier/PO/line/release identities are rejected. New suppliers receive an immediate retention-purpose review. Source rows, extra columns, mapping and original CSV are retained.

## Reconcile before switching

Compare supplier count, order-line count, release count, ordered and received quantities per item and unit. The base assumes one consistent unit per line and does not convert units. Check every outstanding balance and date against SourceDay. Check cancellations separately. Export a private snapshot and keep the original files.

Import is an initial migration, not a daily ERP sync. Supplier messages, documents, exact receipt dates, price changes, change history, units conversions, shipment tracking, RFQs and ERP connectors need separate mapping or development. Document references are not document copies. Enterprise DNA scopes these as part of your version. Keep both systems available until your buyer signs off reconciliation and the operating process. Never cancel a vendor subscription automatically.
