#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=aidadel1'), 'aidadel1 marker');
assert.ok(html.includes('admin-build 2026-09-25-aidadel1'), 'aidadel1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidadel1">'), 'aidadel1 meta');
assert.ok(html.indexOf('content="2026-09-25-aidadel1"') < html.indexOf('content="2026-09-25-navedit1"'), 'aidadel1 is the current build meta');
assert.ok(html.includes('v=navedit1'), 'navedit1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-navedit1">'), 'navedit1 meta stays');
assert.ok(html.includes('v=nursecomp57'), 'nursecomp57 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-nursecomp57">'), 'nursecomp57 meta stays');
assert.ok(html.includes('v=layoutA1'), 'layoutA1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-layoutA1">'), 'layoutA1 meta stays');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('id="aideDesk"') && html.includes('>Recently deleted<'), 'Aides has a Recently deleted filter');
assert.ok(html.includes('Recently deleted aides can be restored for 7 days'), '7 day window copy');
assert.ok(html.includes('#tab_aides .aide-row-card .actions .btn{min-height:44px;'), 'phone tap targets on aide actions');

const actions = extractFn(html, 'function aideActionButtons(un, desk)');
const confirmDel = extractFn(html, 'function confirmSoftDeleteAide(username)');
const softDel = extractFn(html, 'async function softDeleteAide(username)');
const confirmRes = extractFn(html, 'function confirmRestoreAide(username)');
const restore = extractFn(html, 'async function restoreAide(username)');
const sbDel = extractFn(html, 'async function sbAdminSoftDeleteAide(payload)');
const sbRes = extractFn(html, 'async function sbAdminRestoreAide(payload)');
const dispatch = extractFn(html, 'async function sbAdminWriteDispatch(payload)');
const clearAsg = extractFn(html, 'async function sbClearAideAssignments(payload)');

