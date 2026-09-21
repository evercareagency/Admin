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
const paintAdmin = extractFn(html, 'function paintAdminSupervisoryContacts()');
const openForm = extractFn(html, 'async function openSupervisoryContactForm(contactType,rowIndex,existing)');
const saveFn = extractFn(html, 'async function saveSupervisoryContact()');
const confirmVisit = extractFn(html, 'function confirmDeleteSupervisoryContact(contactId)');
const archiveVisit = extractFn(html, 'async function archiveSupervisoryContact(contactId)');
const archiveClient = extractFn(html, 'async function archiveComplianceClient(clientId)');
const fetchCt = extractFn(html, 'async function fetchSupervisoryContact(contactId)');
const editFn = extractFn(html, 'async function editSupervisoryContact(contactId,rowIndex)');
const applyFields = extractFn(html, 'function scApplyContactFields(ct)');
const toIso = extractFn(html, 'function toISODateInput(val)');
const unwrap = extractFn(html, 'function scUnwrapContact(data)');
const pickSig = extractFn(html, 'function pickSignatureData(obj)');
const stash = extractFn(html, 'function rememberNurseVisitStash(row)');
const applyStash = extractFn(html, 'function applyNurseVisitStash(row)');
const loadAdmin = extractFn(html, 'async function loadAdminNurseSection()');
const showConfirm = extractFn(html, 'function showSharedConfirm(title,onConfirm,confirmLabel)');
const postArchive = extractFn(html, 'async function postArchiveAction(primary,alias,payload,aliasExtra)');
const toastRes = extractFn(html, 'function toastArchiveResult(res,okMsg)');

assert.ok(renderCompliance, 'renderNurseComplianceTable missing');
assert.ok(hydrate, 'hydrateNurseComplianceRow missing');
assert.ok(paintAdmin, 'paintAdminSupervisoryContacts missing');
assert.ok(openForm, 'openSupervisoryContactForm missing');
assert.ok(saveFn, 'saveSupervisoryContact missing');
assert.ok(confirmVisit, 'confirmDeleteSupervisoryContact missing');
assert.ok(archiveVisit, 'archiveSupervisoryContact missing');
assert.ok(archiveClient, 'archiveComplianceClient missing');
assert.ok(fetchCt, 'fetchSupervisoryContact missing');
assert.ok(editFn, 'editSupervisoryContact missing');
assert.ok(applyFields, 'scApplyContactFields missing');
assert.ok(toIso, 'toISODateInput missing');
assert.ok(unwrap, 'scUnwrapContact missing');
assert.ok(pickSig, 'pickSignatureData missing');

// Nurse Compliance: create stays create; Edit/Delete when contactId known
assert.ok(renderCompliance.includes("openSupervisoryContactForm('Visit'"),
  'Log Visit stays create (no contactId)');
assert.ok(renderCompliance.includes("openSupervisoryContactForm('PhoneCall'"),
  'Log Phone Call stays create (no contactId)');
assert.ok(renderCompliance.includes('viewSupervisoryVisitPdf'),
  'View PDF stays on compliance row');
assert.ok(renderCompliance.includes('Edit Visit') && renderCompliance.includes('editSupervisoryContact'),
  'Edit Visit when last visit contactId known');
assert.ok(renderCompliance.includes('Edit Call'),
  'Edit Call when last phone contactId known');
assert.ok(renderCompliance.includes('Delete Visit') && renderCompliance.includes('confirmDeleteSupervisoryContact'),
  'Delete Visit is contact-level');
assert.ok(renderCompliance.includes('Delete Call'),
  'Delete Call is contact-level');
assert.ok(renderCompliance.includes('Archive Client') && renderCompliance.includes('confirmDeleteComplianceClient'),
  'client archive stays separate (renamed from row Delete)');
assert.ok(renderCompliance.indexOf('viewSupervisoryVisitPdf(${i})') < renderCompliance.indexOf('${editVisit}'),
  'Edit sits after View PDF');
assert.ok(renderCompliance.indexOf('${delVisit}') < renderCompliance.indexOf('confirmDeleteComplianceClient'),
  'visit Delete sits before Archive Client');

assert.ok(hydrate.includes("LastPhoneCallContactId") && hydrate.includes('lastPhoneCallContactId'),
  'hydrate reads last phone contact id');
