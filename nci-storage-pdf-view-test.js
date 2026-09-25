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

assert.ok(html.includes('v=ncipdf1'), 'ncipdf1 marker');
assert.ok(html.includes('GHOST-NCI-PDF-STORAGE-CONTRACT-v1'), 'storage contract id');
assert.ok(html.includes('admin-build 2026-09-25-ncipdf1'), 'ncipdf1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-ncipdf1">'), 'ncipdf1 meta');
assert.ok(html.includes('{org_id}/nci/{new_client_intakes.id}.pdf'), 'path is the intake row uuid');
assert.ok(html.includes('SB_PDF_SIGN_SECONDS=120'), 'shared signer stays at 120s');
assert.ok(!/service_role/.test(extractFn(html, 'async function nciOpenIntakeStoragePdf(row)') + extractFn(html, 'async function viewCompletedIntakePdf(intakeId)')), 'View does not use service_role');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-coverpick1'), 'coverpick1 is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-payready1d">'), 'payready1d meta stays');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after payready1');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1"') < html.indexOf('content="2026-09-25-remidate1"'), 'remidate1 meta stays after aidecreds1');
assert.ok(html.indexOf('content="2026-09-25-remidate1"') < html.indexOf('content="2026-09-25-ncipdf1"'), 'ncipdf1 meta stays after remidate1');
assert.ok(html.indexOf('content="2026-09-25-ncipdf1"') < html.indexOf('content="2026-09-25-remichat1"'), 'remichat1 meta stays after ncipdf1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remichat1">'), 'remichat1 meta stays');
assert.ok(html.includes('v=remichat1'), 'remichat1 marker stays');
assert.ok(html.indexOf('content="2026-09-25-ncipdf1"') < html.indexOf('content="2026-09-25-admintheme1"'), 'ncipdf1 is the current build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-loginkb1">'), 'loginkb1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'isclear1 meta stays');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 marker stays');
assert.ok(!/drive\.google\.com/.test(extractFn(html, 'async function viewCompletedIntakePdf(intakeId)')), 'View does not invent a Drive URL');
const signSrc = extractFn(html, 'async function sbSignPdfUrl(objectPath, refreshed)');
assert.ok(signSrc.includes("'/storage/v1/object/sign/'+SB_PDF_BUCKET+'/'"), 'sbSignPdfUrl is storage createSignedUrl');
assert.ok(signSrc.includes('expiresIn:SB_PDF_SIGN_SECONDS'), 'createSignedUrl expiresIn is 120');
assert.ok(signSrc.includes('readSbSession()'), 'createSignedUrl uses the office session JWT');
assert.ok(!/service_role/.test(signSrc), 'signer has no service_role');
assert.ok(extractFn(html, 'async function nciOpenIntakeStoragePdf(row)').includes('sbSignPdfUrl(path)'), 'View signs through createSignedUrl');

const sigs = [
  'function pickIntakePdfLink(obj)',
  'function nciLegacyDriveUrl(obj)',
  'function nciOpenExternalPdf(url)',
  'function nciPdfStoragePath(obj)',
  'function nciPickPdfMeta(obj)',
  'function nciCompletedTableHtml(rows)',
  'function nciMapCompleteIntakeRows(data)',
  'async function nciOpenIntakeStoragePdf(row)',
  'async function viewCompletedIntakePdf(intakeId)'
];
const src = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const viewSrc = extractFn(html, 'async function viewCompletedIntakePdf(intakeId)');
assert.ok(viewSrc.includes('includeSignatures:true,includeSigs:true'), 'empty View still loads ink');
assert.ok(viewSrc.indexOf('nciPdfStoragePath(row)') < viewSrc.indexOf('nciLegacyDriveUrl(row)'), 'storage path is checked before Drive');
assert.ok(viewSrc.includes("showTempMsg('PDF not ready yet','var(--warn)')"), 'both empty stays the pending message');

