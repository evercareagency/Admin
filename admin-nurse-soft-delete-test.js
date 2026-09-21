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

const renderCompliance = extractFn(html, 'function renderNurseComplianceTable(rows)');
const hydrate = extractFn(html, 'function hydrateNurseComplianceRow(r,extra)');
const completedHtml = extractFn(html, 'function nciCompletedTableHtml(rows)');
const showConfirm = extractFn(html, 'function showSharedConfirm(title,onConfirm,confirmLabel)');
const hideConfirm = extractFn(html, 'function hideSharedConfirm()');
const nciShow = extractFn(html, 'function nciShowDiscard()');
const nciGo = extractFn(html, 'function nciConfirmDiscard()');
const postArchive = extractFn(html, 'async function postArchiveAction(primary,alias,payload,aliasExtra)');
const toastRes = extractFn(html, 'function toastArchiveResult(res,okMsg)');
const confirmClient = extractFn(html, 'function confirmDeleteComplianceClient(rowIndex)');
const archiveClient = extractFn(html, 'async function archiveComplianceClient(clientId)');
const confirmIntake = extractFn(html, 'function confirmDeleteCompletedIntake(intakeId)');
const archiveIntake = extractFn(html, 'async function archiveCompletedIntake(intakeId)');
const draftsHtml = extractFn(html, 'function nciDraftsListHtml(rows)');
const confirmDraft = extractFn(html, 'function confirmDeleteDraftIntake(intakeId)');
const archiveDraft = extractFn(html, 'async function archiveDraftIntake(intakeId)');
const clientIdOf = extractFn(html, 'function clientIdOfComplianceRow(r)');
const unknownFn = extractFn(html, 'function nciLooksLikeUnknownAction(text)');
const paintAdmin = extractFn(html, 'function paintAdminSupervisoryContacts()');

assert.ok(renderCompliance, 'renderNurseComplianceTable missing');
assert.ok(hydrate, 'hydrateNurseComplianceRow missing');
assert.ok(completedHtml, 'nciCompletedTableHtml missing');
assert.ok(showConfirm, 'showSharedConfirm missing');
assert.ok(hideConfirm, 'hideSharedConfirm missing');
assert.ok(nciShow, 'nciShowDiscard missing');
assert.ok(nciGo, 'nciConfirmDiscard missing');
assert.ok(postArchive, 'postArchiveAction missing');
assert.ok(toastRes, 'toastArchiveResult missing');
assert.ok(confirmClient, 'confirmDeleteComplianceClient missing');
assert.ok(archiveClient, 'archiveComplianceClient missing');
assert.ok(confirmIntake, 'confirmDeleteCompletedIntake missing');
assert.ok(archiveIntake, 'archiveCompletedIntake missing');
assert.ok(draftsHtml, 'nciDraftsListHtml missing');
assert.ok(confirmDraft, 'confirmDeleteDraftIntake missing');
assert.ok(archiveDraft, 'archiveDraftIntake missing');
assert.ok(clientIdOf, 'clientIdOfComplianceRow missing');

assert.ok(renderCompliance.includes('confirmDeleteComplianceClient'),
  'compliance Actions must include Delete');
assert.ok(renderCompliance.indexOf('viewSupervisoryVisitPdf') < renderCompliance.indexOf('confirmDeleteComplianceClient'),
  'Delete must sit under / after View PDF');
assert.ok(completedHtml.includes('confirmDeleteCompletedIntake'),
  'completed intakes must include Delete next to View/Edit');
assert.ok(completedHtml.indexOf('viewCompletedIntakePdf') < completedHtml.indexOf('confirmDeleteCompletedIntake'),
  'Delete must sit after View');
assert.ok(completedHtml.indexOf('editCompletedIntake') < completedHtml.indexOf('confirmDeleteCompletedIntake'),
  'Delete must sit after Edit');