assert.ok(!/lastVisitContactId:String\(scField\(r,'LastVisitContactId','lastVisitContactId'\)\|\|scField\(r,'LastContactId'/.test(hydrate),
  'last visit id must not silently steal lastContactId (could be a call)');
assert.ok(stash.includes('lastPhoneCallContactId') && applyStash.includes('lastPhoneCallContactId'),
  'stash remembers last phone contact id');

assert.ok(openForm.includes("document.getElementById('sc_contactId').value=contactId||''"),
  'create clears contactId; edit sets it');
assert.ok(openForm.includes("scApplyContactFields(ct)"),
  'edit hydrates fields from saved contact');
assert.ok(openForm.includes('paintNurseSig') && openForm.includes('pickSignatureData'),
  'edit paints sig pads from saved data URLs');
assert.ok(openForm.includes("'Edit'") || openForm.includes('Edit Visit') || openForm.includes("'Edit':'Log'"),
  'edit title uses Edit, create uses Log');

assert.ok(saveFn.includes('scEditingContactId()'),
  'save reads hidden contactId');
assert.ok(saveFn.includes('payload.contactId=editingId'),
  'save with contactId is the update path');
assert.ok(saveFn.includes("action:'archive_supervisory_visit_pdf'"),
  'after successful edit, re-archive visit PDF');
assert.ok(saveFn.includes('editingId&&!savedPdf'),
  'skip re-archive when Ace already returned pdfLink');
assert.ok(saveFn.includes('toEasternMDY'),
  'saved dates stay MM/DD/YYYY');
assert.ok(saveFn.includes("currentAdminRole==='Admin'||currentAdminRole==='Scheduler'"),
  'Admin/Scheduler refresh their list after save');

assert.ok(fetchCt.includes("action:'get_supervisory_contact'"),
  'hydrate fetches get_supervisory_contact { contactId }');
assert.ok(fetchCt.includes('resolveSupervisoryContactFromList'),
  'falls back to list row when get is incomplete or stub');
assert.ok(fetchCt.includes('Unknown action: get_supervisory_contact'),
  'stub toast if get_supervisory_contact Version is not live');

assert.ok(confirmVisit.includes("showSharedConfirm('Are you sure?'"),
  'visit delete uses in-DOM Are you sure?');
assert.ok(confirmVisit.includes('archiveSupervisoryContact(id)'),
  'Yes, delete archives the contact');
assert.ok(archiveVisit.includes("postArchiveAction('archive_supervisory_contact'"),
  'visit delete posts archive_supervisory_contact { contactId }');
assert.ok(archiveVisit.includes('{contactId:id}'),
  'archive_supervisory_contact payload is { contactId }');
assert.ok(!archiveVisit.includes('archive_client'),
  'visit delete must not use archive_client');
assert.ok(archiveClient.includes("postArchiveAction('archive_client','delete_client',{clientId:id}"),
  'Archive Client still posts archive_client { clientId }');

assert.ok(!/window\.confirm/.test(confirmVisit+archiveVisit+openForm+saveFn),
  'must not use window.confirm');
assert.ok(!/\bconfirm\(/.test(confirmVisit+archiveVisit),
  'must not use confirm()');

// Admin + Scheduler Nurse tab
assert.ok(paintAdmin.includes('viewAdminSupervisoryPdf'),
  'Admin/Scheduler keep View PDF');
assert.ok(paintAdmin.includes('editSupervisoryContact'),
  'Admin/Scheduler row Edit');
assert.ok(paintAdmin.includes('confirmDeleteSupervisoryContact'),
  'Admin/Scheduler row Delete');
assert.ok(paintAdmin.indexOf('viewAdminSupervisoryPdf') < paintAdmin.indexOf('editSupervisoryContact'),
  'Admin Edit sits after View PDF');
assert.ok(paintAdmin.indexOf('editSupervisoryContact') < paintAdmin.indexOf('confirmDeleteSupervisoryContact'),
  'Admin Delete sits after Edit');
assert.ok(!/confirmDeleteComplianceClient|archiveComplianceClient|archive_client/.test(paintAdmin),
  'Admin supervisory list must not archive the client');
assert.ok(!/currentAdminRole\s*===\s*'Admin'/.test(paintAdmin+editFn+confirmVisit+archiveVisit),
  'no Admin-only gate on Edit/Delete');
assert.ok(loadAdmin.includes("currentAdminRole!=='Admin'&&currentAdminRole!=='Scheduler'"),
  'Nurse tab still loads for Admin and Scheduler');
assert.ok(html.includes('Admin and Scheduler have the same actions'),
  'UI copy states Scheduler matches Admin');
assert.ok(!/correction|send-back|sendBack/i.test(saveFn+editFn+archiveVisit),
  'no Correction send-back flow');

assert.ok(html.includes('id="sc_contactId"'),
  'hidden contactId field on the existing modal');
assert.ok(applyFields.includes("scField(ct,'ContactDate','contactDate')"),
  'hydrate reads Ace contactDate');
assert.ok(applyFields.includes('sc_pc_') && applyFields.includes('sc_perf_'),
  'hydrate fills personal care + performance grids');

// Runtime
const els = {};
function makeEl(id, text, tag){
  const el = {
    id,
    tagName: (tag||'DIV').toUpperCase(),
    hidden: true,
    value: '',
    textContent: text || '',
    innerHTML: '',
    style: {display: 'none'},
    options: [],
    classList: {
      _s: new Set(),
      add(c){ this._s.add(c); },
      remove(c){ this._s.delete(c); },
      contains(c){ return this._s.has(c); }
    },
    appendChild(child){
      if(this.tagName==='SELECT' && child){
        this.options.push({value:child.value,textContent:child.textContent});
      }
    }
  };
  els[id] = el;
  return el;
}
makeEl('nciDiscardConfirm');
makeEl('nciDiscardTitle', 'Discard unsaved changes?');
makeEl('nciDiscardGoBtn', 'Discard');
makeEl('nurseComplianceBody');
makeEl('nurseComplianceEmpty');
makeEl('adminSupervisoryBody');
makeEl('sc_contactId', '', 'input');

function nciEl(id){ return els[id] || null; }
let _sharedConfirmOnYes = null;
const toasts = [];
function showTempMsg(msg, color){ toasts.push({msg, color}); }
function nciLooksLikeUnknownAction(text){
  return /unknown action|not implemented|stub action/i.test(String(text||''));
}
function cacheInvalidate(){}
async function loadNurseCompliance(){ loadNurseCompliance.calls = (loadNurseCompliance.calls||0)+1; }
async function loadAdminSupervisoryContacts(){ loadAdminSupervisoryContacts.calls = (loadAdminSupervisoryContacts.calls||0)+1; }

eval('globalThis.showSharedConfirm = '+showConfirm);
eval('globalThis.hideSharedConfirm = '+extractFn(html, 'function hideSharedConfirm()'));
eval('globalThis.nciConfirmDiscard = '+extractFn(html, 'function nciConfirmDiscard()'));

function scField(row,pascal,camel){
  if(!row)return undefined;
  if(row[pascal]!==undefined&&row[pascal]!==null&&row[pascal]!=='')return row[pascal];
  if(row[camel]!==undefined&&row[camel]!==null&&row[camel]!=='')return row[camel];
  return row[pascal]??row[camel];
}
function pickVisitPdfLink(obj){
  if(!obj)return '';
  const v=obj.visitPdfLink||obj.pdfLink||'';
  return String(v||'').trim();
}
function pickContactId(obj){
  if(!obj)return '';
  const v=obj.contactId??obj.ContactId??obj.lastVisitContactId??obj.lastContactId??'';
  if(v==null||v==='')return '';
  return String(v);
}
function nurseClientKey(row){
  const id=String(row&&row.clientId||'').trim();
  if(id)return 'id:'+id;
  return 'name:'+String(row&&row.clientName||'').trim().toLowerCase();
}
function deriveNurseStatus(visits,calls){
  const vOk=visits>=2,cOk=calls>=4;
  if(vOk&&cOk)return 'On track';
  if(!vOk&&!cOk)return 'Behind';
  if(!vOk)return 'Needs visits';
  return 'Needs calls';
}
function nurseStatusBadge(status){ return String(status||''); }
function escapeHtml(str){
  return String(str==null?'':str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str){ return escapeHtml(str).replace(/'/g,'&#39;'); }

let nurseVisitPdfStash = {};
eval('globalThis.rememberNurseVisitStash = '+stash);
eval('globalThis.applyNurseVisitStash = '+applyStash);
eval('globalThis.hydrateNurseComplianceRow = '+hydrate);
eval('globalThis.toISODateInput = '+toIso);
eval('globalThis.scUnwrapContact = '+unwrap);
eval('globalThis.pickSignatureData = '+pickSig);

assert.strictEqual(toISODateInput('09/21/2026'), '2026-09-21');
assert.strictEqual(toISODateInput('2026-09-21'), '2026-09-21');
assert.strictEqual(toISODateInput('9/7/2026'), '2026-09-07');

const unwrapped = scUnwrapContact({success:true,contact:{contactId:'77',clientName:'Pat'}});
assert.strictEqual(unwrapped.contactId, '77');
assert.strictEqual(scUnwrapContact({success:true,data:{ContactId:'88',ClientName:'Jo'}}).ContactId, '88');

const sigs = pickSignatureData({
  clientSignatureData:'data:image/png;base64,aaa',
  SupervisorSignatureData:'data:image/png;base64,bbb'
});
assert.strictEqual(sigs.client, 'data:image/png;base64,aaa');
assert.strictEqual(sigs.supervisor, 'data:image/png;base64,bbb');

const row = hydrateNurseComplianceRow({
  clientId:'C1', clientName:'Ada', visits:1, countingCalls:2,
  lastVisitContactId:'V9', lastPhoneCallContactId:'P3'
});
assert.strictEqual(row.lastVisitContactId, 'V9');
assert.strictEqual(row.lastPhoneCallContactId, 'P3');
const onlyLast = hydrateNurseComplianceRow({
  clientId:'C2', clientName:'Bo', lastContactId:'X1'
});
assert.strictEqual(onlyLast.lastVisitContactId, '');
assert.strictEqual(onlyLast.lastContactId, 'X1');

const tbody = els.nurseComplianceBody;
const empty = els.nurseComplianceEmpty;
function documentGet(id){
  if(id==='nurseComplianceBody')return tbody;
  if(id==='nurseComplianceEmpty')return empty;
  return els[id]||null;
}
global.document = {getElementById: documentGet};

eval('globalThis.renderNurseComplianceTable = '+renderCompliance);
renderNurseComplianceTable([row]);
assert.ok(tbody.innerHTML.includes('Log Visit') && tbody.innerHTML.includes('Log Phone Call'),
  'create buttons always present');
assert.ok(tbody.innerHTML.includes('Edit Visit') && tbody.innerHTML.includes("editSupervisoryContact('V9',0)"),
  'Edit Visit wired to last visit contactId');
assert.ok(tbody.innerHTML.includes('Edit Call') && tbody.innerHTML.includes("editSupervisoryContact('P3',0)"),
  'Edit Call wired to last phone contactId');
assert.ok(tbody.innerHTML.includes('Delete Visit') && tbody.innerHTML.includes("confirmDeleteSupervisoryContact('V9')"),
  'Delete Visit uses contactId');
assert.ok(tbody.innerHTML.includes('Archive Client') && tbody.innerHTML.includes('confirmDeleteComplianceClient(0)'),
  'Archive Client stays client-level');
assert.ok(!/>Delete</.test(tbody.innerHTML.replace(/Delete Visit|Delete Call/g,'')),
  'row Delete is no longer a client archive button');

renderNurseComplianceTable([{clientId:'C0',clientName:'New',visits:0,countingCalls:0,daysInWindow:60,status:'Needs visits'}]);
assert.ok(!tbody.innerHTML.includes('Edit Visit') && !tbody.innerHTML.includes('Edit Call'),
  'Edit hidden when contactId unknown');
assert.ok(!tbody.innerHTML.includes('Delete Visit') && !tbody.innerHTML.includes('Delete Call'),
  'visit Delete hidden when contactId unknown');
assert.ok(tbody.innerHTML.includes('Archive Client') && tbody.innerHTML.includes('Log Visit'),
  'create + client archive still show without a contactId');

eval('globalThis.paintAdminSupervisoryContacts = '+paintAdmin);
function scContactTypeBadge(){ return 'Visit'; }
globalThis.scField = scField;
globalThis.pickContactId = pickContactId;
globalThis.pickVisitPdfLink = pickVisitPdfLink;
globalThis.escapeHtml = escapeHtml;
globalThis.escapeAttr = escapeAttr;
globalThis.toEasternMDY = function(v){ return v||''; };
globalThis.adminSupervisoryRows = [{contactId:'55',clientName:'Ada',contactType:'Visit',contactDate:'09/21/2026',supervisorName:'Nurse'}];
paintAdminSupervisoryContacts();
assert.ok(els.adminSupervisoryBody.innerHTML.includes('viewAdminSupervisoryPdf(\'55\')'));
assert.ok(els.adminSupervisoryBody.innerHTML.includes('editSupervisoryContact(\'55\')'));
assert.ok(els.adminSupervisoryBody.innerHTML.includes('confirmDeleteSupervisoryContact(\'55\')'));
assert.ok(!els.adminSupervisoryBody.innerHTML.includes('archive_client'));
assert.ok(els.adminSupervisoryBody.innerHTML.includes('09/21/2026'),
  'Admin table shows US MM/DD/YYYY');

(async function(){
  const posts = [];
  let apiImpl = async function(payload){
    posts.push(payload);
    return {success:true,contactId:payload.contactId};
  };
  async function apiPost(payload){ return apiImpl(payload); }
  eval('globalThis.postArchiveAction = '+postArchive);
  eval('globalThis.toastArchiveResult = '+toastRes);

  globalThis.currentAdminRole = 'Nurse';
  globalThis.nurseComplianceRows = [row];
  eval('globalThis.forgetNurseContactId = '+extractFn(html, 'function forgetNurseContactId(contactId)'));
  eval('globalThis.archiveSupervisoryContact = '+archiveVisit);
  eval('globalThis.confirmDeleteSupervisoryContact = '+confirmVisit);

  posts.length = 0;
  toasts.length = 0;
  loadNurseCompliance.calls = 0;
  let ok = await archiveSupervisoryContact('V9');
  assert.strictEqual(ok, true);
  assert.deepStrictEqual(posts, [{action:'archive_supervisory_contact',contactId:'V9'}]);
  assert.strictEqual(toasts[0].msg, 'Contact deleted.');
  assert.strictEqual(loadNurseCompliance.calls, 1);

  confirmDeleteSupervisoryContact('V9');
  assert.strictEqual(els.nciDiscardTitle.textContent, 'Are you sure?');
  assert.strictEqual(els.nciDiscardGoBtn.textContent, 'Yes, delete');
  globalThis.hideSharedConfirm();

  posts.length = 0;
  toasts.length = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    return {success:false,error:'Unknown action'};
  };
  globalThis.currentAdminRole = 'Scheduler';
  loadAdminSupervisoryContacts.calls = 0;
  ok = await archiveSupervisoryContact('P3');
  assert.strictEqual(ok, false);
  assert.deepStrictEqual(posts, [{action:'archive_supervisory_contact',contactId:'P3'}]);
  assert.ok(/Unknown action/.test(toasts[0].msg), 'stub toast if archive_supervisory_contact is not live');
  assert.strictEqual(loadAdminSupervisoryContacts.calls, 0, 'failed archive does not refresh');

  // save update path + PDF re-archive unless pdfLink
  const SC_PERSONAL_CARE=['Bathing','MealPrep','Exercises','Grooming','Housekeeping','TurnReposition','Shaving','Laundry','VitalSigns','HairCare','ErrandsShopping','CatheterCare','OralHygiene','Ambulation','Appointments','SkinCare','PersonalCare'];
  const SC_PERF=['WashesHands','FollowsPOC','DocumentsCare','NotifiesOffice','Accountability','ReportsAsScheduled','WorksAssignedHours'];
  const fields = {
    sc_contactType:'Visit',
    sc_contactDate:'2026-09-21',
    sc_clientId:'C1',
    sc_clientName:'Ada',
    sc_aideName:'Aide',
    sc_supervisorName:'Nurse',
    sc_clientLivesWith:'Alone',
    sc_functionalLimitations:'None',
    sc_pleasedWithAide:'Pleased',
    sc_aideAttitudeCommunication:'Good',
    sc_clientComments:'',
    sc_supervisorComments:'ok',
    sc_supervisorSignatureDate:'2026-09-21',
    sc_clientSignatureDate:'2026-09-21',
    sc_aidePresent:'Yes',
    sc_aideAppearance:'Neat',
    sc_clientAppearance:'Well',
    sc_homeObservations:'',
    sc_contactId:'V9',
    scFormErr:{style:{display:'none'},textContent:''}
  };
  SC_PERSONAL_CARE.forEach(k=>fields['sc_pc_'+k]='N/A');
  SC_PERF.forEach(k=>fields['sc_perf_'+k]='Yes');
  const SIG = 'data:image/png;base64,'+'A'.repeat(80);
  global.document.getElementById = function(id){
    if(id==='scFormErr')return fields.scFormErr;
    if(fields[id]!==undefined){
      if(typeof fields[id]==='object')return fields[id];
      return {value:fields[id]};
    }
    return {value:''};
  };
  globalThis.scEditingContactId = function(){ return String(fields.sc_contactId||''); };
  globalThis.scSigPng = function(){ return SIG; };
  globalThis.nurseSigHasInk = function(d){ return typeof d==='string' && d.length>20; };
  globalThis.toEasternMDY = function(val){
    const s=String(val||'');
    const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(iso)return iso[2]+'/'+iso[3]+'/'+iso[1];
    return s;
  };
  globalThis.currentNurseName = 'Nurse';
  globalThis.scFormRowIndex = 0;
  globalThis.nurseComplianceRows = [row];
  globalThis.currentAdminRole = 'Admin';
  globalThis.SC_PERSONAL_CARE = SC_PERSONAL_CARE;
  globalThis.SC_PERF = SC_PERF;
  globalThis.closeSupervisoryContactModal = function(){};
  globalThis.pickContactId = pickContactId;
  globalThis.pickVisitPdfLink = pickVisitPdfLink;
  globalThis.rememberNurseVisitStash = rememberNurseVisitStash;
  globalThis.cacheInvalidate = function(){};
  globalThis.nciLooksLikeUnknownAction = nciLooksLikeUnknownAction;
  globalThis.showTempMsg = showTempMsg;
  globalThis.apiPost = async function(payload){ return apiImpl(payload); };

  eval('globalThis.saveSupervisoryContact = '+saveFn);

  posts.length = 0;
  toasts.length = 0;
  loadAdminSupervisoryContacts.calls = 0;
  apiImpl = async function(payload){
    posts.push(payload);
    if(payload.action==='save_supervisory_contact')return {success:true,contactId:'V9'};
    if(payload.action==='archive_supervisory_visit_pdf')return {success:true,pdfLink:'https://example.com/v9.pdf'};
    return {success:false,error:'nope'};
  };
  await saveSupervisoryContact();
  assert.strictEqual(posts[0].action, 'save_supervisory_contact');
  assert.strictEqual(posts[0].contactId, 'V9', 'edit save sends contactId');
  assert.strictEqual(posts[0].contactDate, '09/21/2026', 'save date is MM/DD/YYYY');
  assert.strictEqual(posts[1].action, 'archive_supervisory_visit_pdf');
  assert.strictEqual(posts[1].contactId, 'V9');
  assert.strictEqual(loadAdminSupervisoryContacts.calls, 1, 'Admin list refreshes after edit');

  posts.length = 0;
  fields.sc_contactId = '';
  apiImpl = async function(payload){
    posts.push(payload);
    return {success:true,contactId:'NEW1'};
  };
  globalThis.currentAdminRole = 'Nurse';
  await saveSupervisoryContact();
  assert.strictEqual(posts[0].action, 'save_supervisory_contact');
  assert.strictEqual(posts[0].contactId, undefined, 'create must omit contactId');
  assert.ok(!posts.some(p=>p.action==='archive_supervisory_visit_pdf'),
    'create does not re-archive PDF');

  posts.length = 0;
  fields.sc_contactId = 'V9';
  apiImpl = async function(payload){
    posts.push(payload);
    if(payload.action==='save_supervisory_contact')return {success:true,contactId:'V9',pdfLink:'https://example.com/ready.pdf'};
    return {success:false,error:'should not archive'};
  };
  await saveSupervisoryContact();
  assert.ok(!posts.some(p=>p.action==='archive_supervisory_visit_pdf'),
    'skip PDF re-archive when Ace returned pdfLink');

  console.log('supervisory-contact-edit-delete-test: ok');
})().catch(function(e){
  console.error(e);
  process.exit(1);
});
