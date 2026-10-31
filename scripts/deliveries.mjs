#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const reads = {
 suppliers: 'SELECT * FROM supplier_scorecard ORDER BY name',
 lines: 'SELECT id,reference,supplier,item,site,buyer,ordered,received,outstanding,needed_on,promise_on,status FROM delivery_position ORDER BY needed_on,reference',
 'expedite-list': "SELECT reference,supplier,item,outstanding,needed_on,promise_on,reason FROM expedite_queue WHERE reason<>'on plan' ORDER BY overdue DESC,needed_on,reference",
 'acknowledgements-due': "SELECT reference,supplier,item,buyer,needed_on FROM delivery_position WHERE status='open' AND acknowledged_at IS NULL ORDER BY needed_on,reference",
 'promise-changes': "SELECT p.id,d.reference,d.supplier,d.needed_on,d.promise_on AS current_promise,p.proposed_on,p.evidence,p.actor FROM promises p JOIN delivery_position d ON d.id=p.line_id WHERE p.decision IS NULL ORDER BY p.created_at,p.id",
 'receipts-due': "SELECT reference,supplier,item,outstanding,needed_on,promise_on FROM delivery_position WHERE status='open' AND coalesce(promise_on,needed_on)<=current_date+7 ORDER BY coalesce(promise_on,needed_on),reference",
 'stale-promises': "SELECT reference,supplier,buyer,promise_on,last_confirmation FROM delivery_position WHERE status='open' AND acknowledged_at IS NOT NULL AND last_confirmation<now()-interval '7 days' ORDER BY last_confirmation,reference",
 'supplier-scorecard': 'SELECT code,name,open_lines,overdue_lines,late_promises,measured_deliveries,on_time_deliveries,timing_unknown_lines FROM supplier_scorecard ORDER BY name',
 'followups': "SELECT f.id,d.reference,d.supplier,f.note,f.owner,f.due_on,f.closed_at,f.resolution FROM followups f JOIN delivery_position d ON d.id=f.line_id ORDER BY f.due_on,f.id",
 'overdue': "SELECT d.reference,d.supplier,f.note,f.owner,f.due_on FROM followups f JOIN delivery_position d ON d.id=f.line_id WHERE f.closed_at IS NULL AND f.due_on<current_date ORDER BY f.due_on,f.id",
 'compliance': 'SELECT * FROM compliance_findings ORDER BY rule,record',
 'activity': 'SELECT kind,record_id,actor,detail,created_at FROM activity ORDER BY created_at,id',
};
const options = {
 ...Object.fromEntries(Object.keys(reads).map(c=>[c,[]])),
 help: [], line:['line'],
 'add-supplier':['code','name','owner','review','purpose','actor'],
 'add-line':['supplier','po','line-no','release','item','description','site','buyer','quantity','opened','needed','evidence','tax-year-end','retain-until','actor'],
 'propose-promise':['line','date','evidence','actor'],
 'decide-promise':['promise','decision','reason','actor'],
 'receive':['line','quantity','date','reference','evidence','actor'],
 'log-followup':['line','note','owner','due','actor'],
 'close-followup':['followup','resolution','actor'],
 'cancel-line':['line','reason','actor'],
 'retention':['line','tax-year-end','retain-until','actor'],
 'review-supplier':['supplier','review','purpose','actor'],
 import:['file','map','date-format','dry-run','actor'], export:['out'],
 'weekly-review':[], 'draft-chase':['supplier']
};
export const commands=Object.keys(options);
export function parse(argv){
 const args=[...argv];const cmd=args.shift()||'help';if(!options[cmd])throw Error(`Unknown command ${cmd}`);
 const flags={},positionals=[];
 for(const a of args){
  if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(![...options[cmd],'json'].includes(k))throw Error(`Unknown option --${k}`);if(k in flags)throw Error(`Duplicate option --${k}`);if(['json','dry-run'].includes(k)){if(i>=0)throw Error(`--${k} takes no value`);flags[k]=true;}else{if(i<0)throw Error(`Use --${k}=value`);flags[k]=a.slice(i+1);}}
  else positionals.push(a);
 }
 if(positionals.length && !(cmd==='import'&&positionals.length===1&&positionals[0]==='sourceday'))throw Error('Unexpected positional argument');
 if(cmd==='import'&&positionals[0]!=='sourceday')throw Error('Use import sourceday --file=...');
 return {cmd,flags,positionals};
}
const need=(f,k)=>{const v=String(f[k]??'').trim();if(!v)throw Error(`Missing --${k}`);return v;};
export function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s))||!Number.isFinite(Date.parse(s))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error(`Use a valid ISO date: ${s}`);return s;}
const qty=s=>{if(!/^\d{1,12}(\.\d{1,6})?$/.test(String(s))||Number(s)<=0)throw Error('Quantity must be positive, at most six decimals');return String(s);};
const today=()=>new Date().toISOString().slice(0,10);
const show=rows=>{if(!Array.isArray(rows))return JSON.stringify(rows,null,2);if(!rows.length)return '(none)';return table(rows,Object.keys(rows[0]).map(key=>({key,label:key.replaceAll('_',' '),format:v=>{if(v==null)return '';if(key==='id'||key==='record_id')return String(v).slice(0,8);if(typeof v==='object')return JSON.stringify(v);if(/^\d+\.\d+$/.test(String(v)))return String(v).replace(/0+$/,'').replace(/\.$/,'');return v;}})));};
async function resolve(db,kind,term){
 const specs={supplier:['suppliers','name','code'],line:['delivery_position','reference','reference'],promise:['promises','evidence','evidence'],followup:['followups','note','note']};
 const [from,label,code]=specs[kind];const rows=await db.query(`SELECT id,${label} AS name,${code} AS code FROM ${from} ORDER BY ${label},id`);
 const q=String(term).toLowerCase();let hits=rows.filter(r=>r.id===q||r.code.toLowerCase()===q||r.name.toLowerCase()===q);
 if(!hits.length)hits=rows.filter(r=>r.id.startsWith(q)||r.name.toLowerCase().includes(q));
 if(hits.length!==1)throw Error(`${hits.length?'Ambiguous':'No match'} ${kind}: ${term}\n${show(hits.length?hits:rows)}`);
 return hits[0].id;
}
async function event(db,kind,id,actor,detail){await db.query('INSERT INTO activity(kind,record_id,actor,detail) VALUES($1,$2,$3,$4)',[kind,id,actor,JSON.stringify(detail)]);}
async function transaction(db,fn,dry=false){await db.exec('BEGIN');try{const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function openLine(db,ref){const id=await resolve(db,'line',ref);const [l]=await db.query('SELECT * FROM lines WHERE id=$1 FOR UPDATE',[id]);const [p]=await db.query('SELECT * FROM delivery_position WHERE id=$1',[id]);if(p.status!=='open')throw Error(`Line is ${p.status}`);return {...l,outstanding:p.outstanding};}
async function addLine(db,f,extra={}){
 const sid=await resolve(db,'supplier',need(f,'supplier'));const opened=date(need(f,'opened')),needed=date(need(f,'needed'));if(opened>today())throw Error('Opened date cannot be in the future');
 const tax=f['tax-year-end']?date(f['tax-year-end']):null,retain=f['retain-until']?date(f['retain-until']):null;
 const [l]=await db.query(`INSERT INTO lines(supplier_id,po,line_no,release_no,item,description,site,buyer,ordered,opened_on,needed_on,source_evidence,tax_year_end,retain_until,opening_received,initial_promise,import_id,source_row,cancelled,cancel_reason)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,[sid,need(f,'po'),need(f,'line-no'),f.release||'0',need(f,'item'),f.description||'',need(f,'site'),need(f,'buyer'),qty(need(f,'quantity')),opened,needed,need(f,'evidence'),tax,retain,extra.received||'0',extra.promise||null,extra.importId||null,JSON.stringify(extra.raw||{}),extra.cancelled||false,extra.cancelled?'Imported cancelled state':null]);
 return l;
}
const aliases={
 supplier_code:['Supplier ID','Vendor ID','Supplier Code','Vendor Code'],supplier:['Supplier','Supplier Name','Vendor','Vendor Name'],
 po:['PO Number','PO','PO #','Purchase Order'],line:['Line','PO Line','Line Number'],release:['Release','Release Number'],
 item:['Item P/N','Item','Item Number','Part Number'],description:['Description','Item Description'],site:['Site/Location','Site','Location'],buyer:['Buyer'],
 quantity:['Quantity','Qty','Order Quantity','Ordered Qty'],received:['Received Qty','Quantity Received','Received'],
 opened:['Order Date','PO Date','Created Date'],needed:['Due Date','Needed Date'],promise:['Promise Date'],status:['Status']
};
function sourceDate(s,format){if(!s)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(s))return date(s);const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);if(!m||!['mdy','dmy'].includes(format))throw Error('Non-ISO source dates require --date-format=mdy or dmy');return date(`${m[3]}-${(format==='mdy'?m[1]:m[2]).padStart(2,'0')}-${(format==='mdy'?m[2]:m[1]).padStart(2,'0')}`);}
async function importCsv(db,f){
 const original=fs.readFileSync(need(f,'file'),'utf8');const rows=parseCsv(original);if(!rows.length)throw Error('CSV has no data rows');
 const map=f.map?JSON.parse(fs.readFileSync(f.map,'utf8')):{};for(const [k,v]of Object.entries(map)){if(!aliases[k]||typeof v!=='string'||!Object.hasOwn(rows[0],v))throw Error(`Invalid mapping ${k}`);}
 if(f['date-format']&&!['mdy','dmy','iso'].includes(f['date-format']))throw Error('date-format must be iso, mdy or dmy');
 const actor=need(f,'actor');const mapping={columns:map,date_format:f['date-format']||'iso'};const digest=createHash('sha256').update(original+JSON.stringify(mapping)).digest('hex');
 const existing=await db.query('SELECT id FROM imports WHERE digest=$1',[digest]);if(existing.length)return {already_imported:true,id:existing[0].id};
 const get=(r,k)=>String(map[k]?r[map[k]]:pick(r,...aliases[k])).trim();
 return transaction(db,async()=>{
  const [imp]=await db.query('INSERT INTO imports(digest,original_csv,mapping,actor) VALUES($1,$2,$3,$4) RETURNING id',[digest,original,JSON.stringify(mapping),actor]);let skipped=0,inserted=0;const keys=new Set();
  for(const row of rows){
   const code=get(row,'supplier_code'),name=get(row,'supplier');if(!code||!name)throw Error('Supplier ID and Supplier name required');
   const po=get(row,'po'),line=get(row,'line'),rel=get(row,'release')||'0';const key=JSON.stringify([code,po,line,rel]);if(keys.has(key))throw Error('Duplicate PO line and release in CSV');keys.add(key);
   const received=get(row,'received');if(!/^\d{1,12}(\.\d{1,6})?$/.test(received))throw Error('Received quantity required, including explicit zero');
   const status=get(row,'status').toLowerCase();if(!['open','pending','acknowledged','closed','completed','received','cancelled','canceled',''].includes(status))throw Error(`Unmapped status: ${status}`);
   const amount=qty(get(row,'quantity'));if(['closed','completed','received'].includes(status)&&Number(received)!==Number(amount))throw Error('Closed line quantity is not fully received');
   let [supplier]=await db.query('SELECT * FROM suppliers WHERE code=$1',[code]);
   if(supplier&&supplier.name!==name)throw Error('Supplier name differs from registered code');
   if(!supplier){[supplier]=await db.query("INSERT INTO suppliers(code,name,owner,review_on,retention_purpose) VALUES($1,$2,$3,current_date,$4) RETURNING *",[code,name,get(row,'buyer')||actor,'Imported purchase order contacts; review purpose']);}
   const [prior]=await db.query('SELECT * FROM lines WHERE supplier_id=$1 AND po=$2 AND line_no=$3 AND release_no=$4',[supplier.id,po,line,rel]);
   if(prior){if(JSON.stringify(prior.source_row,Object.keys(prior.source_row).sort())===JSON.stringify(row,Object.keys(row).sort())){skipped++;continue;}throw Error('Existing line would be overwritten. Reconcile changes with the CLI before importing.');}
   const l=await addLine(db,{supplier:supplier.id,po,'line-no':line,release:rel,item:get(row,'item'),description:get(row,'description'),site:get(row,'site'),buyer:get(row,'buyer'),quantity:amount,opened:sourceDate(get(row,'opened'),f['date-format']),needed:sourceDate(get(row,'needed'),f['date-format']),evidence:`SourceDay CSV import ${imp.id}`},{received,promise:sourceDate(get(row,'promise'),f['date-format']),importId:imp.id,raw:row,cancelled:['cancelled','canceled'].includes(status)});
   await event(db,'import-line',l.id,actor,{import_id:imp.id});inserted++;
  }
  return {imported:inserted,skipped,rows:rows.length,dry_run:!!f['dry-run'],id:imp.id};
 },!!f['dry-run']);
}
function writePrivate(folder,name,content){const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,folder);fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,name);fs.writeFileSync(file,content,{flag:'wx',mode:0o600});return file;}
export async function run(db,cmd,f={}){
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='help')return commands.map(command=>({command,options:options[command].map(x=>'--'+x).join(' ')}));
 if(cmd==='line'){const id=await resolve(db,'line',need(f,'line'));return {line:(await db.query('SELECT * FROM delivery_position WHERE id=$1',[id]))[0],promises:await db.query('SELECT * FROM promises WHERE line_id=$1 ORDER BY created_at,id',[id]),receipts:await db.query('SELECT * FROM receipts WHERE line_id=$1 ORDER BY received_on,id',[id]),followups:await db.query('SELECT * FROM followups WHERE line_id=$1 ORDER BY due_on,id',[id])};}
 if(cmd==='import')return importCsv(db,f);
 if(cmd==='export'){
  const records=await transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');const out={};for(const t of ['suppliers','lines','promises','receipts','followups','imports','activity','schema_migrations'])out[t]=await db.query(`SELECT * FROM ${t} ORDER BY ${t==='schema_migrations'?'name':'id'}`);return out;});
  const out=path.resolve(need(f,'out'));fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,JSON.stringify({version:1,exported_at:new Date().toISOString(),records},null,2)+'\n',{flag:'wx',mode:0o600});return {file:out};
 }
 if(cmd==='weekly-review'||cmd==='draft-chase'){
  let body='# Supplier delivery review\n\nDraft for internal review. Nothing sent.\n';
  if(cmd==='weekly-review'){for(const c of ['expedite-list','promise-changes','overdue'])body+=`\n## ${c}\n\n${show(await run(db,c))}\n`;}
  else{const id=await resolve(db,'supplier',need(f,'supplier'));const [s]=await db.query('SELECT * FROM suppliers WHERE id=$1',[id]);body=`# Draft supplier follow-up: ${s.name}\n\nPlease confirm the outstanding quantities and delivery dates below. This is a draft and has not been sent.\n\n${show(await db.query("SELECT reference,item,outstanding,needed_on,promise_on,reason FROM expedite_queue WHERE supplier_id=$1 ORDER BY needed_on,reference",[id]))}\n`;}
  return {file:writePrivate('drafts',`${cmd}-${randomUUID()}.md`,body)};
 }
 if(!options[cmd])throw Error(`Unknown command ${cmd}`);
 const actor=need(f,'actor');
 return transaction(db,async()=>{
  let result;
  if(cmd==='add-supplier'){
   [result]=await db.query('INSERT INTO suppliers(code,name,owner,review_on,retention_purpose) VALUES($1,$2,$3,$4,$5) RETURNING *',[need(f,'code'),need(f,'name'),need(f,'owner'),date(need(f,'review')),need(f,'purpose')]);
  }else if(cmd==='add-line'){result=await addLine(db,f);
  }else if(cmd==='propose-promise'){
   const l=await openLine(db,need(f,'line'));const proposed=date(need(f,'date'));if(proposed<l.opened_on)throw Error('Promise precedes order');
   [result]=await db.query('INSERT INTO promises(line_id,proposed_on,evidence,actor) VALUES($1,$2,$3,$4) RETURNING *',[l.id,proposed,need(f,'evidence'),actor]);
  }else if(cmd==='decide-promise'){
   const id=await resolve(db,'promise',need(f,'promise'));const [initial]=await db.query('SELECT * FROM promises WHERE id=$1',[id]);
   await openLine(db,initial.line_id);const [p]=await db.query('SELECT * FROM promises WHERE id=$1 FOR UPDATE',[id]);if(p.decision)throw Error('Promise already decided');
   const decision=need(f,'decision');if(!['accepted','rejected'].includes(decision))throw Error('decision must be accepted or rejected');
   [result]=await db.query('UPDATE promises SET decision=$1,decided_by=$2,decision_reason=$3,decided_at=clock_timestamp() WHERE id=$4 RETURNING *',[decision,actor,need(f,'reason'),id]);
  }else if(cmd==='receive'){
   const l=await openLine(db,need(f,'line'));[result]=await db.query('INSERT INTO receipts(line_id,quantity,received_on,reference,evidence,actor) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[l.id,qty(need(f,'quantity')),date(need(f,'date')),need(f,'reference'),need(f,'evidence'),actor]);
  }else if(cmd==='log-followup'){
   const l=await openLine(db,need(f,'line'));[result]=await db.query('INSERT INTO followups(line_id,note,owner,due_on,actor) VALUES($1,$2,$3,$4,$5) RETURNING *',[l.id,need(f,'note'),need(f,'owner'),date(need(f,'due')),actor]);
  }else if(cmd==='close-followup'){
   const id=await resolve(db,'followup',need(f,'followup'));const [fup]=await db.query('SELECT * FROM followups WHERE id=$1 FOR UPDATE',[id]);if(fup.closed_at)throw Error('Follow-up already closed');[result]=await db.query('UPDATE followups SET resolution=$1,closed_at=now() WHERE id=$2 RETURNING *',[need(f,'resolution'),id]);
  }else if(cmd==='cancel-line'){
   const l=await openLine(db,need(f,'line'));[result]=await db.query('UPDATE lines SET cancelled=true,cancel_reason=$1 WHERE id=$2 RETURNING *',[need(f,'reason'),l.id]);
  }else if(cmd==='retention'){
   const id=await resolve(db,'line',need(f,'line'));[result]=await db.query('UPDATE lines SET tax_year_end=$1,retain_until=$2 WHERE id=$3 RETURNING *',[date(need(f,'tax-year-end')),date(need(f,'retain-until')),id]);
  }else if(cmd==='review-supplier'){
   const id=await resolve(db,'supplier',need(f,'supplier'));[result]=await db.query('UPDATE suppliers SET review_on=$1,retention_purpose=$2 WHERE id=$3 RETURNING *',[date(need(f,'review')),need(f,'purpose'),id]);
  }
  await event(db,cmd,result.id,actor,f);return result;
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const {cmd,flags}=parse(process.argv.slice(2));db=await getDb();const result=await run(db,cmd,flags);console.log(flags.json?JSON.stringify(result,null,2):show(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