const opens = [];
const toasts = [];
const signs = [];
const gets = [];
const sandbox = {
  nciCompletedRows: [],
  nciLastCompletePdf: null,
  SB_PDF_BUCKET: 'evercare-pdfs',
  nciIntakeIdOf: function(r){return r && r.intakeId != null ? String(r.intakeId) : '';},
  nciPickIntakeId: function(r){return r && r.intakeId != null ? String(r.intakeId) : '';},
  nciIntakeClientName: function(r){return (r && r.clientName) || 'Untitled';},
  nciIntakeOpened: function(){return '';},
  nciIntakeCompletedAt: function(){return '';},
  escapeHtml: function(v){return String(v == null ? '' : v);},
  escapeAttr: function(v){return String(v == null ? '' : v);},
  toEasternMDY: function(){return '';},
  nciStr: function(v){return v == null ? '' : String(v).trim();},
  nciArchiveIntakeId: function(){return '';},
  nciIsPdfPending: function(){return false},
  nciIntakeRowsFromList: function(data){return (data && data.data) || [];},
  sbPdfObjectPath: function(p){return String(p || '').trim().replace(/^\/+/, '');},
  sbSupervisoryPdfPath: function(p){
    var clean = sandbox.sbPdfObjectPath(p);
    var prefix = sandbox.SB_PDF_BUCKET + '/';
    if(clean.indexOf(prefix) === 0)clean = clean.slice(prefix.length);
    return clean;
  },
  sbSignPdfUrl: function(objectPath){
    signs.push(objectPath);
    if(sandbox._signError)return Promise.resolve({ok:false, error:sandbox._signError});
    return Promise.resolve({ok:true, url:'https://storage.example/sign/' + objectPath});
  },
  getNewClientIntake: function(id, opts){
    gets.push({id:id, opts:opts});
    return Promise.resolve(sandbox._got);
  },
  nciRememberCompletePdf: function(id, link, fileId, storagePath){
    sandbox.nciLastCompletePdf = {intakeId:id, pdfLink:link || '', pdfFileId:fileId || '', pdfStoragePath:storagePath || ''};
  },
  nciApplyCompletePdf: function(id, link, fileId){
    sandbox.nciLastCompletePdf = {intakeId:id, pdfLink:link || '', pdfFileId:fileId || ''};
  },
  showTempMsg: function(msg, color){toasts.push({msg:msg, color:color});},
  window: {open: function(url){opens.push(url); return {closed:false};}},
  String: String,
  Promise: Promise
};
vm.createContext(sandbox);
vm.runInContext(src + '\nthis.viewCompletedIntakePdf=viewCompletedIntakePdf;\nthis.nciPickPdfMeta=nciPickPdfMeta;\nthis.nciCompletedTableHtml=nciCompletedTableHtml;\nthis.nciMapCompleteIntakeRows=nciMapCompleteIntakeRows;', sandbox);

const drive = 'https://drive.google.com/file/d/legacy/view';
const storagePath = '4f97f4d3-6635-4544-904c-6b06aa02d40b/nci/221cb451-5b17-44c8-a8f6-d92ecc41d625.pdf';

