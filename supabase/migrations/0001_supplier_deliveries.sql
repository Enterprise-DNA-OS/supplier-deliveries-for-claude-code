CREATE TABLE imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), digest text NOT NULL UNIQUE,
 original_csv text NOT NULL, mapping jsonb NOT NULL, actor text NOT NULL CHECK(length(trim(actor))>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE suppliers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK(length(trim(code))>0),
 name text NOT NULL CHECK(length(trim(name))>0), owner text NOT NULL CHECK(length(trim(owner))>0),
 review_on date NOT NULL, retention_purpose text NOT NULL CHECK(length(trim(retention_purpose))>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), supplier_id uuid NOT NULL REFERENCES suppliers,
 po text NOT NULL CHECK(length(trim(po))>0), line_no text NOT NULL CHECK(length(trim(line_no))>0), release_no text NOT NULL DEFAULT '0',
 item text NOT NULL CHECK(length(trim(item))>0), description text NOT NULL DEFAULT '', site text NOT NULL, buyer text NOT NULL,
 ordered numeric(18,6) NOT NULL CHECK(ordered>0), opening_received numeric(18,6) NOT NULL DEFAULT 0 CHECK(opening_received>=0 AND opening_received<=ordered),
 needed_on date NOT NULL, opened_on date NOT NULL DEFAULT current_date, initial_promise date,
 cancelled boolean NOT NULL DEFAULT false, cancel_reason text,
 tax_year_end date, retain_until date, source_evidence text NOT NULL CHECK(length(trim(source_evidence))>0),
 import_id uuid REFERENCES imports, source_row jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(supplier_id,po,line_no,release_no), CHECK(needed_on>=opened_on), CHECK(NOT cancelled OR length(trim(cancel_reason))>0)
);
CREATE TABLE promises (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), line_id uuid NOT NULL REFERENCES lines,
 proposed_on date NOT NULL, evidence text NOT NULL CHECK(length(trim(evidence))>0), actor text NOT NULL,
 decision text CHECK(decision IN ('accepted','rejected')), decided_by text, decision_reason text, decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((decision IS NULL AND decided_at IS NULL AND decided_by IS NULL) OR (decision IS NOT NULL AND decided_at IS NOT NULL AND length(trim(decided_by))>0 AND length(trim(decision_reason))>0))
);
CREATE TABLE receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), line_id uuid NOT NULL REFERENCES lines,
 quantity numeric(18,6) NOT NULL CHECK(quantity>0), received_on date NOT NULL,
 reference text NOT NULL CHECK(length(trim(reference))>0), evidence text NOT NULL CHECK(length(trim(evidence))>0), actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(line_id, reference)
);
CREATE TABLE followups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), line_id uuid NOT NULL REFERENCES lines,
 note text NOT NULL CHECK(length(trim(note))>0), owner text NOT NULL CHECK(length(trim(owner))>0), due_on date NOT NULL,
 resolution text, closed_at timestamptz, actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((closed_at IS NULL AND resolution IS NULL) OR (closed_at IS NOT NULL AND length(trim(resolution))>0))
);
CREATE TABLE activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, record_id uuid NOT NULL,
 actor text NOT NULL CHECK(length(trim(actor))>0), detail jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION touch_updated() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE FUNCTION immutable_record() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'append-only record'; END $$;
CREATE FUNCTION validate_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE l lines; total numeric;
BEGIN
 SELECT * INTO l FROM lines WHERE id=NEW.line_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown line'; END IF;
 IF l.cancelled THEN RAISE EXCEPTION 'Line cancelled'; END IF;
 IF NEW.received_on>current_date OR NEW.received_on<l.opened_on THEN RAISE EXCEPTION 'Receipt date outside order history'; END IF;
 SELECT coalesce(sum(quantity),0) INTO total FROM receipts WHERE line_id=l.id;
 IF total+l.opening_received+NEW.quantity>l.ordered THEN RAISE EXCEPTION 'Receipt exceeds outstanding quantity'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER receipt_quantity BEFORE INSERT ON receipts FOR EACH ROW EXECUTE FUNCTION validate_receipt();
