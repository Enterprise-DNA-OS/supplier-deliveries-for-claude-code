# Record controls and their limits

Checked 31 October 2026. This tool checks records for a buyer; it does not certify legal compliance. Set jurisdiction and retention rules for the actual business before use. No command pays, files a tax return or deletes records.

## NZ financial records

[Inland Revenue record keeping](https://www.ird.govt.nz/managing-my-tax/record-keeping) says to retain business records for at least seven tax years, with language and offshore storage requirements. Each line has tax_year_end and retain_until. compliance flags missing dates and a retain_until earlier than seven years after the recorded tax-year end. This is a metadata check. It does not prove the tax-year date, preserve attachments, verify storage approval or evaluate extensions and legal holds. Imported records intentionally start without a made-up tax-year end. The buyer sets these through retention after checking the policy.

## Supplier personal information

[Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to the period required for a lawful purpose. Suppliers carry retention_purpose and review_on. compliance flags reviews due today or earlier. The review date is an internal policy, not a statutory period. review-supplier records the reviewed purpose and next date. Evaluate lawful purpose and financial-record obligations together. There is no automatic purge.

## Operational policies, not laws

Seven days without an accepted confirmation is the demo's stale-promise threshold. A missing acknowledgement or a promise beyond the original need date enters the expedite list. These are configurable business rules, not legislative deadlines.

Receipts need a unique docket-line reference, evidence and a date from order opening through today. Quantities cannot exceed the remaining order balance. Original need dates are retained across promise decisions. Receipt, import and activity rows are append-only through triggers. These controls support traceability but do not establish authenticity of the source evidence. Actor labels are not verified identities. A database owner can bypass controls.

## Scope outside these checks

This is not a tax, customs, product-safety or payment system. Australian operators must replace the NZ retention check with their approved Australian policy. Multi-user access, legal holds, evidence storage, backup restoration and approved disposal remain deployment responsibilities. Export snapshots include the records and original imported text, not attachment files.
