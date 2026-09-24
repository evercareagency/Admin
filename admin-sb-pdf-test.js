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

assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(html.includes("var SB_PDF_BUCKET='evercare-pdfs'"), 'bucket is evercare-pdfs');
assert.ok(html.includes('var SB_PDF_SIGN_SECONDS=120'), 'signed URL lifetime stays inside 60–300s');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-sb-pdf-make">'), 'admin-build meta');
assert.ok(html.includes('v=sbpdfmake9c24'), 'make/refresh marker is greppable');
assert.ok(html.includes('client-overlay no-edge'), 'client overlay marker, not an Edge render');
assert.ok(html.includes('GHOST-TIMESHEET-PDF-WRITE-CONTRACT-v1'), 'write contract is named in the tip');
assert.ok(!html.includes('/functions/v1'), 'no Edge Function');
assert.ok(!/\.rpc\(/.test(html), 'no RPC render');
const byteFn = extractFn(html, 'async function sbTimesheetPdfBytes(rec)');
assert.ok(byteFn, 'client byte helper');
assert.ok(byteFn.indexOf('renderTimesheetPdfBlob') >= 0 && byteFn.indexOf('renderTimesheetPdfBlob') < byteFn.indexOf('sbSheetsTimesheetPdfBytes'), 'overlay runs before Sheets fallback');

const opener = extractFn(html, 'function openTimesheetPdf(id)');
const flagOffTail = opener.slice(opener.lastIndexOf('if(!requireTimesheetSignatures(r))return;'));
assert.ok(flagOffTail.includes("const url=(r.pdfLink||'').trim();"), 'flag off still reads pdfLink');
assert.ok(flagOffTail.includes("alert('No archived PDF yet for this timesheet.')"), 'flag off empty state stays');
assert.ok(flagOffTail.includes("window.open(url,'_blank','noopener')"), 'flag off still opens the legacy link');
assert.ok(opener.indexOf('evercareSbEnabled()') < opener.indexOf('sbResolveTimesheetPdf(r)'), 'flag on resolves storage before the sheets open');
assert.ok(opener.includes("res.mode==='storage'"), 'storage URL opens without the Drive link');
const softPart = opener.slice(0, opener.lastIndexOf('if(!requireTimesheetSignatures(r))return;'));
assert.ok(softPart.includes('sbEnsureTimesheetStoragePdf(r)'), 'missing path renders and uploads before open');
assert.ok(softPart.includes('arguments[1]'), 'explicit refresh reuses the make path');
assert.ok(!softPart.includes('window.open(legacy'), 'soft View does not open Drive');
assert.ok(!softPart.includes("r.pdfLink"), 'soft View does not read the legacy link');

const fns = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'async function sbRefreshSession(sess)',
  'async function sbRestGet(table, pairs, refreshed)',
  'function sbPdfObjectPath(path)',
  'function sbTimesheetStoragePath(row)',
  'async function sbLookupTimesheetPdfPath(entityId)',
  'async function sbAttachPdfPaths(rows)',
  'function sbAbsoluteSignedUrl(signed)',
  'async function sbSignPdfUrl(objectPath, refreshed)',
  'async function sbResolveTimesheetPdf(row)',
  'function sbBytesToAscii(buf, n)',
  'async function sbPdfPayloadInfo(pdfBytes)',
  'function sbRememberTimesheetPdfPath(row, objectPath)',
  'function sbUuid(v)',
  'function sbOrgId()',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed)',
  'async function sbUploadTimesheetPdf(row, pdfBytes, refreshed)',
  'function sbBytesToText(bytes, cap)',
  'async function sbResponseBytes(res)',
  'function sbWrapPdfBytes(bytes)',
  'function sbB64ToBytes(b64)',
  'function sbPdfBytesFromUnknown(bytes)',
  'async function sbSheetsTimesheetPdfBytes(row)',
  'async function sbTimesheetPdfBytes(rec)',
  'async function sbEnsureTimesheetStoragePdf(row)',
  'function timesheetPdfAvailable(r)'
].map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];