CREATE INDEX receipts_line ON receipts(line_id);
CREATE INDEX promises_line ON promises(line_id,decided_at);
CREATE INDEX followups_line ON followups(line_id);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['imports','suppliers','lines','promises','receipts','followups','activity'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
 EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['imports','receipts','activity'] LOOP
 EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION immutable_record()',t);
 END LOOP;
END $$;
CREATE VIEW delivery_position AS
SELECT l.*, s.name AS supplier, s.code AS supplier_code,
 l.po||'/'||l.line_no||'/'||l.release_no AS reference,
 coalesce(p.proposed_on,l.initial_promise) AS promise_on,
 p.decided_at AS acknowledged_at,
 l.opening_received+coalesce(r.quantity,0) AS received,
 l.ordered-l.opening_received-coalesce(r.quantity,0) AS outstanding,
 r.last_receipt,
 CASE WHEN l.cancelled THEN 'cancelled' WHEN l.ordered=l.opening_received+coalesce(r.quantity,0) THEN 'received' ELSE 'open' END AS status,
 coalesce(p.decided_at,l.created_at) AS last_confirmation
FROM lines l JOIN suppliers s ON s.id=l.supplier_id
LEFT JOIN LATERAL (SELECT proposed_on,decided_at FROM promises WHERE line_id=l.id AND decision='accepted' ORDER BY decided_at DESC,id DESC LIMIT 1) p ON true
LEFT JOIN LATERAL (SELECT sum(quantity) AS quantity,max(received_on) AS last_receipt FROM receipts WHERE line_id=l.id) r ON true;
CREATE VIEW expedite_queue AS
SELECT id,supplier_id,reference,supplier,item,site,buyer,outstanding,needed_on,promise_on,
 (needed_on<current_date) AS overdue,
 CASE WHEN needed_on<current_date THEN 'need date missed'
 WHEN promise_on>needed_on THEN 'promise beyond need'
 WHEN acknowledged_at IS NULL THEN 'acknowledgement missing'
 WHEN last_confirmation<now()-interval '7 days' THEN 'confirmation stale'
 ELSE 'on plan' END AS reason
FROM delivery_position WHERE status='open';
CREATE VIEW supplier_scorecard AS
SELECT s.id,s.code,s.name,s.owner,
 count(d.id) FILTER(WHERE d.status='open')::integer AS open_lines,
 count(d.id) FILTER(WHERE d.status='open' AND d.needed_on<current_date)::integer AS overdue_lines,
 count(d.id) FILTER(WHERE d.status='open' AND d.promise_on>d.needed_on)::integer AS late_promises,
 count(d.id) FILTER(WHERE d.status='received' AND d.opening_received=0)::integer AS measured_deliveries,
 count(d.id) FILTER(WHERE d.status='received' AND d.opening_received=0 AND d.last_receipt<=d.needed_on)::integer AS on_time_deliveries,
 count(d.id) FILTER(WHERE d.opening_received>0)::integer AS timing_unknown_lines
FROM suppliers s LEFT JOIN delivery_position d ON d.supplier_id=s.id GROUP BY s.id,s.code,s.name,s.owner;
CREATE VIEW compliance_findings AS
SELECT id AS record_id,'supplier retention review' AS rule,name AS record,'Review supplier personal information purpose and retention' AS finding FROM suppliers WHERE review_on<=current_date
UNION ALL SELECT id,'NZ tax retention evidence',po||'/'||line_no,'Record tax year end and retention date, or document another jurisdiction policy' FROM lines WHERE tax_year_end IS NULL OR retain_until IS NULL
UNION ALL SELECT id,'NZ tax minimum',po||'/'||line_no,'Retention date is earlier than seven years after the recorded tax year end' FROM lines WHERE retain_until<(tax_year_end+interval '7 years')::date
UNION ALL SELECT id,'retention review due',po||'/'||line_no,'Review retention purpose and legal holds before any disposal' FROM lines WHERE retain_until<=current_date;
