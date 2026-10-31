INSERT INTO suppliers(id,code,name,owner,review_on,retention_purpose) VALUES
('10000000-0000-0000-0000-000000000001','KORU','Koru Components','Mira',current_date-10,'Purchase order contacts'),
('10000000-0000-0000-0000-000000000002','SOUTH','Southern Fasteners','Casey',current_date+90,'Purchase order contacts'),
('10000000-0000-0000-0000-000000000003','KORUP','Koru Packaging','Mira',current_date+60,'Purchase order contacts') ON CONFLICT DO NOTHING;
INSERT INTO lines(id,supplier_id,po,line_no,item,description,site,buyer,ordered,opening_received,opened_on,needed_on,initial_promise,source_evidence,tax_year_end,retain_until) VALUES
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','PO-4100','10','SEAL-40','Food-grade seal','Auckland','Mira',100,0,current_date-30,current_date-3,current_date-1,'Synthetic PO 4100',date_trunc('year',current_date)::date+interval '1 year'-interval '1 day',date_trunc('year',current_date)::date+interval '8 years'-interval '1 day'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','PO-4100','20','VALVE-8','Pressure valve','Auckland','Mira',20,0,current_date-20,current_date+4,NULL,'Synthetic PO 4100',NULL,NULL),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','PO-4200','10','BOLT-M8','Coated bolts','Hamilton','Casey',500,0,current_date-20,current_date+2,current_date+5,'Synthetic PO 4200',NULL,NULL),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','PO-4190','10','NUT-M8','Lock nuts','Hamilton','Casey',100,0,current_date-25,current_date-1,current_date-2,'Synthetic PO 4190',NULL,NULL),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','PO-4300','10','BOX-12','Dispatch carton','Auckland','Mira',200,50,current_date-20,current_date+8,current_date+7,'Synthetic imported opening quantity',NULL,NULL) ON CONFLICT DO NOTHING;
INSERT INTO promises(id,line_id,proposed_on,evidence,actor,decision,decided_by,decision_reason,decided_at,created_at) VALUES
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',current_date-1,'Synthetic supplier reply','Mira','accepted','Mira','Recorded supplier commitment',now()-interval '12 days',now()-interval '12 days'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003',current_date+5,'Synthetic supplier reply','Casey','accepted','Casey','Escalate missing production date',now(),now()),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000005',current_date+7,'Synthetic supplier reply','Mira','accepted','Mira','Recorded supplier commitment',now()-interval '10 days',now()-interval '10 days'),
('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001',current_date+3,'Synthetic proposed revision','Mira',NULL,NULL,NULL,NULL,now()) ON CONFLICT DO NOTHING;
INSERT INTO receipts(id,line_id,quantity,received_on,reference,evidence,actor)
SELECT '40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',40,current_date-5,'GR-101','Synthetic delivery docket','Mira'
WHERE NOT EXISTS(SELECT 1 FROM receipts WHERE id='40000000-0000-0000-0000-000000000001');
INSERT INTO receipts(id,line_id,quantity,received_on,reference,evidence,actor)
SELECT '40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004',100,current_date-2,'GR-102','Synthetic delivery docket','Casey'
WHERE NOT EXISTS(SELECT 1 FROM receipts WHERE id='40000000-0000-0000-0000-000000000002');
INSERT INTO followups(id,line_id,note,owner,due_on,actor) VALUES
('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Get a split delivery date for remaining seals','Mira',current_date-1,'Mira'),
('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','Review alternate batch for production','Casey',current_date+1,'Casey') ON CONFLICT DO NOTHING;
