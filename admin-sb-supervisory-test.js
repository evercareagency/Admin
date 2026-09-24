#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const anonFile = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWxrcHR3Z2lmbmtia3VhdnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDExMTAsImV4cCI6MjEwNTc3NzExMH0.b-3Pdb_oVR3L6JM0yd_aQcqtQH8exGV7OPwdtx0b3Xg';

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

assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-is-delete">'), 'admin-build meta');
assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(html.includes(anonFile), 'anon key stays the embedded jwt');
assert.ok(!html.includes(".delete('supervisory_contacts'"), 'no client hard delete of supervisory_contacts');
assert.ok(html.includes("return {ok:false,error:'Archive only — hard delete is not allowed'};"), 'write helper refuses DELETE');

const keysLine = (html.match(/var SB_SC_PAYLOAD_KEYS=\[[^\]]+\];/) || [])[0];
assert.ok(keysLine && keysLine.includes('ClientSignatureData') && keysLine.includes('Bathing'), keysLine);

const apiPost = extractFn(html, 'async function apiPost(payload)');
assert.ok(apiPost.indexOf('sbIsSupervisoryAction') < apiPost.indexOf('fetch(SHEETS_URL'), 'supervisory branch precedes sheets');
assert.ok(apiPost.includes('sbApiSupervisory(payload)'), 'supervisory actions delegate');
assert.ok(apiPost.includes('typeof sbIsSupervisoryAction'), 'missing helper must not throw');

const sigs = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function clearSbSession()',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'function sbIsListAction(action)',
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
  'async function sbRefreshSession(sess)',
  'async function sbRestGet(table, pairs, refreshed)',
  'async function sbRestWrite(method, table, pairs, body, refreshed)',
  'function sbPdfObjectPath(path)',
  'function sbAbsoluteSignedUrl(signed)',
  'async function sbSignPdfUrl(objectPath, refreshed)',
  'function sbSupervisoryIdFilter(contactId)',
  'function sbSupervisoryPdfPath(path)',
  'async function sbSupervisoryList(payload)',
  'async function sbSupervisoryGet(payload)',
  'async function sbSupervisorySave(payload)',
  'async function sbSupervisoryArchive(payload)',
  'async function sbSupervisoryPdf(payload)',
  'async function sbApiSupervisory(payload)'
];
const fns = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  assert.ok(!fn.includes("method:'DELETE'") && !fn.includes('method:"DELETE"'), sig + ' must not issue DELETE');
  return fn;
}).concat([
  keysLine,
  "var SB_PDF_BUCKET='evercare-pdfs';",
  'var SB_PDF_SIGN_SECONDS=120;',
  apiPost
]).join('\n');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
const sheetsUrl = (html.match(/const SHEETS_URL='([^']+)'/) || [])[1];
const orgId = '4f97f4d3-6635-4544-904c-6b06aa02d40b';
const visitId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const callId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
const clientUuid = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';

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
    location: {search: opts.search || ''},
    currentAdminRole: opts.role || null,
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    window: {},
    fetch: function(url, init){
      calls.push({url: url, init: init || {}});
      const next = queue.length ? queue.shift() : null;
      if(next && next.reject)return Promise.reject(next.reject);
      const res = next || {ok:true, status:200, raw:'[]'};
      return Promise.resolve({
        ok: res.ok !== false && (res.status || 200) < 400,
        status: res.status || 200,
        text: function(){return Promise.resolve(res.raw == null ? '' : res.raw);},
        json: function(){return Promise.resolve(JSON.parse(res.raw || '{}'));}
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
    isNaN: isNaN
  };
  if(opts.session){
    mem.evercare_sb_session = JSON.stringify(opts.session);
    box.window.__sbSession = opts.session;
  }
  vm.createContext(box);
  vm.runInContext(fns, box);
  return {box: box, calls: calls, mem: mem};
}

const session = {
  access_token: 'user-jwt',
  refresh_token: 'refresh-1',
  user: {id: 'admin-uid', email: 'admin@roles.evercare.local'},
  email: 'admin@roles.evercare.local',
  profile: {id: 'admin-uid', org_id: orgId, role: 'admin'}
};

const visitRow = {
  id: visitId,
  legacy_id: 'V9',
  org_id: orgId,
  client_id: clientUuid,
  aide_id: null,
  contact_date: '2026-09-21',
  contact_type: 'Visit',
  client_name: 'Ann Client',
  aide_name: 'Jane Doe',
  supervisor_name: 'Ada Nurse',
  aide_present: 'Yes',
  form_complete: true,
  status: 'Active',
  is_active: true,
  client_signature_captured: true,
  supervisor_signature_captured: true,
  client_signature_date: '2026-09-21',
  supervisor_signature_date: '2026-09-21',
  pdf_storage_path: orgId + '/supervisory/' + visitId + '.pdf',
  pdf_link: 'https://drive.example/legacy-v9',
  updated_at: '2026-09-21T15:00:00.000Z',
  created_at: '2026-09-21T14:00:00.000Z',
  payload: {
    Bathing: '2',
    FunctionalLimitations: 'Uses a walker',
    ClientSignatureData: 'data:image/png;base64,client',
    SupervisorSignatureData: 'data:image/png;base64,nurse'
  }
};
const callRow = {
  id: callId,
  legacy_id: null,
  contact_date: '2026-09-22',
  contact_type: 'PhoneCall',
  client_name: 'Ann Client',
  aide_name: 'Jane Doe',
  supervisor_name: 'Ada Nurse',
  status: 'Active',
  is_active: true,
  form_complete: true,
  pdf_storage_path: '',
  pdf_link: '',
  payload: {SpokeWith: 'Client', CallOutcome: 'Reached', TopicsCovered: 'Meds'}
};
const oldRow = {
  id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
  contact_date: '2020-01-01',
  contact_type: 'Visit',
  client_name: 'Old Client',
  status: 'Active',
  is_active: true,
  payload: {}
};
const archivedRow = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  legacy_id: 'OLD',
  contact_date: '2026-09-20',
  contact_type: 'Visit',
  client_name: 'Gone Client',
  status: 'Archived',
  is_active: false,
  payload: {}
};