assert.ok(draftsHtml.includes('confirmDeleteDraftIntake'),
  'draft intakes must include Delete next to Resume');
assert.ok(draftsHtml.indexOf('resumeNewClientIntake') < draftsHtml.indexOf('confirmDeleteDraftIntake'),
  'Delete must sit after Resume');

assert.ok(!/window\.confirm/.test(confirmClient+confirmIntake+confirmDraft+archiveClient+archiveIntake+archiveDraft+showConfirm),
  'must not use window.confirm');
assert.ok(!/\bconfirm\(/.test(confirmClient+confirmIntake+confirmDraft+archiveClient+archiveIntake+archiveDraft+showConfirm),
  'must not use confirm()');

assert.ok(showConfirm.includes("title||'Are you sure?'"),
  'shared confirm default title is Are you sure?');
assert.ok(showConfirm.includes("confirmLabel||'Yes, delete'"),
  'shared confirm default danger label is Yes, delete');
assert.ok(nciShow.includes("showSharedConfirm('Discard unsaved changes?'"),
  'discard must reuse shared confirm');
assert.ok(html.includes('id="nciDiscardConfirm"') && html.includes('nci-discard-page'),
  'shared confirm reuses #nciDiscardConfirm + page overlay CSS');
assert.ok(html.includes('class="nci-discard nci-discard-page"'),
  'page confirm uses nci-discard card pattern');

assert.ok(archiveClient.includes("postArchiveAction('archive_client','delete_client',{clientId:id},{id:id})"),
  'compliance delete posts archive_client { clientId }; alias delete_client { clientId } or { id }');
assert.ok(archiveIntake.includes("postArchiveAction('archive_new_client_intake','delete_new_client_intake',{intakeId:id})"),
  'intake delete posts archive_new_client_intake { intakeId } with delete alias');
assert.ok(archiveDraft.includes("postArchiveAction('archive_new_client_intake','delete_new_client_intake',{intakeId:id})"),
  'draft delete posts archive_new_client_intake { intakeId } with delete alias');
assert.ok(confirmDraft.includes("showSharedConfirm('Are you sure?'"),
  'draft delete uses shared Are you sure? card');
assert.ok(confirmDraft.includes("archiveDraftIntake(id)"),
  'draft confirm Yes calls archiveDraftIntake');
assert.ok(archiveClient.includes('loadNurseCompliance(true)'),
  'client archive success refreshes compliance list');
assert.ok(archiveIntake.includes('refreshCompletedNewClientIntakes()'),
  'intake archive success refreshes completed list');
assert.ok(archiveDraft.includes('loadNewClientIntakeDrafts()'),
  'draft archive success refreshes drafts list');
assert.ok(!/hard.?delete|delete_client',id/.test(archiveClient+archiveIntake+archiveDraft+postArchive),
  'must not invent hard-delete or old delete_client {id} payload');
assert.ok(toastRes.includes('data.error'),
  'fail toast uses data.error');
assert.ok(toastRes.includes("'Unknown action: '"),
  'Unknown action must toast clearly');

assert.ok(hydrate.includes("scField(r,'ClientId','clientId')"),
  'hydrate must keep ClientId/clientId');
assert.ok(hydrate.includes('r.id'),
  'hydrate must also accept id');
assert.ok(clientIdOf.includes('r.clientId') && clientIdOf.includes('r.ClientId') && clientIdOf.includes('r.id'),
  'delete helper reads clientId / ClientId / id');

assert.ok(!/confirmDeleteComplianceClient|archiveComplianceClient|archive_client/.test(paintAdmin),
  'Admin supervisory contacts list must not get client Delete');

assert.ok(completedHtml.includes("nciIntakeIdOf(r)"),
  'completed Delete uses nciIntakeIdOf');
assert.ok(draftsHtml.includes("nciIntakeIdOf(r)"),
  'draft Delete uses nciIntakeIdOf');
assert.ok(html.includes("action:'list_new_client_intakes',nurseName:currentNurseName||'',status:'Draft'"),
  'drafts list stays status Draft so Ace excludes Archived');
assert.ok(html.includes("{action:'get_supervisory_compliance'}"),
  'compliance refresh must not pass includeInactive');
assert.ok(html.includes("action:'list_new_client_intakes',status:'Complete'"),
  'completed list stays status Complete so Ace excludes Archived');

// Runtime: shared confirm + archive fallback + toasts
const els = {};
function makeEl(id, text){
  const el = {
    id,
    hidden: true,
    textContent: text || '',
    style: {display: 'none'},
    classList: {
      _s: new Set(),
      add(c){ this._s.add(c); },
      remove(c){ this._s.delete(c); },
      contains(c){ return this._s.has(c); }
    }
  };
  els[id] = el;
  return el;
}
makeEl('nciDiscardConfirm');
makeEl('nciDiscardTitle', 'Discard unsaved changes?');
makeEl('nciDiscardGoBtn', 'Discard');

function nciEl(id){ return els[id] || null; }
let _sharedConfirmOnYes = null;
const toasts = [];
function showTempMsg(msg, color){ toasts.push({msg, color}); }
function nciLooksLikeUnknownAction(text){
  return /unknown action|not implemented|stub action/i.test(String(text||''));
}

eval('globalThis.showSharedConfirm = '+showConfirm);
eval('globalThis.hideSharedConfirm = '+hideConfirm);
eval('globalThis.nciConfirmDiscard = '+nciGo);

let ran = false;
showSharedConfirm('Are you sure?', function(){ ran = true; }, 'Yes, delete');
assert.strictEqual(els.nciDiscardConfirm.hidden, false, 'confirm is shown');
assert.ok(els.nciDiscardConfirm.classList.contains('show'), 'confirm has .show');
assert.strictEqual(els.nciDiscardTitle.textContent, 'Are you sure?');
assert.strictEqual(els.nciDiscardGoBtn.textContent, 'Yes, delete');
nciConfirmDiscard();
assert.strictEqual(ran, true, 'Yes, delete runs onConfirm');
assert.strictEqual(els.nciDiscardConfirm.hidden, true, 'confirm hides after Yes');

showSharedConfirm('Are you sure?', function(){ ran = false; }, 'Yes, delete');
hideSharedConfirm();
assert.strictEqual(els.nciDiscardConfirm.hidden, true, 'Cancel hides confirm');
assert.strictEqual(_sharedConfirmOnYes, null, 'Cancel clears callback');

const posts = [];
let apiImpl = async function(payload){
  posts.push(payload);
  return {success: true};
};
async function apiPost(payload){ return apiImpl(payload); }

eval('globalThis.postArchiveAction = '+postArchive);
eval('globalThis.toastArchiveResult = '+toastRes);

(async function(){
  posts.length = 0;
  toasts.length = 0;
  let res = await postArchiveAction('archive_client','delete_client',{clientId:'C1'});
  assert.deepStrictEqual(posts, [{action:'archive_client',clientId:'C1'}]);
  assert.ok(toastArchiveResult(res,'Client deleted.'));
  assert.strictEqual(toasts[0].msg, 'Client deleted.');

  posts.length = 0;
  toasts.length = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    if(payload.action==='archive_client')return {success:false,error:'Unknown action'};
    if(payload.action==='delete_client')return {success:true};
    return {success:false,error:'nope'};
  };
  res = await postArchiveAction('archive_client','delete_client',{clientId:'C2'},{id:'C2'});
  assert.strictEqual(posts[0].action, 'archive_client');
  assert.deepStrictEqual(posts[0], {action:'archive_client',clientId:'C2'});
  assert.strictEqual(posts[1].action, 'delete_client');
  assert.strictEqual(posts[1].clientId, 'C2');
  assert.strictEqual(posts[1].id, 'C2');
  assert.ok(toastArchiveResult(res,'Client deleted.'));

  posts.length = 0;
  toasts.length = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    return {success:false,error:'Unknown action'};
  };
  res = await postArchiveAction('archive_new_client_intake','delete_new_client_intake',{intakeId:'I9'});
  assert.strictEqual(posts[0].action, 'archive_new_client_intake');
  assert.strictEqual(posts[1].action, 'delete_new_client_intake');
  assert.strictEqual(posts[0].intakeId, 'I9');
  assert.strictEqual(toastArchiveResult(res,'Intake deleted.'), false);
  assert.strictEqual(toasts[0].msg, 'Unknown action');
  assert.strictEqual(toasts[0].color, 'var(--danger)');

  posts.length = 0;
  toasts.length = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    return {success:false,error:'Client already archived'};
  };
  res = await postArchiveAction('archive_client','delete_client',{clientId:'C3'});
  assert.strictEqual(posts.length, 1, 'do not fall back unless Unknown action');
  assert.strictEqual(toastArchiveResult(res,'Client deleted.'), false);
  assert.strictEqual(toasts[0].msg, 'Client already archived');

  function clientIdOfComplianceRow(r){
    if(!r)return '';
    const id=r.clientId||r.ClientId||r.id||'';
    return id==null?'':String(id);
  }
  assert.strictEqual(clientIdOfComplianceRow({clientId:'a'}),'a');
  assert.strictEqual(clientIdOfComplianceRow({ClientId:'b'}),'b');
  assert.strictEqual(clientIdOfComplianceRow({id:'c'}),'c');

  function nciPickIntakeId(obj){
    if(!obj||typeof obj!=='object')return '';
    return String(obj.intakeId||obj.IntakeId||obj.id||'');
  }
  function nciIntakeIdOf(r){ return nciPickIntakeId(r); }
  assert.strictEqual(nciIntakeIdOf({intakeId:'N1'}),'N1');

  let draftsRefresh = 0;
  async function loadNewClientIntakeDrafts(){ draftsRefresh++; }
  eval('globalThis.archiveDraftIntake = '+archiveDraft);
  eval('globalThis.confirmDeleteDraftIntake = '+confirmDraft);

  posts.length = 0;
  toasts.length = 0;
  draftsRefresh = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    return {success:true,intakeId:payload.intakeId,status:'Archived'};
  };
  let draftOk = await archiveDraftIntake('D1');
  assert.strictEqual(draftOk, true);
  assert.deepStrictEqual(posts, [{action:'archive_new_client_intake',intakeId:'D1'}]);
  assert.strictEqual(toasts[0].msg, 'Intake deleted.');
  assert.strictEqual(draftsRefresh, 1, 'success refreshes drafts so the row disappears');

  posts.length = 0;
  toasts.length = 0;
  draftsRefresh = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    return {success:false,error:'Client already archived'};
  };
  draftOk = await archiveDraftIntake('D2');
  assert.strictEqual(draftOk, false);
  assert.strictEqual(posts.length, 1, 'draft fail does not invent extra fields or alias unless Unknown action');
  assert.strictEqual(draftsRefresh, 0, 'failed archive leaves the draft');
  assert.strictEqual(toasts[0].msg, 'Client already archived');

  confirmDeleteDraftIntake('D3');
  assert.strictEqual(els.nciDiscardConfirm.hidden, false, 'draft Delete shows Are you sure?');
  assert.strictEqual(els.nciDiscardTitle.textContent, 'Are you sure?');
  assert.strictEqual(els.nciDiscardGoBtn.textContent, 'Yes, delete');
  hideSharedConfirm();
  assert.strictEqual(els.nciDiscardConfirm.hidden, true, 'Cancel leaves the draft');
  assert.strictEqual(_sharedConfirmOnYes, null, 'Cancel does not archive');

  console.log('admin-nurse-soft-delete-test: ok');
})().catch(function(e){
  console.error(e);
  process.exit(1);
});