function harness(opts){
  const calls = [];
  const mem = {};
  const queue = (opts.responses || []).slice();
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    SB_SESSION_KEY: 'evercare_sb_session',
    SB_PDF_BUCKET: 'evercare-pdfs',
    SB_PDF_SIGN_SECONDS: 120,
    SB_PDF_MIN_BYTES: 1024,
    SB_PDF_MAX_BYTES: 10485760,
    EVERCARE_ORG_ID: '4f97f4d3-6635-4544-904c-6b06aa02d40b',
    Uint8Array: Uint8Array,
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    window: {},
    fetch: function(url, init){
      calls.push({url: String(url), init: init || {}});
      const next = queue.length ? queue.shift() : {status: 200, raw: '[]'};
      if(next.reject)return Promise.reject(next.reject);
      return Promise.resolve({
        ok: next.ok !== false && (next.status || 200) < 400,
        status: next.status || 200,
        text: function(){return Promise.resolve(next.raw == null ? '' : next.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
    Array: Array
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
  profile: {id: 'admin-uid', org_id: 'org-1', role: 'admin'}
};
const storagePath = 'org-1/timesheet/ts-1.pdf';
const tsId = '11111111-1111-4111-8111-111111111111';
const madePath = 'org-1/timesheet/' + tsId + '.pdf';
const driveLink = 'https://drive.google.com/file/d/abc/view';
const signedPath = '/object/sign/evercare-pdfs/' + storagePath + '?token=tok123';

function bodyOf(call){return JSON.parse(call.init.body);}

const direct = harness({
  search: '?sb=1',
  session: session,
  responses: [{status: 200, raw: JSON.stringify({signedURL: signedPath})}]
});
const fromDoc = harness({
  search: '?sb=1',
  session: session,
  responses: [
    {status: 200, raw: JSON.stringify([{object_path: storagePath, bucket: 'evercare-pdfs'}])},
    {status: 200, raw: JSON.stringify({signedURL: signedPath})}
  ]
});
const legacy = harness({
  search: '?sb=1',
  session: session,
  responses: [{status: 200, raw: '[]'}]
});
const missing = harness({
  search: '?sb=1',
  session: session,
  responses: [{status: 200, raw: '[]'}]
});
const off = harness({search: '', session: session, responses: []});
const refreshed = harness({
  search: '?sb=1',
  session: session,
  responses: [
    {status: 401, raw: JSON.stringify({message: 'JWT expired'})},
    {status: 200, raw: JSON.stringify({access_token: 'user-jwt-2', refresh_token: 'refresh-2', user: {id: 'admin-uid'}})},
    {status: 200, raw: JSON.stringify({signedURL: signedPath})}
  ]
});
const otherBucket = harness({
  search: '?sb=1',
  session: session,
  responses: [{status: 200, raw: JSON.stringify([{object_path: 'secret/other.pdf', bucket: 'not-pdfs'}])}]
});
const attached = harness({
  search: '?sb=1',
  session: session,
  responses: [{status: 200, raw: JSON.stringify([{entity_id: 'ts-9', object_path: storagePath, bucket: 'evercare-pdfs'}])}]
});

function pdfBytes(size, magic){
  const text = magic == null ? '%PDF-1.4' : magic;
  const u8 = new Uint8Array(size);
  for(let i = 0; i < text.length && i < size; i++)u8[i] = text.charCodeAt(i);
  return {
    size: size,
    u8: u8,
    slice: function(_start, end){
      const n = end == null ? size : end;
      const part = u8.slice(0, n);
      return {arrayBuffer: function(){return Promise.resolve(part.buffer);}};
    }
  };
}

function runUpload(){
  const uploaded = harness({
    search: '?sb=1',
    session: session,
    responses: [
      {status: 200, raw: JSON.stringify({Key: madePath})},
      {status: 204, raw: ''},
      {status: 201, raw: ''},
      {status: 200, raw: JSON.stringify({signedURL: '/object/sign/evercare-pdfs/' + madePath + '?token=made'})}
    ]
  });
  const stub = harness({search: '?sb=1', session: session, responses: []});
  const badMagic = harness({search: '?sb=1', session: session, responses: []});
  const uploadFail = harness({
    search: '?sb=1',
    session: session,
    responses: [{status: 500, raw: JSON.stringify({message: 'storage down'})}]
  });
  const patchFail = harness({
    search: '?sb=1',
    session: session,
    responses: [
      {status: 200, raw: JSON.stringify({Key: madePath})},
      {status: 500, raw: JSON.stringify({message: 'patch denied'})}
    ]
  });
  const flagOff = harness({search: '', session: session, responses: []});
  const ensured = harness({
    search: '?sb=1',
    session: session,
    responses: [
      {status: 200, raw: JSON.stringify({Key: madePath})},
      {status: 204, raw: ''},
      {status: 201, raw: ''},
      {status: 200, raw: JSON.stringify({signedURL: '/object/sign/evercare-pdfs/' + madePath + '?token=ensured'})}
    ]
  });
  const blob = pdfBytes(2048);
  ensured.box.renderTimesheetPdfBlob = function(rec){
    ensured.rendered = rec;
    return Promise.resolve(blob);
  };
  const row = {id: tsId, pdfStoragePath: '', pdf_storage_path: '', pdfLink: driveLink};
  return uploaded.box.sbUploadTimesheetPdf(row, blob).then(function(up){
    assert.strictEqual(up.ok, true);
    assert.ok(up.url.indexOf('/object/sign/evercare-pdfs/' + madePath + '?token=made') > 0, up.url);
    assert.ok(up.url.indexOf('drive.google.com') < 0);
    assert.strictEqual(uploaded.calls.length, 4);
    assert.strictEqual(uploaded.calls[0].init.method, 'POST');
    assert.ok(uploaded.calls[0].url.indexOf('/storage/v1/object/evercare-pdfs/org-1/timesheet/' + tsId + '.pdf') > 0, uploaded.calls[0].url);
    assert.ok(uploaded.calls[0].url.indexOf('%2F') < 0, 'path slashes stay');
    assert.strictEqual(uploaded.calls[0].init.headers.Authorization, 'Bearer user-jwt');
    assert.strictEqual(uploaded.calls[0].init.headers.apikey, keyConst);
    assert.strictEqual(uploaded.calls[0].init.headers['Content-Type'], 'application/pdf');
    assert.strictEqual(uploaded.calls[0].init.headers['x-upsert'], 'true');
    assert.strictEqual(uploaded.calls[0].init.body, blob);
    assert.strictEqual(uploaded.calls[1].init.method, 'PATCH');
    assert.ok(uploaded.calls[1].url.indexOf('/rest/v1/timesheets?') > 0, uploaded.calls[1].url);
    assert.ok(uploaded.calls[1].url.indexOf('id=eq.' + tsId) > 0, uploaded.calls[1].url);
    assert.deepStrictEqual(bodyOf(uploaded.calls[1]), {pdf_storage_path: madePath});
    assert.ok(!Object.prototype.hasOwnProperty.call(bodyOf(uploaded.calls[1]), 'pdf_link'));
    assert.strictEqual(uploaded.calls[1].init.headers.Prefer, 'return=minimal');
    assert.strictEqual(uploaded.calls[2].init.method, 'POST');
    assert.ok(uploaded.calls[2].url.indexOf('/rest/v1/pdf_documents?') > 0, uploaded.calls[2].url);
    assert.ok(uploaded.calls[2].url.indexOf('on_conflict=org_id') > 0, uploaded.calls[2].url);
    assert.strictEqual(uploaded.calls[2].init.headers.Prefer, 'resolution=merge-duplicates,return=minimal');
    const reg = bodyOf(uploaded.calls[2]);
    assert.strictEqual(reg.org_id, 'org-1');
    assert.strictEqual(reg.doc_kind, 'timesheet');
    assert.strictEqual(reg.entity_id, tsId);
    assert.strictEqual(reg.bucket, 'evercare-pdfs');
    assert.strictEqual(reg.object_path, madePath);
    assert.strictEqual(reg.content_type, 'application/pdf');
    assert.strictEqual(reg.byte_size, 2048);
    assert.strictEqual(reg.is_active, true);
    assert.ok(!Object.prototype.hasOwnProperty.call(reg, 'pdf_link'));
    assert.strictEqual(uploaded.calls[3].init.method, 'POST');
    assert.ok(uploaded.calls[3].url.indexOf('/object/sign/evercare-pdfs/') > 0);
    assert.strictEqual(row.pdfLink, driveLink, 'upload must not clear the legacy link');
    assert.strictEqual(row.pdfStoragePath, madePath);
    return stub.box.sbUploadTimesheetPdf({id: tsId, pdfLink: driveLink}, pdfBytes(40, '%PDF-'));
  }).then(function(tiny){
    assert.strictEqual(tiny.ok, false);
    assert.strictEqual(tiny.soft, true);
    assert.strictEqual(stub.calls.length, 0, 'stub PDF must not upload');
    return badMagic.box.sbUploadTimesheetPdf({id: tsId}, pdfBytes(2048, 'hello'));
  }).then(function(text){
    assert.strictEqual(text.ok, false);
    assert.strictEqual(badMagic.calls.length, 0, 'non-PDF bytes must not upload');
    const kept = {id: tsId, pdfStoragePath: '', pdfLink: driveLink};
    return uploadFail.box.sbUploadTimesheetPdf(kept, blob).then(function(failed){
      assert.strictEqual(failed.ok, false);
      assert.strictEqual(failed.soft, true);
      assert.strictEqual(kept.pdfStoragePath, '');
      assert.strictEqual(kept.pdfLink, driveLink);
      assert.strictEqual(uploadFail.calls.length, 1, 'failed upload does not patch');
      return patchFail.box.sbUploadTimesheetPdf(kept, blob);
    });
  }).then(function(unlinked){
    assert.strictEqual(unlinked.ok, false);
    assert.strictEqual(unlinked.soft, true);
    assert.strictEqual(patchFail.calls.length, 2, 'patch failure stops before registry and sign');
    assert.ok(!patchFail.calls.some(function(c){return c.url.indexOf('/pdf_documents') >= 0 || c.url.indexOf('/object/sign/') >= 0;}));
    return flagOff.box.sbUploadTimesheetPdf({id: tsId, pdfLink: driveLink}, blob);
  }).then(function(offUp){
    assert.strictEqual(offUp.skipped, true);
    assert.strictEqual(flagOff.calls.length, 0, 'flag off must not upload');
    const live = {id: tsId, pdfLink: driveLink, pdfStoragePath: ''};
    ensured.box.currentRec = live;
    return ensured.box.sbEnsureTimesheetStoragePdf(live);
  }).then(function(made){
    assert.strictEqual(made.ok, true);
    assert.strictEqual(ensured.rendered, ensured.box.currentRec);
    assert.strictEqual(ensured.rendered.pdfLink, driveLink);
    assert.strictEqual(ensured.box.currentRec.pdfStoragePath, madePath);
    assert.strictEqual(ensured.box.currentRec.pdfLink, driveLink, 'make must not clear the legacy link');
    assert.ok(made.url.indexOf('token=ensured') > 0, made.url);
    assert.ok(!ensured.calls.some(function(c){return c.url.indexOf('script.google.com') >= 0;}), 'a working overlay must not call Sheets');
    assert.ok(!ensured.calls.some(function(c){return c.url.indexOf('/functions/v1') >= 0 || c.url.indexOf('/rpc/') >= 0;}));

    const sheetsUrl = 'https://script.google.com/macros/s/test/exec';
    let sheetPdf = '%PDF-1.4\n';
    while(sheetPdf.length < 2048)sheetPdf += ' ';
    const blocked = harness({
      search: '?sb=1',
      session: session,
      responses: [
        {status: 200, raw: sheetPdf},
        {status: 200, raw: JSON.stringify({Key: madePath})},
        {status: 204, raw: ''},
        {status: 201, raw: ''},
        {status: 200, raw: JSON.stringify({signedURL: '/object/sign/evercare-pdfs/' + madePath + '?token=sheets'})}
      ]
    });
    blocked.box.SHEETS_URL = sheetsUrl;
    blocked.box.renderTimesheetPdfBlob = function(){return Promise.reject(new Error('overlay blocked'));};
    const blockedRow = {id: tsId, pdfLink: driveLink, pdfStoragePath: ''};
    return blocked.box.sbEnsureTimesheetStoragePdf(blockedRow).then(function(fromSheets){
      assert.strictEqual(fromSheets.ok, true, 'Sheets bytes still upload when the overlay is blocked');
      assert.ok(fromSheets.url.indexOf('token=sheets') > 0, fromSheets.url);
      const sheetsCall = blocked.calls[0];
      assert.ok(sheetsCall.url.indexOf('/exec') > 0, sheetsCall.url);
      assert.deepStrictEqual(bodyOf(sheetsCall), {action: 'get_timesheet_pdf', id: tsId, timesheetId: tsId});
      assert.strictEqual(blocked.calls[1].init.method, 'POST');
      assert.ok(blocked.calls[1].url.indexOf('/storage/v1/object/evercare-pdfs/') > 0);
      assert.ok(!blocked.calls.some(function(c){return c.url.indexOf('/functions/v1') >= 0 || c.url.indexOf('drive.google.com') >= 0;}));
      assert.strictEqual(blockedRow.pdfLink, driveLink);
      console.log('admin-sb-pdf-test: ok');
      return runBrowser();
    });
  });
}

Promise.resolve().then(function(){
  return direct.box.sbResolveTimesheetPdf({id: 'ts-1', pdfStoragePath: storagePath, pdfLink: driveLink});
}).then(function(opened){
  assert.strictEqual(opened.mode, 'storage');
  assert.strictEqual(opened.url, urlConst + '/storage/v1' + signedPath);
  assert.ok(opened.url.indexOf('drive.google.com') < 0);
  assert.strictEqual(direct.calls.length, 1, 'a stored path must not look up Drive or pdf_documents');
  assert.strictEqual(direct.calls[0].init.method, 'POST');
  assert.ok(direct.calls[0].url.indexOf('/storage/v1/object/sign/evercare-pdfs/org-1/timesheet/ts-1.pdf') > 0, direct.calls[0].url);
  assert.ok(direct.calls[0].url.indexOf('%2F') < 0, 'path slashes stay');
  assert.deepStrictEqual(bodyOf(direct.calls[0]), {expiresIn: 120});
  assert.strictEqual(direct.calls[0].init.headers.Authorization, 'Bearer user-jwt');
  assert.strictEqual(direct.calls[0].init.headers.apikey, keyConst);
  assert.notStrictEqual(direct.calls[0].init.headers.Authorization, 'Bearer ' + keyConst);
  assert.strictEqual(direct.box.timesheetPdfAvailable({pdfStoragePath: storagePath, pdfLink: ''}), true);
  assert.strictEqual(direct.box.timesheetPdfAvailable({pdfStoragePath: '', pdfLink: driveLink}), true);

  return fromDoc.box.sbResolveTimesheetPdf({id: 'ts-1', pdfStoragePath: '', pdfLink: driveLink});
}).then(function(docOpened){
  assert.strictEqual(docOpened.mode, 'storage');
  assert.ok(fromDoc.calls[0].url.indexOf('/rest/v1/pdf_documents?') > 0, fromDoc.calls[0].url);
  assert.ok(fromDoc.calls[0].url.indexOf('doc_kind=eq.timesheet') > 0);
  assert.ok(fromDoc.calls[0].url.indexOf('entity_id=eq.ts-1') > 0);
  assert.ok(fromDoc.calls[0].url.indexOf('is_active=eq.true') > 0);
  assert.strictEqual(fromDoc.calls[1].init.method, 'POST');
  assert.ok(fromDoc.calls[1].url.indexOf('/object/sign/evercare-pdfs/') > 0);
  assert.ok(!fromDoc.calls.some(function(c){return c.url.indexOf('drive.google.com') >= 0;}));

  return legacy.box.sbResolveTimesheetPdf({id: 'ts-2', pdfLink: driveLink});
}).then(function(legacyRes){
  assert.strictEqual(legacyRes.mode, 'legacy');
  assert.strictEqual(legacy.calls.length, 1);
  assert.ok(legacy.calls[0].url.indexOf('/pdf_documents?') > 0);
  assert.ok(!legacy.calls.some(function(c){return c.url.indexOf('/object/sign/') >= 0;}));

  return missing.box.sbResolveTimesheetPdf({id: 'ts-3', pdfLink: ''});
}).then(function(missingRes){
  assert.strictEqual(missingRes.mode, 'missing');
  assert.ok(!missing.calls.some(function(c){return c.url.indexOf('/object/sign/') >= 0;}));

  return off.box.sbResolveTimesheetPdf({id: 'ts-1', pdfStoragePath: storagePath, pdfLink: driveLink});
}).then(function(offRes){
  assert.strictEqual(offRes.mode, 'skipped');
  assert.strictEqual(off.calls.length, 0, 'flag off must not sign or fetch storage');
  assert.strictEqual(off.box.timesheetPdfAvailable({pdfStoragePath: storagePath, pdfLink: ''}), false);
  assert.strictEqual(off.box.timesheetPdfAvailable({pdfLink: driveLink}), true);

  return refreshed.box.sbSignPdfUrl(storagePath);
}).then(function(afterRefresh){
  assert.strictEqual(afterRefresh.ok, true);
  assert.ok(refreshed.calls[1].url.indexOf('/auth/v1/token?grant_type=refresh_token') > 0);
  assert.strictEqual(refreshed.calls[2].init.headers.Authorization, 'Bearer user-jwt-2');
  assert.strictEqual(JSON.parse(refreshed.mem.evercare_sb_session).profile.org_id, 'org-1');

  return otherBucket.box.sbResolveTimesheetPdf({id: 'ts-4', pdfLink: ''});
}).then(function(wrong){
  assert.strictEqual(wrong.mode, 'missing');
  assert.ok(!otherBucket.calls.some(function(c){return c.url.indexOf('/object/sign/') >= 0;}));

  const rows = [{id: 'ts-9', pdfStoragePath: '', pdfLink: ''}];
  return attached.box.sbAttachPdfPaths(rows).then(function(){
    assert.strictEqual(rows[0].pdfStoragePath, storagePath);
    assert.ok(attached.calls[0].url.indexOf('entity_id=in.') > 0);
    assert.strictEqual(direct.box.timesheetPdfAvailable({id: tsId, pdfStoragePath: '', pdfLink: ''}), true);
    assert.strictEqual(off.box.timesheetPdfAvailable({id: tsId, pdfStoragePath: '', pdfLink: ''}), false);
    return runUpload();
  });
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
      console.log('admin-sb-pdf browser skipped (no puppeteer-core)');
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
  const timesheetRow = {
    id: 'ts-1',
    emp_name: 'Jane Doe',
    client_name: 'Ann Client',
    week_start: '2026-09-14',
    total_hours: '8:00',
    status: 'submitted',
    is_active: true,
    submitted_at: '2026-09-20T15:00:00.000Z',
    pdf_storage_path: storagePath,
    pdf_link: driveLink,
    days: {'0': {tin: '08:00', tout: '16:00', hrs: '8:00'}}
  };
  function install(page, hits, opts){
    opts = opts || {};
    const sheet = opts.row || timesheetRow;
    return page.setRequestInterception(true).then(function(){
      page.on('request', function(req){
        const u = req.url();
        if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com|drive\.google\.com/.test(u)){
          hits.push({url: u, method: req.method(), blocked: true});
          req.abort();
          return;
        }
        const cors = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'apikey, authorization, content-type, accept, prefer, x-upsert',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS'
        };
        if(/supabase\.co|script\.google\.com/.test(u)){
          if(req.method() === 'OPTIONS'){req.respond({status: 204, headers: cors, body: ''});return;}
          let parsed = {};
          try{parsed = JSON.parse(req.postData() || '{}');}catch(e){}
          hits.push({url: u, method: req.method(), action: parsed.action || '', body: parsed, headers: req.headers()});
          let raw = JSON.stringify({success: true, data: []});
          let status = 200;
          if(/script\.google\.com/.test(u) && parsed.action === 'get_all'){
            raw = JSON.stringify({success: true, data: [{
              id: 'sheet-ts', submitted: true, empName: 'Sheet Aide', clientName: 'Sheet Client',
              weekStart: '2026-09-14', totalHrs: '1:00', pdfLink: driveLink, status: 'submitted',
              days: {'0': {tin: '08:00', tout: '09:00', hrs: '1:00'}}
            }]});
          }else if(req.method() === 'GET' && /\/rest\/v1\/timesheets/.test(u)){
            raw = JSON.stringify([sheet]);
          }else if(req.method() === 'GET' && /\/rest\/v1\/pdf_documents/.test(u)){
            raw = '[]';
          }else if(req.method() === 'GET' && /\/rest\/v1\/aides/.test(u)){
            raw = JSON.stringify([]);
          }else if(req.method() === 'GET' && /\/rest\/v1\/clients/.test(u)){
            raw = JSON.stringify([]);
          }else if(req.method() === 'POST' && /\/object\/sign\/evercare-pdfs\//.test(u)){
            raw = JSON.stringify({signedURL: opts.signedPath || signedPath});
          }else if(req.method() === 'POST' && /\/storage\/v1\/object\/evercare-pdfs\//.test(u)){
            if(opts.failUpload){
              req.respond({status: 500, contentType: 'application/json', headers: cors, body: JSON.stringify({message: 'storage down'})});
              return;
            }
            raw = JSON.stringify({Key: 'uploaded'});
          }else if(req.method() === 'PATCH' && /\/rest\/v1\/timesheets/.test(u)){
            status = 204;
            raw = '';
          }else if(req.method() === 'POST' && /\/rest\/v1\/pdf_documents/.test(u)){
            status = 201;
            raw = '';
          }
          req.respond({status: status, contentType: 'application/json', headers: cors, body: raw});
          return;
        }
        req.continue();
      });
    });
  }
  try{
    const onCtx = await browser.createBrowserContext();
    const onPage = await onCtx.newPage();
    await onPage.setViewport({width: 1280, height: 900});
    const admin = JSON.stringify({role: 'Admin', username: 'Office Admin', name: 'Office Admin', loginAt: Date.now()});
    const sb = JSON.stringify(session);
    await onPage.evaluateOnNewDocument(function(adminRaw, sbRaw){
      localStorage.setItem('admin_session', adminRaw);
      localStorage.setItem('evercare_sb_session', sbRaw);
      window.__opened = [];
      window.open = function(url){window.__opened.push(String(url)); return null;};
    }, admin, sb);
    const onHits = [];
    await install(onPage, onHits);
    await onPage.goto('http://127.0.0.1:' + port + '/index.html?sb=1&v=sbpdf', {waitUntil: 'domcontentloaded', timeout: 20000});
    await onPage.waitForFunction(function(){
      const btn = document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]');
      return btn && btn.textContent.indexOf('View') >= 0;
    }, {timeout: 8000});
    await onPage.screenshot({path: '/opt/cursor/artifacts/sb_pdf_view.png'});
    await onPage.evaluate(function(){
      document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]').click();
    });
    await onPage.waitForFunction(function(){return window.__opened.length === 1;}, {timeout: 8000});
    const opened = await onPage.evaluate(function(){return window.__opened.slice();});
    assert.ok(opened[0].indexOf('/storage/v1/object/sign/evercare-pdfs/org-1/timesheet/ts-1.pdf?token=tok123') > 0, opened[0]);
    assert.ok(opened[0].indexOf('drive.google.com') < 0, opened[0]);
    const sign = onHits.find(function(h){return h.method === 'POST' && /\/object\/sign\/evercare-pdfs\//.test(h.url);});
    assert.ok(sign, 'View posts createSignedUrl');
    assert.deepStrictEqual(sign.body, {expiresIn: 120});
    assert.strictEqual(sign.headers.authorization, 'Bearer user-jwt');
    assert.ok(!onHits.some(function(h){return /drive\.google\.com/.test(h.url);}), 'storage path must not open Drive');
    await onPage.evaluate(function(){
      document.querySelector('#tsBody button[onclick^="viewRec"]').click();
    });
    await onPage.waitForSelector('#detailBody button[onclick^="openTimesheetPdf"]', {timeout: 8000});
    const detailLabel = await onPage.$eval('#detailBody button[onclick^="openTimesheetPdf"]', function(el){return el.textContent;});
    assert.ok(detailLabel.indexOf('View PDF') >= 0, detailLabel);
    await onPage.click('#detailBody button[onclick^="openTimesheetPdf"]');
    await onPage.waitForFunction(function(){return window.__opened.length === 2;}, {timeout: 8000});
    const second = await onPage.evaluate(function(){return window.__opened[1];});
    assert.ok(second.indexOf('token=tok123') > 0 && second.indexOf('drive.google.com') < 0, second);
    await onPage.screenshot({path: '/opt/cursor/artifacts/sb_pdf_preview.png'});
    console.log('admin-sb-pdf browser flag on: ok');

    const offCtx = await browser.createBrowserContext();
    const offPage = await offCtx.newPage();
    await offPage.setViewport({width: 1280, height: 900});
    await offPage.evaluateOnNewDocument(function(adminRaw){
      localStorage.setItem('admin_session', adminRaw);
      window.__opened = [];
      window.open = function(url){window.__opened.push(String(url)); return null;};
    }, admin);
    const offHits = [];
    await install(offPage, offHits);
    await offPage.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await offPage.waitForFunction(function(){
      return !!document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]');
    }, {timeout: 8000});
    await offPage.evaluate(function(){
      document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]').click();
    });
    await offPage.waitForFunction(function(){
      const el = document.getElementById('nciToast');
      return el && el.textContent.indexOf('Client and HHA signatures are required') >= 0;
    }, {timeout: 8000});
    const offOpened = await offPage.evaluate(function(){return window.__opened.slice();});
    assert.deepStrictEqual(offOpened, []);
    assert.ok(!offHits.some(function(h){return /supabase\.co\/storage/.test(h.url) || /\/rest\/v1\//.test(h.url);}), 'flag off View must stay on Sheets');
    console.log('admin-sb-pdf browser flag off: ok');

    const missingRow = Object.assign({}, timesheetRow, {
      id: tsId,
      pdf_storage_path: '',
      pdf_link: driveLink
    });
    const madeSigned = '/object/sign/evercare-pdfs/' + madePath + '?token=made123';
    async function stubRender(page){
      await page.evaluate(function(){
        window.renderTimesheetPdfBlob = function(){
          var bytes = new Uint8Array(2048);
          bytes[0] = 37; bytes[1] = 80; bytes[2] = 68; bytes[3] = 70; bytes[4] = 45;
          return Promise.resolve(new Blob([bytes], {type: 'application/pdf'}));
        };
      });
    }
    const makeCtx = await browser.createBrowserContext();
    const makePage = await makeCtx.newPage();
    await makePage.setViewport({width: 1280, height: 900});
    await makePage.evaluateOnNewDocument(function(adminRaw, sbRaw){
      localStorage.setItem('admin_session', adminRaw);
      localStorage.setItem('evercare_sb_session', sbRaw);
      window.__opened = [];
      window.__alerts = [];
      window.open = function(url){window.__opened.push(String(url)); return null;};
      window.alert = function(msg){window.__alerts.push(String(msg));};
    }, admin, sb);
    const makeHits = [];
    await install(makePage, makeHits, {row: missingRow, signedPath: madeSigned});
    await makePage.goto('http://127.0.0.1:' + port + '/index.html?sb=1&v=sbpdfmake', {waitUntil: 'domcontentloaded', timeout: 20000});
    await makePage.waitForFunction(function(){
      const btn = document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]');
      return btn && btn.textContent.indexOf('View') >= 0;
    }, {timeout: 8000});
    await stubRender(makePage);
    await makePage.evaluate(function(){
      document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]').click();
    });
    await makePage.waitForFunction(function(){return window.__opened.length === 1;}, {timeout: 20000});
    const madeOpen = await makePage.evaluate(function(){return window.__opened[0];});
    assert.ok(madeOpen.indexOf('/storage/v1/object/sign/evercare-pdfs/' + madePath + '?token=made123') > 0, madeOpen);
    assert.ok(madeOpen.indexOf('drive.google.com') < 0, madeOpen);
    const uploadHit = makeHits.find(function(h){return h.method === 'POST' && /\/storage\/v1\/object\/evercare-pdfs\//.test(h.url) && !/\/object\/sign\//.test(h.url);});
    assert.ok(uploadHit, 'View uploads the rendered PDF');
    assert.strictEqual(uploadHit.headers.authorization, 'Bearer user-jwt');
    assert.strictEqual(uploadHit.headers['x-upsert'], 'true');
    assert.ok(uploadHit.url.indexOf(madePath) > 0, uploadHit.url);
    const patchHit = makeHits.find(function(h){return h.method === 'PATCH' && /\/rest\/v1\/timesheets/.test(h.url);});
    assert.ok(patchHit, 'View patches pdf_storage_path');
    assert.deepStrictEqual(patchHit.body, {pdf_storage_path: madePath});
    const regHit = makeHits.find(function(h){return h.method === 'POST' && /\/rest\/v1\/pdf_documents/.test(h.url);});
    assert.ok(regHit, 'View upserts pdf_documents');
    assert.strictEqual(regHit.body.object_path, madePath);
    assert.strictEqual(regHit.body.byte_size, 2048);
    const kept = await makePage.evaluate(function(){
      var rec = allRecords[0];
      return {pdfLink: rec.pdfLink, pdfStoragePath: rec.pdfStoragePath};
    });
    assert.strictEqual(kept.pdfLink, driveLink, 'Sheet pdf link stays during dual-run');
    assert.strictEqual(kept.pdfStoragePath, madePath);
    assert.ok(!makeHits.some(function(h){return /drive\.google\.com/.test(h.url);}), 'soft make must not call Drive');
    const makeAlerts = await makePage.evaluate(function(){return window.__alerts.slice();});
    assert.deepStrictEqual(makeAlerts, []);
    await makePage.screenshot({path: '/opt/cursor/artifacts/sb_pdf_make.png'});
    console.log('admin-sb-pdf browser make: ok');

    const failCtx = await browser.createBrowserContext();
    const failPage = await failCtx.newPage();
    await failPage.setViewport({width: 1280, height: 900});
    await failPage.evaluateOnNewDocument(function(adminRaw, sbRaw){
      localStorage.setItem('admin_session', adminRaw);
      localStorage.setItem('evercare_sb_session', sbRaw);
      window.__opened = [];
      window.__alerts = [];
      window.open = function(url){window.__opened.push(String(url)); return null;};
      window.alert = function(msg){window.__alerts.push(String(msg));};
    }, admin, sb);
    const failHits = [];
    await install(failPage, failHits, {row: missingRow, failUpload: true});
    await failPage.goto('http://127.0.0.1:' + port + '/index.html?sb=1&v=sbpdfmiss', {waitUntil: 'domcontentloaded', timeout: 20000});
    await failPage.waitForSelector('#tsBody button[onclick^="openTimesheetPdf"]', {timeout: 8000});
    await stubRender(failPage);
    await failPage.evaluate(function(){
      document.querySelector('#tsBody button[onclick^="openTimesheetPdf"]').click();
    });
    await failPage.waitForFunction(function(){
      const el = document.getElementById('nciToast');
      return el && el.style.display !== 'none' && el.textContent.indexOf('Could not save the PDF to Storage') >= 0;
    }, {timeout: 20000});
    const failOpened = await failPage.evaluate(function(){return window.__opened.slice();});
    const failAlerts = await failPage.evaluate(function(){return window.__alerts.slice();});
    assert.deepStrictEqual(failOpened, []);
    assert.deepStrictEqual(failAlerts, []);
    assert.ok(!failHits.some(function(h){return h.method === 'PATCH' && /\/timesheets/.test(h.url);}), 'failed upload leaves the path null');
    await failPage.evaluate(function(){
      document.querySelector('#tsBody button[onclick^="viewRec"]').click();
    });
    await failPage.waitForSelector('#detailTitle', {timeout: 8000});
    const detailOpen = await failPage.$eval('#detailTitle', function(el){return el.textContent;});
    assert.ok(detailOpen.indexOf('Jane Doe') >= 0, detailOpen);
    const still = await failPage.evaluate(function(){
      return {pdfLink: allRecords[0].pdfLink, pdfStoragePath: allRecords[0].pdfStoragePath || ''};
    });
    assert.strictEqual(still.pdfLink, driveLink);
    assert.strictEqual(still.pdfStoragePath, '');
    await failPage.screenshot({path: '/opt/cursor/artifacts/sb_pdf_upload_soft.png'});
    console.log('admin-sb-pdf browser upload miss: ok');
  }finally{
    await browser.close();
    await new Promise(function(r){server.close(r);});
  }
}
