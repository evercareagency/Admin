#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  if(start < 0)return '';
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  return '';
}

assert.ok(html.includes('v=nursenb1'), 'nursenb1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admin-build meta');
assert.ok(html.includes('v=bcast1'), 'bcast1 marker');
assert.ok(html.includes('v=nursespd2'), 'nursespd2 marker');
assert.ok(html.includes('v=nursespd1'), 'nursespd1 single-flight UX stays');
assert.ok(html.includes('v=sched1'), 'schedule marker stays');
assert.ok(html.includes('v=warmoff1'), 'warmoff1 marker stays');
assert.ok(html.includes('v=adminpw1'), 'adminpw1 marker stays');
assert.ok(html.includes('Still loading from Sheets…'), 'slow copy stays');
assert.ok(/NCI_COMPLETE_LIST_TTL_MS=5\*60\*1000/.test(html), 'completes cache ttl stays');
assert.ok(html.includes("sbRestRpc('list_schedule_week'"), 'schedule week RPC stays');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const schedSrc = html.slice(schedStart, schedEnd);
assert.ok(schedStart > 0 && schedEnd > schedStart, 'schedule block stays');
assert.ok(!/list_new_client_intakes|save_new_client_intake|supervisory_contacts/.test(schedSrc), 'schedule block is unchanged by nurse cut');

const sendBroadcast = extractFn(html, 'async function sendBroadcast()') || extractFn(html, 'function sendBroadcast()');
assert.ok(sendBroadcast.includes("sbRestRpc('send_broadcast'"), 'broadcast send uses Ace on cut ON');
assert.ok(sendBroadcast.includes("localStorage.setItem('broadcast_msg'"), 'broadcast rollback keeps localStorage');
assert.ok(!/SHEETS_URL/.test(sendBroadcast), 'broadcast has no Sheets /exec');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
const sheetsUrl = (html.match(/const SHEETS_URL='([^']+)'/) || [])[1];
const orgId = '4f97f4d3-6635-4544-904c-6b06aa02d40b';

const sigs = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'function sbIsSupervisoryAction(action)',
  'function sbUuid(v)',
  'function sbScTextDate(val)',
  'function sbScContactMs(raw)',
  'function sbScYes(v)',
  'function sbFirstRow(data)',
  'function sbMapSupervisoryContact(row)',
  'function sbScPayloadFromSave(payload)',
  'function sbScSaveBody(payload, orgId, isCreate)',
  'function sbScKeepRow(row, payload)',
  'async function sbRestGet(table, pairs, refreshed)',
  'async function sbRestWrite(method, table, pairs, body, refreshed)',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed)',
  'async function sbRestRpc(fnName, body)',
  'function sbIsNurseIntakeAction(action)',
  'function sbAsJsonObject(v)',
  'function sbRpcNode(data)',
  'function sbRpcError(node)',
  'function sbIntakePick(row)',
  'function sbMapIntakeRow(row)',
  'function sbIntakeListRows(node)',
  'function sbIntakePacket(payload)',
  'function sbIntakeOk(node, fallback)',
  'async function sbNurseIntakeDispatch(payload)',
  'function sbSupervisoryRpcRows(node)',
  'async function sbListSupervisoryContactsRpc(payload)',
  'async function sbArchiveSupervisoryContactRpc(payload)',
  'async function sbSupervisoryList(payload)',
  'async function sbSupervisoryGet(payload)',
  'async function sbSupervisorySave(payload)',
  'async function sbSupervisoryArchive(payload)',
  'async function sbSupervisoryPdf(payload)',
  'async function sbApiSupervisory(payload)',
  'async function sbNurseSupervisoryDispatch(payload)',
  'async function apiPost(payload)'
];
const fns = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');
const keysLine = (html.match(/var SB_SC_PAYLOAD_KEYS=\[[^\]]+\];/) || [])[0];
assert.ok(keysLine, 'supervisory payload keys');

