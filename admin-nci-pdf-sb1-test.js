#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ORG = '4f97f4d3-6635-4544-904c-6b06aa02d40b';
const ROW = '221cb451-5b17-44c8-a8f6-d92ecc41d625';
const LEGACY = '1000000000001';

assert.ok(html.includes("var NCI_PDF_SB1='NCI_PDF_SB1'"), 'marker');
assert.ok(html.includes('v=nci-pdf-sb1'), 'query marker');
assert.ok(html.includes("sbRestRpc('link_new_client_intake_pdf'"), 'link RPC');
assert.ok(!html.includes('function archiveNewClientIntakePdf'), 'drive archive stays gone');
assert.ok(!html.includes('link_supervisory_contact_pdf'), 'supervisory PDF mint stays out');
const firstMeta = html.slice(html.indexOf('<meta name="admin-build"'), html.indexOf('<meta name="admin-build"') + 80);
assert.ok(firstMeta.includes('2026-09-27-remi-float-hide1b'), 'first admin-build meta stays');

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

const upload = extractFn(html, 'async function sbUploadNciPdf(rowId, pdfBytes, refreshed)');
const link = extractFn(html, 'async function sbLinkNciPdf(rowId, objectPath)');
const mint = extractFn(html, 'async function nciMintCompletePdf(intakeId, rowId)');
assert.ok(upload && link && mint, 'upload, link, and mint exist');
assert.ok(upload.includes("'Content-Type':'application/pdf'"), 'content type');
assert.ok(upload.includes("'x-upsert':'true'"), 'upsert');
assert.ok(upload.includes("orgId+'/nci/'+id+'.pdf'"), 'object path uses the row uuid');
assert.ok(!upload.includes('pdf_documents'), 'upload does not write the registry');
assert.ok(!upload.includes("method:'PATCH'") && !upload.includes('pdf_storage_path'), 'upload does not patch the intake row');
assert.ok(!upload.includes('keepalive'), 'upload is not a keepalive beacon');
assert.ok(!mint.includes('currentAdminRole'), 'mint is not limited to one role');
assert.ok(extractFn(html, 'function nciPdfNeedsFollowup(meta)').includes('pdfStoragePath'), 'a storage path ends follow-up');

const sigs = [
  'function readSbSession()',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'function sbUuid(v)',
  'function sbOrgId()',
  'function sbBytesToAscii(buf, n)',
  'async function sbPdfPayloadInfo(pdfBytes)',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed, signal)',
  'async function sbRestRpc(fnName, body, signal)',
  upload,
  link,
  'function nciWaitVisible()',
  mint
];
const src = sigs.map(function(sig){
  if(sig.indexOf('async function sbUploadNciPdf') === 0 || sig.indexOf('async function sbLinkNciPdf') === 0 || sig.indexOf('async function nciMintCompletePdf') === 0)return sig;
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];

function pdfBytes(){
  const text = '%PDF-1.4 synthetic intake';
  const u8 = new Uint8Array(2048);
  for(let i = 0; i < text.length; i++)u8[i] = text.charCodeAt(i);
  return {
    size: u8.length,
    byteLength: u8.length,
    slice: function(_start, end){
      const n = end == null ? u8.length : end;
      const part = u8.slice(0, n);
      return {arrayBuffer: function(){return Promise.resolve(part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength));}};
    }
  };
}