function params(url){
  return new URL(url).searchParams;
}

const savePayload = {
  action: 'save_supervisory_contact',
  contactDate: '09/23/2026',
  contactType: 'Visit',
  clientId: clientUuid,
  clientName: 'Ann Client',
  aideName: 'Jane Doe',
  supervisorName: 'Ada Nurse',
  aidePresent: 'Yes',
  formComplete: 'Yes',
  clientSignatureCaptured: 'Yes',
  supervisorSignatureCaptured: 'Yes',
  clientSignatureDate: '09/23/2026',
  supervisorSignatureDate: '09/23/2026',
  functionalLimitations: 'Uses a walker',
  Bathing: '2',
  bathing: '2',
  clientSignatureData: 'data:image/png;base64,clientink',
  supervisorSignatureData: 'data:image/png;base64,nurseink'
};

const off = harness({search: '?sheets=1', responses: [
  {status: 200, raw: JSON.stringify({success: true, data: []})}
]});
const storedFlag = harness({
  search: '',
  storage: {evercare_sb: '1'},
  session: session,
  responses: [{status: 200, raw: JSON.stringify([])}]
});
const empty = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: '[]'}
]});
const listed = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([visitRow, callRow, oldRow, archivedRow])}
]});
const got = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([archivedRow])}
]});
const legacyGet = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([visitRow])}
]});
const created = harness({search: '?sb=1', session: session, responses: [
  {status: 201, raw: JSON.stringify([Object.assign({}, visitRow, {id: visitId, legacy_id: null, contact_date: '2026-09-23'})])}
]});
const edited = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([visitRow])}
]});
const archived = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([{id: visitId, legacy_id: 'V9', status: 'Archived', updated_at: '2026-09-24T01:00:00.000Z', is_active: false}])}
]});
const aliasArchive = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([{id: callId, legacy_id: null, status: 'Archived', updated_at: '2026-09-24T01:02:00.000Z', is_active: false}])}
]});
const signed = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([visitRow])},
  {status: 200, raw: JSON.stringify({signedURL: '/object/sign/evercare-pdfs/' + orgId + '/supervisory/' + visitId + '.pdf?token=short'})}
]});
const legacyPdf = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([Object.assign({}, visitRow, {pdf_storage_path: ''})])}
]});
const phonePdf = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([callRow])}
]});
const bare = harness({search: '?sb=1', responses: []});
const compliance = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify({success: true, data: []})}
]});
const refreshed = harness({search: '?sb=1', session: session, responses: [
  {status: 401, raw: JSON.stringify({message: 'JWT expired'})},
  {status: 200, raw: JSON.stringify({access_token: 'user-jwt-2', refresh_token: 'refresh-2', expires_in: 3600, expires_at: 1999999999, token_type: 'bearer', user: {id: 'admin-uid'}})},
  {status: 200, raw: JSON.stringify([visitRow])}
]});
const hard = harness({search: '?sb=1', session: session, responses: []});
const nurseStay = harness({
  search: '',
  role: 'Nurse',
  session: session,
  responses: [{status: 200, raw: JSON.stringify({success: true, data: []})}]
});
const defaultOn = harness({
  search: '',
  session: session,
  responses: [{status: 200, raw: JSON.stringify([])}]
});
const nurseAlerts = harness({
  search: '',
  responses: [{status: 200, raw: JSON.stringify({success: true, items: []})}]
});