assert.ok(actions.indexOf('confirmResetAideTempPassword') < actions.indexOf('confirmSoftDeleteAide'), 'Delete sits beside Reset temp password');
assert.ok(actions.includes('>Delete</button>'), 'Delete label');
assert.ok(actions.includes('>Restore</button>'), 'Restore label');
assert.ok(actions.includes("canManageAides()"), 'actions use the Add-aide role gate');
assert.ok(confirmDel.includes("showSharedConfirm('Are you sure?"), 'confirm title starts Are you sure?');
assert.ok(confirmDel.includes("'Soft-delete'"), 'confirm button is Soft-delete');
assert.ok(!/\bconfirm\(/.test(confirmDel + softDel + confirmRes + restore), 'no window.confirm on aide delete');
assert.ok(softDel.includes("'soft_delete_aide'"), 'UI posts soft_delete_aide');
assert.ok(restore.includes("'restore_aide'"), 'UI posts restore_aide');
assert.ok(!/tempPassword|temp_password|reset_aide_temp_password|generateTempPassword|p_temp_password/.test(softDel + restore + sbDel + sbRes + confirmDel + confirmRes), 'delete and restore never rotate a password');
assert.ok(sbDel.includes("sbRestRpc('soft_delete_aide'"), 'Ace soft_delete_aide RPC');
assert.ok(sbDel.includes('p_username:username'), 'RPC body is p_username only');
assert.ok(sbRes.includes("sbRestRpc('restore_aide'"), 'Ace restore_aide RPC');
assert.ok(sbDel.includes('rpcMissing'), 'missing RPC fails closed');
assert.ok(clearAsg.includes('TODO Ace'), 'unassign leaves a TODO for Ace');
assert.ok(clearAsg.includes('sbSoftUnassign'), 'known assignments use the existing unassign callable');
assert.ok(dispatch.indexOf("action==='soft_delete_aide'") < dispatch.indexOf('sbAdminSoftDeleteTimesheet'), 'aide soft-delete is not the timesheet trash path');
assert.ok(dispatch.includes("action==='restore_aide'"), 'dispatch restores aides');

function classList(){
  const set = new Set();
  return {
    add: function(c){set.add(c);},
    remove: function(c){set.delete(c);},
    contains: function(c){return set.has(c);},
    toggle: function(c, on){
      if(on)set.add(c);
      else set.delete(c);
    }
  };
}
function node(id){
  return {id: id, hidden: false, style: {display: ''}, textContent: '', innerHTML: '', classList: classList()};
}
const els = {
  aidesContainer: node('aidesContainer'),
  aideDeskSub: node('aideDeskSub'),
  addAideBtn: node('addAideBtn'),
  nciDiscardConfirm: node('nciDiscardConfirm'),
  nciDiscardTitle: node('nciDiscardTitle'),
  nciDiscardGoBtn: node('nciDiscardGoBtn')
};
els.nciDiscardConfirm.hidden = true;
const desks = [
  {name: 'active', classList: classList(), attrs: {'aria-selected': 'true'}, getAttribute: function(k){return k === 'data-aide-desk' ? 'active' : this.attrs[k];}, setAttribute: function(k, v){this.attrs[k] = v;}},
  {name: 'deleted', classList: classList(), attrs: {'aria-selected': 'false'}, getAttribute: function(k){return k === 'data-aide-desk' ? 'deleted' : this.attrs[k];}, setAttribute: function(k, v){this.attrs[k] = v;}}
];
desks[0].classList.add('on');

const names = [
  'function escapeHtml(str)',
  'function escapeAttr(str)',
  'function aideTruth(v)',
  'function aideOnTempPassword(u)',
  'function aideAssignedClientValues(u)',
  'function resolveClientLabel(item)',
  'function formatAideAssignedClients(u)',
  'function nciLooksLikeUnknownAction(text)',
  'function looksLikeUsernameTaken(text)',
  'function aceActionError(data,err,action)',
  'async function postAideAction(primary,alias,payload)',
  'function canManageAides()',
  'function aideDeletedStamp(u)',
  'function aideRecordDeleted(u)',
  'function aideWithinRestoreWindow(u, nowMs)',
  'function aideOnDesk(u, desk)',
  'function aideClientIdList(u)',
  'function syncAideManageButtons()',
  'async function setAideDesk(view)',
  'function aideEmptyHtml()',
  'function aideActionButtons(un, desk)',
  'function findLoadedAide(username)',
  'async function renderAides(force)',
  'function showSharedConfirm(title,onConfirm,confirmLabel)',
  'function hideSharedConfirm()',
  'function nciConfirmDiscard()',
  'function confirmSoftDeleteAide(username)',
  'async function softDeleteAide(username)',
  'function confirmRestoreAide(username)',
  'async function restoreAide(username)'
];
const src = names.map(function(sig){return extractFn(html, sig);}).join('\n');

const aideId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const clientId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';
const store = {
  aides: [
    {
      id: aideId,
      username: 'jdoe',
      name: 'Jane Doe',
      fullName: 'Jane Doe',
      isActive: true,
      mustChangePassword: true,
      assignedClients: [{id: clientId, name: 'Ann Client'}],
      clientIds: [clientId]
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      username: 'oldaide',
      name: 'Old Aide',
      isActive: false,
      deleted_at: '2026-09-01T00:00:00.000Z',
      deletedAt: '2026-09-01T00:00:00.000Z',
      softDeleted: true,
      soft_deleted: true,
      assignedClients: []
    }
  ]
};
const posts = [];
const toasts = [];
let failRpc = false;
const box = {
  aideDesk: 'active',
  AIDE_RESTORE_WINDOW_MS: 7 * 24 * 60 * 60 * 1000,
  currentAdminRole: 'Admin',
  allClients: [{id: clientId, name: 'Ann Client'}],
  loadedAidesList: [],
  allAidesForAssign: [],
  _sharedConfirmOnYes: null,
  Date: Date,
  isFinite: isFinite,
  document: {
    getElementById: function(id){return els[id] || null;},
    querySelectorAll: function(sel){return sel === '[data-aide-desk]' ? desks : [];}
  },
  nciEl: function(id){return els[id] || null;},
  cacheGet: function(){return null;},
  cacheInvalidate: function(){},
  logActivity: function(){},
  showTempMsg: function(msg, color){toasts.push({msg: msg, color: color});},
  evercareSbEnabled: function(){return true;},
  apiGetCached: async function(){return {success: true, data: store.aides.slice()};},
  apiPost: async function(payload){
    posts.push(JSON.parse(JSON.stringify(payload)));
    if(failRpc)return {success: false, error: 'Soft-delete is not available yet. Ace soft_delete_aide is not published.', rpcMissing: true};
    const row = store.aides.find(function(a){return a.username === payload.username;});
    if(payload.action === 'soft_delete_aide'){
      row.deleted_at = new Date().toISOString();
      row.deletedAt = row.deleted_at;
      row.softDeleted = true;
      row.soft_deleted = true;
      row.isActive = false;
      return {success: true, username: payload.username, deleted_at: row.deleted_at, is_active: false};
    }
    if(payload.action === 'restore_aide'){
      row.deleted_at = null;
      row.deletedAt = '';
      row.softDeleted = false;
      row.soft_deleted = false;
      row.isActive = true;
      return {success: true, username: payload.username, deleted_at: null, is_active: true};
    }
    return {success: false, error: 'nope'};
  }
};
vm.createContext(box);
vm.runInContext(src, box);

function htmlOf(){return els.aidesContainer.innerHTML;}

(async function(){
  await box.renderAides(true);
  assert.ok(htmlOf().includes('confirmSoftDeleteAide'), 'Admin sees Delete');
  assert.ok(htmlOf().includes('Reset temp password'), 'Admin still sees Reset temp password');
  assert.ok(htmlOf().indexOf('Reset temp password') < htmlOf().indexOf('>Delete<'), 'Delete is next to Reset');
  assert.ok(htmlOf().includes('Jane Doe') && htmlOf().includes('@jdoe'), 'active row is Jane');
  assert.ok(htmlOf().indexOf('oldaide') < 0, 'expired soft-delete stays off the active list');
  assert.strictEqual(els.addAideBtn.hidden, false, 'Admin can Add');

  box.currentAdminRole = 'Nurse';
  await box.renderAides(true);
  assert.ok(!htmlOf().includes('confirmSoftDeleteAide'), 'Nurse does not see Delete');
  assert.ok(!htmlOf().includes('confirmResetAideTempPassword'), 'Nurse does not get aide actions');
  assert.strictEqual(els.addAideBtn.hidden, true, 'Nurse cannot Add');
  assert.strictEqual(els.addAideBtn.style.display, 'none');

  box.currentAdminRole = 'Scheduler';
  await box.renderAides(true);
  assert.ok(htmlOf().includes('confirmSoftDeleteAide'), 'Scheduler sees Delete when they can Add');
  assert.strictEqual(els.addAideBtn.hidden, false, 'Scheduler can Add');

  box.currentAdminRole = 'Admin';
  await box.renderAides(true);
  const before = posts.length;
  box.evercareSbEnabled = function(){return false;};
  await box.softDeleteAide('jdoe');
  assert.strictEqual(posts.length, before, 'Sheets rollback does not post a delete');
  assert.ok(/Supabase aides desk/.test(toasts[toasts.length - 1].msg), 'sheets path toasts');
  assert.ok(htmlOf().includes('@jdoe'), 'sheets refusal leaves the aide on the active list');
  box.evercareSbEnabled = function(){return true;};

  failRpc = true;
  toasts.length = 0;
  await box.softDeleteAide('jdoe');
  assert.strictEqual(posts[posts.length - 1].action, 'soft_delete_aide');
  assert.ok(!('tempPassword' in posts[posts.length - 1]), 'missing-RPC post has no temp password');
  assert.ok(!('password' in posts[posts.length - 1]));
  assert.ok(/not published/.test(toasts[toasts.length - 1].msg), 'missing RPC toasts');
  assert.strictEqual(toasts[toasts.length - 1].color, 'var(--danger)');
  assert.ok(htmlOf().includes('@jdoe') && htmlOf().includes('>Delete<'), 'failed delete stays on the active list');
  failRpc = false;

  box.confirmSoftDeleteAide('jdoe');
  assert.strictEqual(els.nciDiscardConfirm.hidden, false, 'confirm opens');
  assert.ok(els.nciDiscardConfirm.classList.contains('show'), 'confirm uses the shared card');
  assert.ok(els.nciDiscardTitle.textContent.indexOf('Are you sure?') === 0, els.nciDiscardTitle.textContent);
  assert.ok(els.nciDiscardTitle.textContent.indexOf('cannot Sign In') > 0, 'confirm says they cannot Sign In');
  assert.ok(els.nciDiscardTitle.textContent.indexOf('7 days') > 0, 'confirm names the 7 day window');
  assert.strictEqual(els.nciDiscardGoBtn.textContent, 'Soft-delete');
  box.hideSharedConfirm();
  assert.strictEqual(els.nciDiscardConfirm.hidden, true, 'Cancel closes the dialog');
  assert.strictEqual(box._sharedConfirmOnYes, null, 'Cancel does not delete');
  assert.ok(htmlOf().includes('@jdoe'), 'Cancel leaves the aide active');

  box.confirmSoftDeleteAide('jdoe');
  const pendingDelete = box._sharedConfirmOnYes();
  box.hideSharedConfirm();
  await pendingDelete;
  assert.strictEqual(posts[posts.length - 1].action, 'soft_delete_aide');
  assert.deepStrictEqual(posts[posts.length - 1].clientIds, [clientId], 'soft-delete sends known client ids for unassign');
  assert.strictEqual(posts[posts.length - 1].aideId, aideId);
  assert.ok(!htmlOf().includes('@jdoe'), 'confirm then gone from the active list');
  assert.ok(htmlOf().includes('No aides registered yet'), htmlOf());

  await box.setAideDesk('deleted');
  assert.ok(htmlOf().includes('@jdoe'), 'soft-deleted aide appears in Recently deleted');
  assert.ok(htmlOf().includes('confirmRestoreAide'), 'Recently deleted has Restore');
  assert.ok(!htmlOf().includes('oldaide'), 'past the 7 day window is not offered for restore');
  assert.ok(els.aideDeskSub.textContent.indexOf('7 days') > 0, 'desk copy matches timesheets');
  assert.strictEqual(els.addAideBtn.hidden, true, 'Add stays off Recently deleted');
  assert.ok(desks[1].classList.contains('on'), 'Recently deleted tab is selected');

  box.confirmRestoreAide('jdoe');
  assert.strictEqual(els.nciDiscardGoBtn.textContent, 'Restore');
  assert.ok(els.nciDiscardTitle.textContent.indexOf('does not change their password') > 0);
  const pendingRestore = box._sharedConfirmOnYes();
  box.hideSharedConfirm();
  await pendingRestore;
  assert.strictEqual(posts[posts.length - 1].action, 'restore_aide');
  assert.ok(!('tempPassword' in posts[posts.length - 1]), 'restore does not send a password');
  assert.ok(!htmlOf().includes('@jdoe'), 'restored aide leaves Recently deleted');

  await box.setAideDesk('active');
  assert.ok(htmlOf().includes('@jdoe'), 'Restore returns the aide to the active list');
  assert.ok(htmlOf().includes('>Delete<'), 'restored row can be deleted again');
  assert.ok(htmlOf().includes('Reset temp password'));

  const aged = box.aideOnDesk({username: 'x', deleted_at: '2026-09-01T00:00:00.000Z', softDeleted: true}, 'deleted');
  assert.strictEqual(aged, false, '8+ days is outside the restore window');
  const fresh = box.aideOnDesk({username: 'x', deleted_at: new Date().toISOString(), softDeleted: true}, 'deleted');
  assert.strictEqual(fresh, true, 'a delete from today is restorable');
  assert.strictEqual(box.aideOnDesk({username: 'x', isActive: true}, 'active'), true);
  assert.strictEqual(box.aideOnDesk({username: 'x', deleted_at: new Date().toISOString(), softDeleted: true}, 'active'), false);

  console.log('admin-aidadel1-test: ui ok');
})().then(function(){
  return runRpc();
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

function runRpc(){
  const rpcNames = [
    'function sbUuid(v)',
    'function sbRpcMissing(got)',
    'function sbMapSoftAideResult(data, username, restoring)',
    'async function sbClearAideAssignments(payload)',
    'async function sbAdminSoftDeleteAide(payload)',
    'async function sbAdminRestoreAide(payload)'
  ];
  const rpcSrc = rpcNames.map(function(sig){return extractFn(html, sig);}).join('\n');
  const calls = [];
  const rpcBox = {
    Date: Date,
    sbNormalizeWriteError: function(msg){return String(msg || 'Request failed.');},
    sbResolveAideId: async function(){return '';},
    sbSoftUnassign: async function(aide, client){
      calls.push({op: 'unassign', aide: aide, client: client});
      return {ok: true};
    },
    sbRestRpc: async function(name, body){
      calls.push({op: 'rpc', name: name, body: body});
      if(rpcBox.mode === 'missing')return {ok: false, status: 404, error: 'Could not find the function public.' + name + '(p_username) in the schema cache'};
      if(rpcBox.mode === 'cleared')return {ok: true, data: {ok: true, success: true, username: body.p_username, deleted_at: '2026-09-25T12:00:00.000Z', assignments_cleared: true}};
      if(name === 'restore_aide')return {ok: true, data: {ok: true, success: true, username: body.p_username}};
      return {ok: true, data: {ok: true, success: true, username: body.p_username, deleted_at: '2026-09-25T12:00:00.000Z'}};
    },
    mode: 'ok'
  };
  vm.createContext(rpcBox);
  vm.runInContext(rpcSrc, rpcBox);
  const aide = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  const client = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';
  return rpcBox.sbAdminSoftDeleteAide({username: 'jdoe', aideId: aide, clientIds: [client]}).then(function(deleted){
    assert.strictEqual(deleted.success, true);
    assert.strictEqual(calls[0].name, 'soft_delete_aide');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0].body)), {p_username: 'jdoe'});
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[1])), {op: 'unassign', aide: aide, client: client});
    assert.ok(!/password/i.test(JSON.stringify(calls[0].body)), 'RPC payload has no password');
    calls.length = 0;
    rpcBox.mode = 'cleared';
    return rpcBox.sbAdminSoftDeleteAide({username: 'jdoe', aideId: aide, clientIds: [client]});
  }).then(function(already){
    assert.strictEqual(already.success, true);
    assert.strictEqual(calls.length, 1, 'Ace-cleared assignments are not patched again');
    calls.length = 0;
    rpcBox.mode = 'missing';
    return rpcBox.sbAdminSoftDeleteAide({username: 'mossier', aideId: aide, clientIds: [client]});
  }).then(function(missing){
    assert.strictEqual(missing.success, false);
    assert.strictEqual(missing.rpcMissing, true);
    assert.ok(/not published/.test(missing.error));
    assert.ok(!calls.some(function(c){return c.op === 'unassign';}), 'missing RPC does not unassign');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0].body)), {p_username: 'mossier'});
    calls.length = 0;
    rpcBox.mode = 'ok';
    return rpcBox.sbAdminRestoreAide({username: 'mossier'});
  }).then(function(restored){
    assert.strictEqual(restored.success, true);
    assert.strictEqual(restored.is_active, true);
    assert.strictEqual(restored.deleted_at, null);
    assert.strictEqual(calls[0].name, 'restore_aide');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0].body)), {p_username: 'mossier'});
    assert.ok(!calls.some(function(c){return c.op === 'unassign';}), 'restore does not touch assignments or passwords');
    console.log('admin-aidadel1-test: ok');
  });
}
