# SourceDay selection and scope

Checked 31 October 2026. Family: supplier-delivery-expediting. The registry already has procurement, supplier assurance, inventory planning and freight operations. This build owns the distinct buyer-side loop after an order is placed: acknowledge, re-promise, receive, chase and review. Neither FOSSA's licence review nor Enov8's environment coordination is reused.

## Annual bill first

USD 21,000 is the minimum SourceDay contract reported by [Vendr](https://www.vendr.com/marketplace/sourceday), with an average around USD 190,000. This is third-party observed contract evidence, not SourceDay list pricing and not a verified invoice from an NZ or AU customer. [G2's vendor-attributed pricing text](https://www.g2.com/products/sourceday-platform/pricing) also describes a five-figure entry offer. The vendor pages reviewed have no numeric public list price. The landing page therefore uses no price figure and its prices array is empty.

| Criterion | Score | Evidence and limit |
|---|---|---|
| Annual bill | 3 | Conservative score using the observed contract minimum, not the average |
| Data-shaped | 5 | Supplier, order line, promise, receipt and follow-up records |
| Our buyers | 2 | Manufacturing and distribution fit; no confirmed SourceDay buyer in local customer or CRM snapshots |
| Search demand | 3 | Alternatives and pricing results exist; no measured search volume |
| One-session buildable | 5 | Buyer review from files, no OAuth needed |
| Import exists | 4 | Vendor documents CSV view exports, account columns need checking |

Total 22/30. FreightAvex scored 17 (3,5,1,1,4,3), with weak buyer and search evidence and no verified export header contract. Spendata scored 19 (1,5,2,2,5,4) and failed the verified five-figure bill filter. Sources: [FreightAvex plans](https://freightavex.com/), [Spendata pricing](https://www.spendata.com/spendata-pricing.php). No next build is registered.

## Vendor workflow sources

- [PO Collaboration](https://sourceday.com/solutions/purchase-order-collaboration/): supplier delivery visibility, order changes and supplier performance.
- [MRP Exceptions](https://support.sourceday.com/hc/en-us/articles/13138020631956-Using-the-MRP-Exceptions-Dashboard): review of move-ins, move-outs and late-risk lines. The free base does not calculate an MRP plan.
- [Tab Export](https://support.sourceday.com/hc/en-us/articles/10179338668564-Tab-Export): CSV export of a selected view.
- [Reports overview](https://support.sourceday.com/hc/en-us/articles/9476174444564-Reports-for-PO-Collaboration-Overview): buyer and supplier reporting.
- [G2 reviews](https://www.g2.com/products/sourceday-platform/reviews): reviewers describe both benefits and supplier-adoption friction. These are opinions, not universal claims or evidence of our savings.

SourceDay's connected supplier platform is broader than this base. The build does not replicate its network, predictive models or ERP connectors. It provides an owned buyer-side operating record and a starting point for a custom replacement. Every public capability describes implemented behaviour or explicitly scoped custom work.
