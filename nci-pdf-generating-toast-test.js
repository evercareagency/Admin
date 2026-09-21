#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const saveFn = html.match(/async function saveNewClientIntake\(status\)\{[\s\S]*?\n\}/);
const ensureFn = html.match(/async function nciEnsureCompletePdf\(intakeId,priorPdfError\)\{[\s\S]*?\n\}/);

assert.ok(saveFn, 'saveNewClientIntake not found');
assert.ok(ensureFn, 'nciEnsureCompletePdf not found');

const save = saveFn[0];
const ensure = ensureFn[0];

assert.ok(save.includes("showTempMsg('Saved — PDF generating','var(--success)',0)"),
  'Complete followup must show exact sticky toast Saved — PDF generating');

const toastAt = save.indexOf("showTempMsg('Saved — PDF generating'");
const closeAt = save.indexOf('closeNewClientIntake(true)');
const draftsAt = save.indexOf('loadNewClientIntakeDrafts()');
const listAt = save.indexOf('loadCompletedNewClientIntakes()');
assert.ok(toastAt > 0 && closeAt > toastAt, 'generating toast must appear before closeNewClientIntake');
assert.ok(draftsAt > toastAt && listAt > toastAt, 'generating toast must appear before list reload');
assert.ok(!/await\s+nciEnsureCompletePdf/.test(save), 'save must not await nciEnsureCompletePdf');
assert.ok(!/await\s+archiveNewClientIntakePdf/.test(save), 'save must not await archive');
assert.ok(!/await\s+nciCallArchivePdf/.test(save), 'save must not await archive helper');

assert.ok(!/const first=await nciCallArchivePdf/.test(ensure), 'ensure must not await archive first');
assert.ok(ensure.includes("showTempMsg('PDF ready','var(--success)')"), 'must keep PDF ready toast');
assert.ok(ensure.includes("'PDF not ready yet'"), 'interim warn must use PDF not ready yet');
assert.ok(/NCI_PDF_INTERIM_WARN_MS/.test(html), 'interim warn delay constant missing');
assert.ok(/const NCI_PDF_INTERIM_WARN_MS=8000/.test(html), 'interim warn must be ~8s');

const toasts = [];
const calls = {archive: 0, get: 0};

function el(id) {
  return {
    id,
    style: {cssText: '', display: 'none'},
    textContent: '',
    setAttribute: function(){},
    parentNode: global.document.body
  };
}
const toastEl = el('nciToast');
global.document = {
  body: {appendChild: function(){}},
  getElementById: function(id){ return id === 'nciToast' ? toastEl : null; },
  createElement: function(){ return toastEl; }
};

function showTempMsg(msg, color, holdMs) {
  toasts.push({msg, color, holdMs, at: Date.now()});
  toastEl.textContent = msg;
}
function nciStr(v){ return v == null ? '' : String(v).trim(); }
function nciSleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function nciPickPdfMeta(obj){
  if(!obj||typeof obj!=='object')return {intakeId:'',pdfLink:'',pdfFileId:'',pdfError:'',pdfPending:false};
  return {
    intakeId:nciStr(obj.intakeId),
    pdfLink:nciStr(obj.pdfLink),
    pdfFileId:nciStr(obj.pdfFileId),
    pdfError:nciStr(obj.pdfError),
    pdfPending:!!obj.pdfPending
  };
}
function nciArchiveHardError(archived, err){
  if(err)return nciStr(err.message)||'PDF archive failed';
  if(archived && archived.pdfError)return nciStr(archived.pdfError);
  if(archived && archived.success === false)return nciStr(archived.error||archived.message)||'PDF archive failed';
  return '';
}
function nciApplyCompletePdf(){}
function loadCompletedNewClientIntakes(){ return Promise.resolve(); }
function nciLogArchiveShape(){}
const NCI_PDF_POLL_MS = 250;
const NCI_ARCHIVE_RETRY_MS = 30;
const NCI_PDF_INTERIM_WARN_MS = 80;

let archivePayload = {success:true, pdfPending:true, pdfLink:''};
let getPayloads = [{success:true, pdfPending:true, pdfLink:''}];
let getIdx = 0;

async function archiveNewClientIntakePdf(){
  calls.archive++;
  await nciSleep(5);
  return archivePayload;
}
async function nciCallArchivePdf(intakeId){
  try{
    const archived = await archiveNewClientIntakePdf(intakeId);
    return {archived:archived, meta:nciPickPdfMeta(archived), err:null};
  }catch(err){
    return {archived:null, meta:null, err:err};
  }
}
async function nciPollCompletePdfLink(){
  const deadline = Date.now() + NCI_PDF_POLL_MS;
  while(Date.now() < deadline){
    calls.get++;
    const got = getPayloads[Math.min(getIdx, getPayloads.length-1)];
    getIdx++;
    const meta = nciPickPdfMeta(got);
    if(meta.pdfLink)return meta;
    await nciSleep(15);
  }
  return null;
}

eval(ensure.replace('async function nciEnsureCompletePdf', 'async function nciEnsureCompletePdf'));

async function run(){
  const t0 = Date.now();
  const hang = nciEnsureCompletePdf('99', '');
  const returnedFast = (Date.now() - t0) < 20;
  assert.ok(returnedFast || typeof hang.then === 'function', 'ensure returns a promise and does not block save');

  await nciSleep(25);
  const early = toasts.map(t => t.msg);
  assert.ok(!early.includes('PDF not ready yet'), 'must not show PDF not ready yet within <2s (here <25ms scaled)');
  assert.ok(!early.includes('PDF ready'), 'pdfLink has not landed yet');

  await nciSleep(70);
  const mid = toasts.map(t => t.msg);
  assert.ok(mid.includes('PDF not ready yet'), 'PDF not ready yet after ~8s (80ms scaled)');

  getPayloads.push({success:true, pdfLink:'https://files.example/nci.pdf', pdfFileId:'f1'});
  await hang;
  const late = toasts.map(t => t.msg);
  assert.ok(late.includes('PDF ready'), 'PDF ready when pdfLink lands');
  assert.ok(calls.archive >= 1, 'archive must fire');
  assert.ok(calls.archive <= 3, 'archive retry stays bounded');

  toasts.length = 0;
  calls.archive = 0;
  getIdx = 0;
  archivePayload = {success:true, pdfLink:'https://files.example/fast.pdf', pdfFileId:'f2'};
  getPayloads = [{success:true, pdfLink:'https://files.example/fast.pdf', pdfFileId:'f2'}];
  await nciEnsureCompletePdf('100', '');
  await nciSleep(100);
  const readyMsgs = toasts.map(t => t.msg);
  assert.ok(readyMsgs.includes('PDF ready'), 'fast pdfLink still toasts PDF ready');
  assert.ok(!readyMsgs.includes('PDF not ready yet'), 'ready path must not show interim warn');

  console.log('nci-pdf-generating-toast-test: ok');
  console.log(JSON.stringify({early, mid, late, readyMsgs, calls}, null, 2));
}

run().catch(function(err){
  console.error(err && err.stack || err);
  process.exit(1);
});