function harness(script){
  const calls = [];
  const queue = script.slice();
  const session = {
    access_token: 'office-jwt',
    refresh_token: 'refresh-1',
    profile: {org_id: ORG, role: 'nurse'}
  };
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    SB_SESSION_KEY: 'evercare_sb_session',
    SB_PDF_BUCKET: 'evercare-pdfs',
    SB_PDF_MIN_BYTES: 1024,
    SB_PDF_MAX_BYTES: 25 * 1024 * 1024,
    EVERCARE_ORG_ID: ORG,
    calls: calls,
    listLoads: 0,
    window: {__sbSession: session},
    document: {hidden: false, addEventListener: function(){}, removeEventListener: function(){}},
    localStorage: {getItem: function(){return JSON.stringify(session);}, setItem: function(){}, removeItem: function(){}},
    nciRenderPdfBlob: function(){return Promise.resolve(pdfBytes());},
    loadCompletedNewClientIntakes: function(){box.listLoads++;},
    sbRefreshSession: async function(){return null;},
    showTempMsg: function(){},
    fetch: function(url, init){
      const hit = {url: String(url), init: init || {}};
      calls.push(hit);
      const next = queue.length ? queue.shift() : {status: 500, raw: '{}'};
      return Promise.resolve({
        ok: (next.status || 200) < 400,
        status: next.status || 200,
        text: function(){return Promise.resolve(next.raw == null ? '' : next.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
    Array: Array,
    Math: Math,
    Date: Date,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Uint8Array: Uint8Array
  };
  vm.createContext(box);
  vm.runInContext(src, box);
  return box;
}

function pathOf(call){
  return call.url.split('/storage/v1/object/evercare-pdfs/')[1] || '';
}

(async function(){
  const objectPath = ORG + '/nci/' + ROW + '.pdf';
  const okBody = JSON.stringify({success:true, id:ROW, intakeId:LEGACY, pdfStoragePath:objectPath, changed:true});

  const success = harness([
    {status: 200, raw: JSON.stringify({Key: 'evercare-pdfs/' + objectPath})},
    {status: 200, raw: okBody}
  ]);
  const ready = await success.nciMintCompletePdf(LEGACY, ROW);
  assert.strictEqual(ready.ok, true);
  assert.strictEqual(ready.path, objectPath);
  assert.strictEqual(success.calls.length, 2);
  const up = success.calls[0];
  assert.strictEqual(up.init.method, 'POST');
  assert.strictEqual(up.init.headers['Content-Type'], 'application/pdf');
  assert.strictEqual(up.init.headers['x-upsert'], 'true');
  assert.strictEqual(up.init.headers['cache-control'], 'max-age=60');
  assert.strictEqual(up.init.body.size, 2048);
  assert.ok(!up.init.keepalive, 'body is not a keepalive request');
  assert.strictEqual(decodeURIComponent(pathOf(up)), objectPath);
  assert.ok(up.url.indexOf(LEGACY) < 0, 'path uses the row uuid, not the legacy intake id');
  assert.ok(!success.calls.some(function(c){return c.url.indexOf('pdf_documents') >= 0 || c.init.method === 'PATCH';}));
  const linked = JSON.parse(success.calls[1].init.body);
  assert.ok(success.calls[1].url.indexOf('/rpc/link_new_client_intake_pdf') > 0);
  assert.deepStrictEqual(linked, {p_id: ROW, p_object_path: objectPath});

  const retry = harness([
    {status: 200, raw: JSON.stringify({Key: 'evercare-pdfs/' + objectPath})},
    {status: 409, raw: JSON.stringify({code: 'PT409', message: 'object not uploaded yet'})},
    {status: 200, raw: okBody}
  ]);
  const retried = await retry.nciMintCompletePdf(LEGACY, ROW);
  assert.strictEqual(retried.ok, true, '409 retries the link once');
  assert.strictEqual(retry.calls.length, 3);
  assert.strictEqual(retry.calls.filter(function(c){return c.url.indexOf('/storage/v1/object/') >= 0;}).length, 1, '409 does not upload again');
  assert.strictEqual(retry.calls.filter(function(c){return c.url.indexOf('link_new_client_intake_pdf') >= 0;}).length, 2);

  const missing = harness([
    {status: 200, raw: JSON.stringify({Key: 'evercare-pdfs/' + objectPath})},
    {status: 404, raw: JSON.stringify({code: 'PT404', message: 'intake missing'})}
  ]);
  const gone = await missing.nciMintCompletePdf(LEGACY, ROW);
  assert.strictEqual(gone.ok, false);
  assert.strictEqual(gone.missing, true);
  assert.strictEqual(gone.calm, true);
  assert.strictEqual(missing.calls.filter(function(c){return c.url.indexOf('link_new_client_intake_pdf') >= 0;}).length, 1, '404 does not retry the link');
  assert.strictEqual(missing.listLoads, 1, '404 reloads the list');

  const save = extractFn(html, 'async function saveNewClientIntake(status)');
  assert.ok(save.includes('nciMintCompletePdf'), 'complete save mints after the row is stored');
  assert.ok(save.includes("showTempMsg('PDF will be available soon','var(--teal)')"), 'a missed PDF stays calm');
  const mintAt = save.indexOf('nciMintCompletePdf');
  assert.ok(save.indexOf('closeNewClientIntake(true)', mintAt) > mintAt, 'the save still closes after the mint attempt');

  console.log('admin-nci-pdf-sb1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