function harness(opts){
  const calls = [];
  const mem = Object.assign({}, opts.storage || {});
  const queue = (opts.responses || []).slice();
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    SHEETS_URL: sheetsUrl,
    GAS_HEADERS: {'Content-Type':'text/plain;charset=utf-8'},
    SB_SESSION_KEY: 'evercare_sb_session',
    SB_PDF_BUCKET: 'evercare-pdfs',
    SB_PDF_SIGN_SECONDS: 120,
    location: {search: opts.search || ''},
    currentAdminRole: opts.role || null,
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    window: {},
    fetch: function(url, init){
      calls.push({url: String(url), init: init || {}});
      const next = queue.length ? queue.shift() : {status:200, raw:'[]'};
      return Promise.resolve({
        ok: (next.status || 200) < 400,
        status: next.status || 200,
        text: function(){return Promise.resolve(next.raw == null ? '' : next.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    Date: Date,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
    Array: Array,
    Number: Number,
    isNaN: isNaN,
    sbRefreshSession: async function(){return null;}
  };
  if(opts.session){
    mem.evercare_sb_session = JSON.stringify(opts.session);
    box.window.__sbSession = opts.session;
  }
  vm.createContext(box);
  vm.runInContext(keysLine + '\n' + fns, box);
  return {box: box, calls: calls};
}

const session = {
  access_token: 'office-jwt',
  refresh_token: 'refresh-1',
  user: {id: 'nurse-uid', email: 'nurse@roles.evercare.local'},
  email: 'nurse@roles.evercare.local',
  profile: {id: 'nurse-uid', org_id: orgId, role: 'nurse', display_name: 'Ada Nurse'}
};

function bodyOf(call){
  return JSON.parse(call.init.body || '{}');
}

(async function(){
  const sheets = harness({search:'?sheets=1', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({success:true, data:[{intakeId:'9', status:'Complete', clientName:'Sheets'}]})}
  ]});
  const sheetsList = await sheets.box.apiPost({action:'list_new_client_intakes', status:'Complete'});
  assert.strictEqual(sheets.calls.length, 1, 'rollback is one call');
  assert.strictEqual(sheets.calls[0].url, sheetsUrl, 'rollback Completes stay on /exec');
  assert.deepStrictEqual(bodyOf(sheets.calls[0]), {action:'list_new_client_intakes', status:'Complete'});
  assert.strictEqual(sheetsList.success, true);
  assert.strictEqual(sheetsList.data[0].clientName, 'Sheets');

  const stored = harness({
    search:'',
    role:'Nurse',
    storage:{evercare_sheets:'1'},
    session:session,
    responses:[{status:200, raw:JSON.stringify({success:true, data:[]})}]
  });
  await stored.box.apiPost({action:'get_new_client_intake', intakeId:'9', includeSignatures:true});
  assert.strictEqual(stored.calls[0].url, sheetsUrl, 'evercare_sheets keeps get on /exec');
  assert.strictEqual(bodyOf(stored.calls[0]).includeSignatures, true);

  const listed = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify([{intake_id:'int-1', client_name:'Mo Client', status:'Complete', pdf_link:'https://files.example/mo.pdf', nurse_name:'Ada'}])}
  ]});
  const rows = await listed.box.apiPost({action:'list_new_client_intakes', status:'Complete'});
  assert.strictEqual(listed.calls.length, 1);
  assert.ok(listed.calls[0].url.indexOf('/rest/v1/rpc/list_new_client_intakes') > 0, listed.calls[0].url);
  assert.strictEqual(listed.calls[0].init.method, 'POST');
  assert.strictEqual(listed.calls[0].init.headers.Authorization, 'Bearer office-jwt');
  assert.strictEqual(listed.calls[0].init.headers.apikey, keyConst);
  assert.deepStrictEqual(bodyOf(listed.calls[0]), {p_status:'Complete'});
  assert.ok(listed.calls[0].url.indexOf('script.google.com') < 0);
  assert.strictEqual(rows.success, true);
  assert.strictEqual(rows.data[0].intakeId, 'int-1');
  assert.strictEqual(rows.data[0].clientName, 'Mo Client');
  assert.strictEqual(rows.data[0].pdfLink, 'https://files.example/mo.pdf');
  assert.strictEqual(rows.data[0].nurseName, 'Ada');

  const drafts = harness({search:'', role:'Admin', session:session, responses:[
    {status:200, raw:JSON.stringify({success:true, data:[{intakeId:'d1', status:'Draft', clientName:'Drafty'}]})}
  ]});
  const draftRows = await drafts.box.apiPost({action:'list_new_client_intakes', nurseName:'Ada Nurse', status:'Draft'});
  assert.deepStrictEqual(bodyOf(drafts.calls[0]), {p_status:'Draft', p_nurse_name:'Ada Nurse'});
  assert.strictEqual(draftRows.data[0].intakeId, 'd1');
  assert.ok(drafts.calls[0].url.indexOf('/rpc/list_new_client_intakes') > 0, 'admin Completes/Drafts use the same RPC');

  const plain = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({intake_id:'int-1', status:'Complete', pdf_link:'https://files.example/mo.pdf'})}
  ]});
  const plainGot = await plain.box.apiPost({action:'get_new_client_intake', intakeId:'int-1'});
  assert.deepStrictEqual(bodyOf(plain.calls[0]), {p_intake_id:'int-1', p_include_signatures:false});
  assert.strictEqual(plainGot.success, true);
  assert.strictEqual(plainGot.intakeId, 'int-1');
  assert.strictEqual(plainGot.pdfLink, 'https://files.example/mo.pdf');

  const ink = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({
      intake_id:'int-1',
      status:'Complete',
      packet:{assessment:{clientName:'Mo Client', clientSignatureData:'ink'}, activity_plan:{clientPhone:'555'}}
    })}
  ]});
  const inkGot = await ink.box.apiPost({action:'get_new_client_intake', intakeId:'int-1', includeSignatures:true, includeSigs:true});
  assert.deepStrictEqual(bodyOf(ink.calls[0]), {p_intake_id:'int-1', p_include_signatures:true});
  assert.strictEqual(inkGot.assessment.clientName, 'Mo Client');
  assert.strictEqual(inkGot.assessment.clientSignatureData, 'ink');
  assert.strictEqual(inkGot.activityPlan.clientPhone, '555');

  const saved = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({ok:true, intake_id:'int-9', status:'Complete'})}
  ]});
  const savePayload = {
    action:'save_new_client_intake',
    intakeId:'',
    status:'Complete',
    nurseName:'Ada Nurse',
    clientName:'Mo Client',
    assessment:{clientName:'Mo Client'}
  };
  const saveOut = await saved.box.apiPost(savePayload);
  const saveBody = bodyOf(saved.calls[0]);
  assert.ok(saved.calls[0].url.indexOf('/rpc/save_new_client_intake') > 0);
  assert.strictEqual(saveBody.p_packet.action, undefined);
  assert.strictEqual(saveBody.p_packet.intakeId, null);
  assert.strictEqual(saveBody.p_packet.status, 'Complete');
  assert.strictEqual(saveBody.p_packet.clientName, 'Mo Client');
  assert.strictEqual(saveBody.p_packet.assessment.clientName, 'Mo Client');
  assert.strictEqual(saveOut.success, true);
  assert.strictEqual(saveOut.intakeId, 'int-9');
  assert.strictEqual(saveOut.status, 'Complete');

  const archived = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({ok:true, intake_id:'int-9', status:'Archived'})}
  ]});
  const archOut = await archived.box.apiPost({action:'archive_new_client_intake', intakeId:'int-9'});
  assert.deepStrictEqual(bodyOf(archived.calls[0]), {p_intake_id:'int-9'});
  assert.ok(archived.calls[0].url.indexOf('/rpc/archive_new_client_intake') > 0);
  assert.strictEqual(archOut.success, true);
  assert.strictEqual(archOut.intakeId, 'int-9');

  const compliance = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({success:true, data:[]})}
  ]});
  await compliance.box.apiPost({action:'get_supervisory_compliance'});
  assert.strictEqual(compliance.calls[0].url, sheetsUrl, 'compliance stays on /exec');

  const alerts = harness({search:'', role:'Admin', session:session, responses:[
    {status:200, raw:JSON.stringify({success:true, data:[]})}
  ]});
  await alerts.box.apiPost({action:'list_nurse_alerts', username:'ada'});
  assert.strictEqual(alerts.calls[0].url, sheetsUrl, 'nurse alerts stay on /exec');

  const clientWrite = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({success:true})}
  ]});
  await clientWrite.box.apiPost({action:'add_client', name:'Ann'});
  assert.strictEqual(clientWrite.calls[0].url, sheetsUrl, 'nurse client writes stay on /exec');

  const nurseVisits = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify([{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', client_name:'Ann', contact_type:'Visit', contact_date:'2026-09-20', status:'Active'}])}
  ]});
  const visitList = await nurseVisits.box.apiPost({action:'list_supervisory_contacts', sinceDays:60, contactType:'Visit', clientName:'Ann'});
  assert.ok(nurseVisits.calls[0].url.indexOf('/rpc/list_supervisory_contacts_rpc') > 0, nurseVisits.calls[0].url);
  assert.deepStrictEqual(bodyOf(nurseVisits.calls[0]), {
    p_include_archived:false,
    p_client_name:'Ann',
    p_contact_type:'Visit'
  });
  assert.strictEqual(visitList.success, true);
  assert.strictEqual(visitList.data[0].clientName, 'Ann');
  assert.strictEqual(visitList.data[0].contactId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');

  const nurseArchive = harness({search:'', role:'Nurse', session:session, responses:[
    {status:200, raw:JSON.stringify({ok:true, status:'Archived'})}
  ]});
  const visitArchived = await nurseArchive.box.apiPost({action:'archive_supervisory_contact', contactId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'});
  assert.deepStrictEqual(bodyOf(nurseArchive.calls[0]), {p_contact_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'});
  assert.ok(nurseArchive.calls[0].url.indexOf('/rpc/archive_supervisory_contact_rpc') > 0);
  assert.strictEqual(visitArchived.success, true);
  assert.strictEqual(visitArchived.status, 'Archived');

  const officeList = harness({search:'', role:'Scheduler', session:session, responses:[
    {status:200, raw:'[]'}
  ]});
  await officeList.box.apiPost({action:'list_supervisory_contacts', sinceDays:60});
  assert.ok(officeList.calls[0].url.indexOf('/rest/v1/supervisory_contacts') > 0, 'office list stays REST');
  assert.strictEqual(officeList.calls[0].init.method, 'GET');
  assert.ok(officeList.calls[0].url.indexOf('list_supervisory_contacts_rpc') < 0, 'office list does not switch to the nurse RPC');

  console.log('admin-nurse-sb-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