(async function(){
  const meta = sandbox.nciPickPdfMeta({pdf_storage_path:storagePath, pdfLink:drive});
  assert.strictEqual(meta.pdfStoragePath, storagePath, 'meta keeps Ace pdf_storage_path');
  assert.strictEqual(meta.pdfLink, drive, 'meta still keeps pdfLink');
  const nested = sandbox.nciPickPdfMeta({data:{pdfStoragePath:'org/intake/nested.pdf'}});
  assert.strictEqual(nested.pdfStoragePath, 'org/intake/nested.pdf');

  const httpFile = 'https://drive.google.com/file/d/abc/view';
  const mapped = sandbox.nciMapCompleteIntakeRows({success:true, data:[
    {intakeId:'new-1', status:'Complete', clientName:'New Storage', pdf_storage_path:storagePath, pdfLink:drive},
    {intakeId:'old-1', status:'Complete', clientName:'Legacy', pdfLink:drive},
    {intakeId:'empty-1', status:'Complete', clientName:'Pending'},
    {intakeId:'snake-1', status:'Complete', clientName:'Snake', pdf_link:drive, pdf_file_id:httpFile}
  ]});
  assert.strictEqual(mapped[0].pdfStoragePath, storagePath, 'list map keeps storage path');
  assert.strictEqual(mapped[0].pdf_storage_path, storagePath, 'list map keeps pdf_storage_path');
  assert.strictEqual(mapped[0].pdfLink, drive, 'list map keeps legacy pdfLink');
  assert.strictEqual(mapped[1].pdfStoragePath, '', 'drive-only row has no storage path');
  assert.strictEqual(mapped[2].pdfLink, '', 'empty row has no drive link');
  assert.strictEqual(mapped[3].pdfLink, drive, 'list map keeps pdf_link');
  assert.strictEqual(mapped[3].pdfFileId, httpFile, 'list map keeps http pdf_file_id');

  const table = sandbox.nciCompletedTableHtml(mapped);
  assert.ok(table.includes('New Storage') && table.includes('Legacy') && table.includes('Pending') && table.includes('Snake'));
  assert.strictEqual((table.match(/badge badge-ok">PDF ready/g) || []).length, 3, 'storage, drive, and snake rows are PDF ready');
  assert.strictEqual((table.match(/nci-pdf-pending">PDF pending/g) || []).length, 1, 'empty row stays pending');
  assert.ok(table.includes("viewCompletedIntakePdf('new-1')"));
  assert.ok(table.includes("viewCompletedIntakePdf('old-1')"));
  assert.ok(table.includes("viewCompletedIntakePdf('empty-1')"));
  assert.ok(table.includes('title="PDF pending — load intake with signatures"'), 'empty View keeps the pending title');
  assert.ok(!table.split("viewCompletedIntakePdf('new-1')")[1].slice(0, 80).includes('PDF pending'), 'storage View is not marked pending');

  sandbox.nciCompletedRows = [{intakeId:'new-1', pdfStoragePath:storagePath, pdfLink:drive, pdfFileId:'drive-file-1'}];
  await sandbox.viewCompletedIntakePdf('new-1');
  assert.deepStrictEqual(signs, [storagePath], 'storage path is signed');
  assert.deepStrictEqual(opens, ['https://storage.example/sign/' + storagePath], 'signed URL opens');
  assert.strictEqual(gets.length, 0, 'storage row does not reload the intake');
  assert.ok(!opens.some(function(u){return u === drive;}), 'storage row does not open Drive');
  assert.strictEqual(sandbox.nciCompletedRows[0].pdfLink, drive, 'View does not wipe legacy pdfLink');
  assert.strictEqual(sandbox.nciCompletedRows[0].pdfFileId, 'drive-file-1', 'View does not wipe legacy pdfFileId');

  signs.length = 0;
  opens.length = 0;
  toasts.length = 0;
  sandbox._signError = 'sign denied';
  sandbox.nciCompletedRows = [{intakeId:'new-1', pdf_storage_path:'evercare-pdfs/' + storagePath, pdfLink:drive}];
  await sandbox.viewCompletedIntakePdf('new-1');
  assert.deepStrictEqual(signs, [storagePath], 'bucket prefix is stripped before sign');
  assert.deepStrictEqual(opens, [], 'sign failure does not open a URL');
  assert.strictEqual(toasts[0].msg, 'sign denied');
  assert.strictEqual(toasts[0].color, 'var(--danger)');
  sandbox._signError = '';

  opens.length = 0;
  signs.length = 0;
  toasts.length = 0;
  sandbox.nciCompletedRows = [{intakeId:'old-1', pdfLink:drive, pdfStoragePath:''}];
  await sandbox.viewCompletedIntakePdf('old-1');
  assert.deepStrictEqual(signs, [], 'drive-only row does not sign');
  assert.deepStrictEqual(opens, [drive], 'drive-only row opens Drive');

  opens.length = 0;
  signs.length = 0;
  sandbox.nciCompletedRows = [{intakeId:'snake', pdf_link:drive}];
  await sandbox.viewCompletedIntakePdf('snake');
  assert.deepStrictEqual(signs, [], 'pdf_link does not sign');
  assert.deepStrictEqual(opens, [drive], 'pdf_link opens Drive');

  opens.length = 0;
  gets.length = 0;
  toasts.length = 0;
  sandbox._got = {pdf_file_id:httpFile, pdfFileId:httpFile};
  sandbox.nciCompletedRows = [{intakeId:'httpf', pdf_file_id:httpFile, pdfFileId:httpFile}];
  await sandbox.viewCompletedIntakePdf('httpf');
  assert.deepStrictEqual(opens, [], 'pdf_file_id is not a Drive fallback');
  assert.deepStrictEqual(signs, [], 'pdf_file_id does not sign');
  assert.strictEqual(toasts[0].msg, 'PDF not ready yet');
  assert.strictEqual(sandbox.nciCompletedRows[0].pdfFileId, httpFile, 'View leaves pdf_file_id on the row');

  opens.length = 0;
  gets.length = 0;
  toasts.length = 0;
  sandbox._got = {pdf_file_id:'bareFileIdOnly'};
  sandbox.nciCompletedRows = [{intakeId:'bare', pdfFileId:'bareFileIdOnly'}];
  await sandbox.viewCompletedIntakePdf('bare');
  assert.deepStrictEqual(opens, [], 'bare pdf_file_id does not invent a Drive URL');
  assert.strictEqual(gets.length, 1, 'bare file id still loads the intake');
  assert.strictEqual(toasts[0].msg, 'PDF not ready yet');

  opens.length = 0;
  gets.length = 0;
  toasts.length = 0;
  sandbox._got = {success:true, pdfLink:'', pdfStoragePath:''};
  sandbox.nciCompletedRows = [{intakeId:'empty-1'}];
  await sandbox.viewCompletedIntakePdf('empty-1');
  assert.strictEqual(gets.length, 1, 'empty row loads the intake');
  assert.strictEqual(gets[0].opts.includeSignatures, true);
  assert.strictEqual(gets[0].opts.includeSigs, true);
  assert.deepStrictEqual(opens, [], 'empty row does not open Drive');
  assert.strictEqual(toasts[0].msg, 'PDF not ready yet');
  assert.strictEqual(toasts[0].color, 'var(--warn)');

  opens.length = 0;
  signs.length = 0;
  toasts.length = 0;
  sandbox._got = {pdf_storage_path:storagePath, pdfLink:drive};
  sandbox.nciCompletedRows = [{intakeId:'late-1'}];
  await sandbox.viewCompletedIntakePdf('late-1');
  assert.deepStrictEqual(signs, [storagePath], 'get storage path is signed');
  assert.deepStrictEqual(opens, ['https://storage.example/sign/' + storagePath]);
  assert.strictEqual(sandbox.nciLastCompletePdf.pdfStoragePath, storagePath);

  opens.length = 0;
  signs.length = 0;
  sandbox._got = {pdfLink:drive};
  sandbox.nciCompletedRows = [{intakeId:'late-drive'}];
  await sandbox.viewCompletedIntakePdf('late-drive');
  assert.deepStrictEqual(signs, [], 'get drive link is not signed');
  assert.deepStrictEqual(opens, [drive], 'get drive link opens Drive');

  console.log('nci-storage-pdf-view-test: ok');
})().catch(function(err){
  console.error(err && err.stack || err);
  process.exit(1);
});