Promise.all([
  off.box.apiPost({action: 'list_supervisory_contacts', sinceDays: 60}),
  storedFlag.box.apiPost({action: 'list_supervisory_contacts'}),
  empty.box.apiPost({action: 'list_supervisory_contacts', sinceDays: 60}),
  listed.box.apiPost({action: 'list_supervisory_contacts', sinceDays: 60, contactType: 'Visit', clientName: 'Ann Client'}),
  got.box.apiPost({action: 'get_supervisory_contact', contactId: archivedRow.id}),
  legacyGet.box.apiPost({action: 'get_supervisory_contact', contactId: 'V9'}),
  created.box.apiPost(savePayload),
  edited.box.apiPost(Object.assign({contactId: visitId}, savePayload, {functionalLimitations: 'Updated note'})),
  archived.box.apiPost({action: 'archive_supervisory_contact', contactId: visitId}),
  aliasArchive.box.apiPost({action: 'delete_supervisory_contact', contactId: callId}),
  signed.box.apiPost({action: 'archive_supervisory_visit_pdf', contactId: visitId}),
  legacyPdf.box.apiPost({action: 'archive_supervisory_visit_pdf', contactId: visitId}),
  phonePdf.box.apiPost({action: 'archive_supervisory_visit_pdf', contactId: callId}),
  bare.box.apiPost({action: 'save_supervisory_contact', contactType: 'Visit'}),
  compliance.box.apiPost({action: 'get_supervisory_compliance'}),
  refreshed.box.apiPost({action: 'list_supervisory_contacts'}),
  hard.box.sbRestWrite('DELETE', 'supervisory_contacts', [['id', 'eq.' + visitId]], {}),
  nurseStay.box.apiPost({action: 'save_supervisory_contact', contactType: 'Visit'}),
  defaultOn.box.apiPost({action: 'list_supervisory_contacts'}),
  nurseAlerts.box.apiPost({action: 'list_nurse_alerts', username: 'ada'})
]).then(function(results){
  const sheetsList = results[0];
  const storedList = results[1];
  const emptyList = results[2];
  const visitList = results[3];
  const archivedGet = results[4];
  const byLegacy = results[5];
  const createdRow = results[6];
  const editedRow = results[7];
  const archivedOut = results[8];
  const aliasOut = results[9];
  const signedOut = results[10];
  const legacyOut = results[11];
  const phoneOut = results[12];
  const noSession = results[13];
  const complianceOut = results[14];
  const refreshedOut = results[15];
  const deleted = results[16];

  assert.strictEqual(off.calls.length, 1, 'flag off makes one sheets call');
  assert.strictEqual(off.calls[0].url, sheetsUrl);
  assert.deepStrictEqual(JSON.parse(off.calls[0].init.body), {action: 'list_supervisory_contacts', sinceDays: 60});
  assert.strictEqual(sheetsList.success, true);
  assert.ok(!off.calls.some(function(c){return c.url.indexOf('supabase.co') >= 0;}), 'flag off must not call supabase');

  assert.strictEqual(storedList.success, true);
  assert.deepStrictEqual(storedList.data, []);
  assert.ok(storedFlag.calls[0].url.indexOf('/rest/v1/supervisory_contacts?') > 0, storedFlag.calls[0].url);
  assert.strictEqual(storedFlag.calls[0].init.headers.Authorization, 'Bearer user-jwt');
  assert.strictEqual(storedFlag.calls[0].init.headers.apikey, keyConst);

  assert.strictEqual(emptyList.success, true);
  assert.deepStrictEqual(emptyList.data, []);
  assert.deepStrictEqual(emptyList.contacts, []);
  const emptyUrl = empty.calls[0].url;
  assert.strictEqual(params(emptyUrl).get('select'), '*');
  assert.strictEqual(params(emptyUrl).get('status'), 'eq.Active');
  assert.strictEqual(params(emptyUrl).get('order'), 'contact_date.desc');
  assert.strictEqual(empty.calls[0].init.method, 'GET');
  assert.ok(!empty.calls.some(function(c){return c.url === sheetsUrl;}), 'empty supabase list must not fall through to sheets');

  assert.strictEqual(visitList.success, true);
  assert.strictEqual(visitList.data.length, 1, 'active visit in the window, matching client');
  assert.strictEqual(visitList.data[0].contactId, visitId);
  assert.strictEqual(visitList.data[0].clientName, 'Ann Client');
  assert.strictEqual(visitList.data[0].contactType, 'Visit');
  assert.strictEqual(visitList.data[0].contactDate, '2026-09-21');
  assert.strictEqual(visitList.data[0].functionalLimitations, 'Uses a walker');
  assert.strictEqual(visitList.data[0].Bathing, '2');
  assert.strictEqual(visitList.data[0].pdfStoragePath, visitRow.pdf_storage_path);
  assert.strictEqual(visitList.data[0].pdfLink, visitRow.pdf_link);
  assert.strictEqual(visitList.data[0].legacyId, 'V9');
  const listUrl = listed.calls[0].url;
  assert.strictEqual(params(listUrl).get('status'), 'eq.Active');
  assert.strictEqual(params(listUrl).get('contact_type'), 'eq.Visit');
  assert.strictEqual(params(listUrl).get('client_id'), null, 'name filter stays client-side');
  assert.strictEqual(listed.calls[0].init.headers.Authorization, 'Bearer user-jwt');
  assert.notStrictEqual(listed.calls[0].init.headers.Authorization, 'Bearer ' + keyConst);

  assert.strictEqual(archivedGet.success, true, 'get returns archived rows');
  assert.strictEqual(archivedGet.contact.status, 'Archived');
  assert.strictEqual(archivedGet.contact.contactId, archivedRow.id);
  assert.strictEqual(params(got.calls[0].url).get('id'), 'eq.' + archivedRow.id);
  assert.strictEqual(params(got.calls[0].url).get('status'), null, 'get does not filter status');

  assert.strictEqual(byLegacy.success, true);
  assert.strictEqual(byLegacy.contact.contactId, visitId);
  assert.strictEqual(byLegacy.contact.ClientSignatureData, 'data:image/png;base64,client');
  assert.strictEqual(params(legacyGet.calls[0].url).get('legacy_id'), 'eq.V9');
  assert.strictEqual(params(legacyGet.calls[0].url).get('id'), null);

  assert.strictEqual(createdRow.success, true);
  assert.strictEqual(createdRow.contactId, visitId);
  assert.strictEqual(created.calls[0].init.method, 'POST');
  assert.strictEqual(created.calls[0].init.headers.Prefer, 'return=representation');
  assert.strictEqual(created.calls[0].init.headers.Authorization, 'Bearer user-jwt');
  assert.strictEqual(created.calls[0].init.headers.apikey, keyConst);
  const createdBody = JSON.parse(created.calls[0].init.body);
  assert.strictEqual(createdBody.org_id, orgId);
  assert.strictEqual(createdBody.status, 'Active');
  assert.strictEqual(createdBody.contact_date, '2026-09-23');
  assert.strictEqual(createdBody.contact_type, 'Visit');
  assert.strictEqual(createdBody.client_id, clientUuid);
  assert.strictEqual(createdBody.aide_id, null);
  assert.strictEqual(createdBody.form_complete, true);
  assert.strictEqual(createdBody.client_signature_captured, true);
  assert.strictEqual(createdBody.payload.FunctionalLimitations, 'Uses a walker');
  assert.strictEqual(createdBody.payload.Bathing, '2');
  assert.strictEqual(createdBody.payload.ClientSignatureData, 'data:image/png;base64,clientink');
  assert.strictEqual(createdBody.legacy_id, undefined, 'pure create omits legacy id');
  assert.ok(!Object.prototype.hasOwnProperty.call(createdBody, 'id'));
  assert.strictEqual(createdRow.clientSignatureDataLen, 'data:image/png;base64,clientink'.length);

  assert.strictEqual(editedRow.success, true);
  assert.strictEqual(edited.calls[0].init.method, 'PATCH');
  assert.ok(edited.calls[0].url.indexOf('id=eq.' + visitId) > 0, edited.calls[0].url);
  const editedBody = JSON.parse(edited.calls[0].init.body);
  assert.strictEqual(editedBody.payload.FunctionalLimitations, 'Updated note');
  assert.strictEqual(editedBody.status, undefined, 'edit must not archive');
  assert.strictEqual(editedBody.org_id, undefined, 'edit must not rewrite org');
  assert.ok(!Object.prototype.hasOwnProperty.call(editedBody, 'pdf_link'));
  assert.ok(!Object.prototype.hasOwnProperty.call(editedBody, 'pdf_storage_path'));

  assert.strictEqual(archivedOut.success, true);
  assert.strictEqual(archivedOut.contactId, 'V9');
  assert.strictEqual(archivedOut.status, 'Archived');
  assert.strictEqual(archivedOut.updatedAt, '2026-09-24T01:00:00.000Z');
  assert.strictEqual(archivedOut.isActive, false);
  assert.strictEqual(archived.calls[0].init.method, 'PATCH');
  assert.deepStrictEqual(JSON.parse(archived.calls[0].init.body), {status: 'Archived'});
  assert.ok(archived.calls[0].url.indexOf('id=eq.' + visitId) > 0);
  assert.ok(archived.calls[0].url.indexOf('select=id%2Clegacy_id%2Cstatus%2Cupdated_at%2Cis_active') > 0 || archived.calls[0].url.indexOf('select=id,legacy_id,status,updated_at,is_active') > 0);

  assert.strictEqual(aliasOut.success, true);
  assert.strictEqual(aliasOut.contactId, callId, 'archive contactId falls back to id');
  assert.strictEqual(aliasOut.status, 'Archived');
  assert.strictEqual(aliasArchive.calls[0].init.method, 'PATCH');
  assert.deepStrictEqual(JSON.parse(aliasArchive.calls[0].init.body), {status: 'Archived'});
  assert.ok(aliasArchive.calls[0].url.indexOf('id=eq.' + callId) > 0);

  assert.strictEqual(signedOut.success, true);
  assert.ok(signedOut.pdfLink.indexOf('/storage/v1/object/sign/evercare-pdfs/') > 0, signedOut.pdfLink);
  assert.ok(signedOut.pdfLink.indexOf('token=short') > 0);
  assert.strictEqual(signed.calls[1].init.method, 'POST');
  assert.ok(signed.calls[1].url.indexOf('/storage/v1/object/sign/evercare-pdfs/' + orgId + '/supervisory/' + visitId + '.pdf') > 0, signed.calls[1].url);
  assert.deepStrictEqual(JSON.parse(signed.calls[1].init.body), {expiresIn: 120});
  assert.strictEqual(signed.calls[1].init.headers.Authorization, 'Bearer user-jwt');
  assert.ok(!signed.calls.some(function(c){return c.url === sheetsUrl;}), 'stored pdf must not call sheets');

  assert.strictEqual(legacyOut.success, true);
  assert.strictEqual(legacyOut.pdfLink, 'https://drive.example/legacy-v9');
  assert.strictEqual(legacyPdf.calls.length, 1, 'legacy link does not request a signed url');

  assert.strictEqual(phoneOut.success, false);
  assert.strictEqual(phoneOut.error, 'Phone calls do not include a PDF.');
  assert.strictEqual(phonePdf.calls.length, 1);

  assert.strictEqual(noSession.success, false);
  assert.strictEqual(noSession.error, 'Not signed in');
  assert.strictEqual(bare.calls.length, 0, 'missing jwt must not fall through to sheets');

  assert.strictEqual(complianceOut.success, true);
  assert.strictEqual(compliance.calls.length, 1);
  assert.strictEqual(compliance.calls[0].url, sheetsUrl, 'compliance stays on sheets');

  assert.strictEqual(refreshedOut.success, true);
  assert.strictEqual(refreshedOut.data[0].contactId, visitId);
  assert.ok(refreshed.calls[1].url.indexOf('/auth/v1/token?grant_type=refresh_token') > 0);
  assert.strictEqual(refreshed.calls[2].init.headers.Authorization, 'Bearer user-jwt-2');

  assert.strictEqual(deleted.ok, false);
  assert.strictEqual(deleted.error, 'Archive only — hard delete is not allowed');
  assert.strictEqual(hard.calls.length, 0, 'DELETE never hits the network');

  assert.strictEqual(nurseStay.calls.length, 1, 'nurse supervisory save is one sheets call');
  assert.strictEqual(nurseStay.calls[0].url, sheetsUrl, 'nurse portal supervisory stays on sheets');
  assert.ok(!nurseStay.calls.some(function(c){return c.url.indexOf('supabase.co') >= 0;}), 'nurse portal must not call supabase');
  assert.ok(defaultOn.calls[0].url.indexOf('/rest/v1/supervisory_contacts') > 0, 'default office list is supabase without ?sb=1');
  assert.ok(!defaultOn.calls.some(function(c){return c.url === sheetsUrl;}), 'default office list must not dual-write sheets');
  assert.strictEqual(nurseAlerts.calls.length, 1);
  assert.strictEqual(nurseAlerts.calls[0].url, sheetsUrl, 'nurse alerts stay on sheets');

  assert.strictEqual(off.box.sbUuid('not-a-uuid'), false);
  assert.strictEqual(off.box.sbUuid(visitId), true);
  assert.strictEqual(off.box.sbScTextDate('9/7/2026'), '2026-09-07');

  console.log('admin-sb-supervisory-test: ok');
  return runBrowser();
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

async function runBrowser(){
  if(process.env.SKIP_BROWSER === '1')return;
  let puppeteer;
  try{puppeteer = require('puppeteer-core');}
  catch(e){
    try{puppeteer = require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){
      console.log('admin-sb-supervisory browser skipped (no puppeteer-core)');
      return;
    }
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = path.join(__dirname);
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(r){server.listen(0, '127.0.0.1', r);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const rows = [JSON.parse(JSON.stringify(visitRow)), JSON.parse(JSON.stringify(callRow))];
  async function openPage(search, storage){
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({width: 1280, height: 900});
    const admin = JSON.stringify({role: 'Admin', username: 'Office Admin', name: 'Office Admin', loginAt: Date.now()});
    const sb = JSON.stringify(session);
    await page.evaluateOnNewDocument(function(mem){
      Object.keys(mem).forEach(function(k){localStorage.setItem(k, mem[k]);});
    }, Object.assign({admin_session: admin, evercare_sb_session: sb}, storage || {}));
    const hits = [];
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'apikey, authorization, content-type, accept, prefer',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS'
      };
      if(/supabase\.co|script\.google\.com/.test(u)){
        if(req.method() === 'OPTIONS'){req.respond({status: 204, headers: cors, body: ''});return;}
        let body = null;
        try{body = JSON.parse(req.postData() || '{}');}catch(e){}
        hits.push({url: u, method: req.method(), body: body, headers: req.headers()});
        let raw = JSON.stringify({success: true, data: []});
        if(/\/rest\/v1\/aides/.test(u))raw = '[]';
        else if(/\/rest\/v1\/clients/.test(u))raw = '[]';
        else if(/\/rest\/v1\/timesheets/.test(u))raw = '[]';
        else if(/\/rest\/v1\/supervisory_contacts/.test(u) && req.method() === 'GET'){
          const q = new URL(u).searchParams;
          let list = rows.filter(function(row){
            if(q.get('status') === 'eq.Active' && row.status !== 'Active')return false;
            const idEq = q.get('id');
            if(idEq && idEq.indexOf('eq.') === 0 && row.id !== idEq.slice(3))return false;
            const legacyEq = q.get('legacy_id');
            if(legacyEq && legacyEq.indexOf('eq.') === 0 && String(row.legacy_id || '') !== decodeURIComponent(legacyEq.slice(3)))return false;
            return true;
          });
          raw = JSON.stringify(list);
        }else if(/\/rest\/v1\/supervisory_contacts/.test(u) && req.method() === 'PATCH'){
          const idEq = new URL(u).searchParams.get('id') || '';
          const id = idEq.indexOf('eq.') === 0 ? idEq.slice(3) : '';
          const row = rows.find(function(item){return item.id === id;});
          if(row && body){
            if(body.status)row.status = body.status;
            if(body.payload)row.payload = body.payload;
            if(body.status === 'Archived')row.is_active = false;
            row.updated_at = '2026-09-24T02:00:00.000Z';
          }
          raw = JSON.stringify(row ? [{
            id: row.id,
            legacy_id: row.legacy_id,
            status: row.status,
            updated_at: row.updated_at,
            is_active: row.is_active,
            pdf_link: row.pdf_link,
            pdf_storage_path: row.pdf_storage_path,
            contact_date: row.contact_date,
            contact_type: row.contact_type,
            client_name: row.client_name,
            aide_name: row.aide_name,
            supervisor_name: row.supervisor_name,
            payload: row.payload
          }] : []);
        }else if(/\/storage\/v1\/object\/sign\/evercare-pdfs\//.test(u)){
          raw = JSON.stringify({signedURL: '/object/sign/evercare-pdfs/demo.pdf?token=browser'});
        }
        req.respond({status: 200, contentType: 'application/json', headers: cors, body: raw});
        return;
      }
      req.continue();
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html' + search, {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.waitForFunction(function(){
      return document.getElementById('adminScreen').classList.contains('active');
    }, {timeout: 8000});
    return {page: page, hits: hits, context: context};
  }
  try{
    const offPage = await openPage('?sheets=1&v=sheets-supervisory', {});
    await offPage.page.evaluate(function(){localStorage.removeItem('evercare_sb_session');});
    await offPage.page.reload({waitUntil: 'domcontentloaded'});
    await offPage.page.waitForFunction(function(){
      return document.getElementById('adminScreen').classList.contains('active');
    }, {timeout: 8000});
    offPage.hits.length = 0;
    await offPage.page.click('#nav_nurse');
    await offPage.page.waitForFunction(function(){
      const el = document.getElementById('adminSupervisoryBody');
      return el && el.textContent.indexOf('Loading') < 0;
    }, {timeout: 8000});
    const offText = await offPage.page.$eval('#adminSupervisoryBody', function(el){return el.textContent;});
    assert.ok(offText.indexOf('No supervisory visits or calls yet.') >= 0, offText);
    assert.ok(offPage.hits.some(function(h){return h.body && h.body.action === 'list_supervisory_contacts';}), 'flag off lists through sheets');
    assert.ok(!offPage.hits.some(function(h){return /supervisory_contacts/.test(h.url);}), 'flag off does not read supabase supervisory');
    console.log('admin-sb-supervisory browser flag-off ok');
    await offPage.context.close();

    const on = await openPage('?v=sbcut1');
    await on.page.evaluate(function(){
      window.__opened = [];
      window.open = function(url){window.__opened.push(url);return null;};
    });
    await on.page.click('#nav_nurse');
    await on.page.waitForFunction(function(){
      const el = document.getElementById('adminSupervisoryBody');
      return el && el.textContent.indexOf('Ann Client') >= 0 && el.textContent.indexOf('Phone call') >= 0;
    }, {timeout: 8000});
    const listedText = await on.page.$eval('#adminSupervisoryBody', function(el){return el.innerText;});
    assert.ok(listedText.indexOf('09/21/2026') >= 0 || listedText.indexOf('09/22/2026') >= 0, listedText);
    assert.ok(listedText.indexOf('PDF ready') >= 0, listedText);
    const listHit = on.hits.filter(function(h){return h.method === 'GET' && /\/rest\/v1\/supervisory_contacts/.test(h.url);}).pop();
    assert.ok(listHit, 'list hit');
    assert.strictEqual(listHit.headers.authorization, 'Bearer user-jwt');
    assert.strictEqual(listHit.headers.apikey, keyConst);
    assert.ok(listHit.url.indexOf('status=eq.Active') > 0, listHit.url);
    await on.page.screenshot({path: '/opt/cursor/artifacts/sb_supervisory_list.png'});

    await on.page.evaluate(function(id){
      viewAdminSupervisoryPdf(id);
    }, visitId);
    await on.page.waitForFunction(function(){return window.__opened && window.__opened.length > 0;}, {timeout: 8000});
    const opened = await on.page.evaluate(function(){return window.__opened.slice();});
    assert.ok(opened[0].indexOf('/storage/v1/object/sign/evercare-pdfs/') > 0, opened[0]);
    assert.ok(opened[0].indexOf('token=browser') > 0, opened[0]);
    assert.ok(opened[0].indexOf('drive.example') < 0, opened[0]);
    assert.ok(on.hits.some(function(h){return /\/storage\/v1\/object\/sign\/evercare-pdfs\//.test(h.url) && h.body && h.body.expiresIn === 120;}));

    await on.page.evaluate(function(id){return editSupervisoryContact(id);}, visitId);
    await on.page.waitForFunction(function(){
      return document.getElementById('supervisoryContactModal').classList.contains('show') &&
        document.getElementById('sc_functionalLimitations').value === 'Uses a walker';
    }, {timeout: 8000});
    await on.page.$eval('#sc_functionalLimitations', function(el){el.value = 'Updated from admin';});
    await on.page.click('#supervisoryContactModal .mbtn-confirm');
    await on.page.waitForFunction(function(){
      return !document.getElementById('supervisoryContactModal').classList.contains('show');
    }, {timeout: 8000});
    const patch = on.hits.filter(function(h){
      return h.method === 'PATCH' && h.body && h.body.payload && h.body.payload.FunctionalLimitations === 'Updated from admin';
    });
    assert.strictEqual(patch.length, 1, 'edit save patches the row');
    assert.strictEqual(patch[0].body.status, undefined);
    assert.ok(patch[0].url.indexOf('id=eq.' + visitId) > 0, patch[0].url);
    assert.strictEqual(patch[0].headers.prefer, 'return=representation');
    await on.page.waitForFunction(function(){
      const el = document.getElementById('adminSupervisoryBody');
      return el && el.textContent.indexOf('Ann Client') >= 0;
    }, {timeout: 8000});

    await on.page.evaluate(function(id){confirmDeleteSupervisoryContact(id);}, visitId);
    await on.page.waitForFunction(function(){
      const el = document.getElementById('nciDiscardConfirm');
      return el && el.classList.contains('show') && document.getElementById('nciDiscardTitle').textContent === 'Are you sure?';
    }, {timeout: 8000});
    await on.page.click('#nciDiscardGoBtn');
    await on.page.waitForFunction(function(){
      const el = document.getElementById('adminSupervisoryBody');
      return el && el.textContent.indexOf('Phone call') >= 0 && el.textContent.indexOf('09/21/2026') < 0;
    }, {timeout: 8000});
    const archiveHit = on.hits.filter(function(h){
      return h.method === 'PATCH' && h.body && h.body.status === 'Archived';
    }).pop();
    assert.ok(archiveHit, 'archive patch');
    assert.deepStrictEqual(archiveHit.body, {status: 'Archived'});
    assert.ok(!on.hits.some(function(h){return h.method === 'DELETE';}), 'browser never sends DELETE');
    const after = await on.page.$eval('#adminSupervisoryBody', function(el){return el.innerText;});
    assert.ok(after.indexOf('Ann Client') >= 0, after);
    assert.ok(after.indexOf('Phone call') >= 0, after);
    await on.page.screenshot({path: '/opt/cursor/artifacts/sb_supervisory_archived.png'});
    console.log('admin-sb-supervisory browser flag-on ok');
    await on.context.close();

    rows.length = 0;
    const blank = await openPage('?v=stored-flag', {evercare_sb: '1'});
    await blank.page.click('#nav_nurse');
    await blank.page.waitForFunction(function(){
      const el = document.getElementById('adminSupervisoryBody');
      return el && el.textContent.indexOf('No supervisory visits or calls yet.') >= 0;
    }, {timeout: 8000});
    assert.ok(blank.hits.some(function(h){return h.method === 'GET' && /\/rest\/v1\/supervisory_contacts/.test(h.url);}));
    assert.ok(!blank.hits.some(function(h){return h.body && h.body.action === 'list_supervisory_contacts';}));
    await blank.page.screenshot({path: '/opt/cursor/artifacts/sb_supervisory_empty.png'});
    console.log('admin-sb-supervisory browser empty ok');
    await blank.context.close();
  }finally{
    await browser.close();
    await new Promise(function(r){server.close(r);});
  }
}
