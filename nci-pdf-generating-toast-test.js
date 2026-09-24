#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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
const save = extractFn(html, 'async function saveNewClientIntake(status)');
const ensure = extractFn(html, 'async function nciEnsureCompletePdf(intakeId,priorPdfError)');

assert.ok(save, 'saveNewClientIntake not found');
assert.ok(ensure, 'nciEnsureCompletePdf not found');

assert.ok(save.includes("showTempMsg('Saved — PDF generating','var(--success)',0)"),
  'Complete followup must show exact sticky toast Saved — PDF generating');

const follow = save.slice(save.indexOf('pdfPending / empty pdfLink'));
const toastAt = follow.indexOf("showTempMsg('Saved — PDF generating'");
const closeAt = follow.indexOf('closeNewClientIntake(true)');
const draftsAt = follow.indexOf('loadNewClientIntakeDrafts()');
const listAt = follow.indexOf('loadCompletedNewClientIntakes()');
assert.ok(toastAt >= 0 && closeAt > toastAt, 'generating toast must appear before closeNewClientIntake');
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

function showTempMsg(msg, color, holdMs) {
  toasts.push({msg, color, holdMs, at: Date.now()});
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

const nciEnsureCompletePdf = eval('(' + ensure + ')');

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

  const saveOrder = await runSaveOrder();

  console.log('nci-pdf-generating-toast-test: ok');
  console.log(JSON.stringify({early, mid, late, readyMsgs, calls, saveOrder}, null, 2));
}

async function runSaveOrder(){
  const events = [];
  let nciSaving = false;
  const nciState = {intakeId:''};
  const nciWizardMode = 'new';
  let nciDirty = true;
  let nciLastCompletePdf = null;
  function nciShowErr(){}
  function nciSetSaving(){}
  function collectNewClientIntake(){ return {action:'save_new_client_intake',status:'Complete'}; }
  function validateNewClientIntake(){ return []; }
  async function apiPost(){
    await nciSleep(5);
    return {success:true,intakeId:'77',status:'Complete',pdfPending:true,pdfLink:''};
  }
  function nciForceIntakeId(data){ nciState.intakeId = String(data.intakeId||''); }
  function nciSaveFailWhy(){ return 'Save failed.'; }
  function nciEchoStatus(){ return 'Complete'; }
  function nciArchiveIntakeId(data){ return String((data&&data.intakeId)||''); }
  function nciCaptureClean(){}
  function nciPickPdfMeta(){ return {intakeId:'77',pdfLink:'',pdfFileId:'',pdfError:'',pdfPending:true}; }
  function nciPdfNeedsFollowup(){ return true; }
  function nciRememberCompletePdf(){ events.push('remember'); }
  function nciLooksLikeUnknownAction(){ return false; }
  function nciFail(msg){ events.push('fail:'+msg); }
  function nciEnsureCompletePdf(id){
    events.push('ensure:'+id);
    return new Promise(function(resolve){ setTimeout(resolve, 400); });
  }
  function closeNewClientIntake(){ events.push('close'); }
  function loadNewClientIntakeDrafts(){ events.push('drafts'); }
  function nciInvalidateCompleteListCache(){ events.push('invalidate-list'); }
  function loadCompletedNewClientIntakes(){ events.push('list'); }
  function showTempMsg(msg){ events.push('toast:'+msg); }
  const saveNewClientIntake = eval('('+save+')');

  const saveStarted = Date.now();
  await saveNewClientIntake('Complete');
  const saveMs = Date.now() - saveStarted;
  assert.ok(saveMs < 200, 'Complete save must not await archive/ensure hang, took '+saveMs+'ms');
  const toastI = events.indexOf('toast:Saved — PDF generating');
  const closeI = events.indexOf('close');
  const listI = events.indexOf('list');
  const ensureI = events.findIndex(function(e){ return String(e).indexOf('ensure:')===0; });
  assert.ok(toastI >= 0, 'Complete pdfPending must toast Saved — PDF generating');
  assert.ok(closeI > toastI, 'toast must fire before close');
  assert.ok(listI > toastI, 'toast must fire before list reload');
  assert.ok(ensureI > toastI, 'ensure starts after generating toast');
  assert.ok(events.includes('ensure:77'), 'ensure must be started');
  return {events, saveMs};
}

run().catch(function(err){
  console.error(err && err.stack || err);
  process.exit(1);
});
