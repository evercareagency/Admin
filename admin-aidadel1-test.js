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
const sbDel = extractFn(html, 'async function sbAdminDeactivateAide(payload)');
const sbRes = extractFn(html, 'async function sbAdminRestoreAide(payload)');
const dispatch = extractFn(html, 'async function sbAdminWriteDispatch(payload)');

assert.ok(actions.indexOf('confirmResetAideTempPassword') < actions.indexOf('confirmSoftDeleteAide'), 'Delete sits beside Reset temp password');
assert.ok(actions.includes('>Delete</button>'), 'Delete label');
assert.ok(actions.includes('>Restore</button>'), 'Restore label');
assert.ok(actions.includes("canManageAides()"), 'actions use the Add-aide role gate');
assert.ok(confirmDel.includes("showSharedConfirm('Are you sure?"), 'confirm title starts Are you sure?');
assert.ok(confirmDel.includes("'Soft-delete'"), 'confirm button is Soft-delete');
assert.ok(!/\bconfirm\(/.test(confirmDel + softDel + confirmRes + restore), 'no window.confirm on aide delete');
assert.ok(softDel.includes("'admin_deactivate_aide'"), 'UI posts admin_deactivate_aide');
assert.ok(restore.includes("'admin_restore_aide'"), 'UI posts admin_restore_aide');
assert.ok(!/soft_delete_aide|restore_aide\(/.test(softDel + restore), 'UI does not call the old RPC names');
assert.ok(!/tempPassword|temp_password|reset_aide_temp_password|generateTempPassword|p_temp_password/.test(softDel + restore + sbDel + sbRes + confirmDel + confirmRes), 'delete and restore never rotate a password');
assert.ok(sbDel.includes("sbRestRpc('admin_deactivate_aide', {p_aide_id:aideId})"), 'deactivate body is p_aide_id');
assert.ok(sbRes.includes("sbRestRpc('admin_restore_aide', {p_aide_id:aideId})"), 'restore body is p_aide_id');
assert.ok(!/p_username/.test(sbDel + sbRes), 'aide duty RPCs do not send p_username');
assert.ok(!/sbRestPatch|sbSoftUnassign|sbRpcMissing/.test(sbDel + sbRes), 'client does not PATCH or unassign; Ace owns the ban and assignments');
assert.ok(html.includes("['deactivated_at','is.null']"), 'active list requires deactivated_at null');
assert.ok(html.includes("['is_active','eq.true']") && html.includes("aidePairs.push(['is_active','eq.false'])"), 'active and deleted is_active filters');
assert.ok(html.includes("['deactivated_at','not.is.null']"), 'recently deleted requires deactivated_at');
assert.ok(html.includes("['order','deactivated_at.desc']"), 'recently deleted orders by deactivated_at desc');
assert.ok(dispatch.indexOf("action==='admin_deactivate_aide'") < dispatch.indexOf('sbAdminSoftDeleteTimesheet'), 'aide deactivate is not the timesheet trash path');
assert.ok(dispatch.includes("action==='admin_restore_aide'"), 'dispatch restores aides');

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
  'function rememberAideRows(list)',
  'function canManageAides()',
  'function aideDeactivatedStamp(u)',
  'function aideOnDesk(u, desk)',
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
      is_active: false,
      deactivated_at: '2026-09-24T12:00:00.000Z',
      deactivatedAt: '2026-09-24T12:00:00.000Z',
      assignedClients: []
    }
  ]
};
const posts = [];
const toasts = [];
let failRpc = false;
const box = {
  aideDesk: 'active',
  currentAdminRole: 'Admin',
  allClients: [{id: clientId, name: 'Ann Client'}],
  loadedAidesList: [],
  allAidesForAssign: [],
  aideLookup: {},
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
    if(failRpc)return {success: false, error: 'Could not hide this aide.'};
    const row = store.aides.find(function(a){return a.username === payload.username;});
    if(payload.action === 'admin_deactivate_aide'){
      row.isActive = false;
      row.is_active = false;
      row.deactivated_at = '2026-09-25T12:00:00.000Z';
      row.deactivatedAt = row.deactivated_at;
      return {success: true, username: payload.username, is_active: false, deactivated_at: row.deactivated_at};
    }
    if(payload.action === 'admin_restore_aide'){
      row.isActive = true;
      row.is_active = true;
      row.deactivated_at = null;
      row.deactivatedAt = '';
      return {success: true, username: payload.username, is_active: true, deactivated_at: null};
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
  assert.strictEqual(posts[posts.length - 1].action, 'admin_deactivate_aide');
  assert.ok(!('tempPassword' in posts[posts.length - 1]), 'failed deactivate post has no temp password');
  assert.ok(!('password' in posts[posts.length - 1]));
  assert.ok(/Could not hide this aide/.test(toasts[toasts.length - 1].msg), 'hard failure toasts');
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
  assert.strictEqual(posts[posts.length - 1].action, 'admin_deactivate_aide');
  assert.strictEqual(posts[posts.length - 1].aideId, aideId, 'soft-delete sends the aide id for p_aide_id');
  assert.ok(!('clientIds' in posts[posts.length - 1]), 'client unassign stays on the Ace RPC');
  assert.ok(!htmlOf().includes('@jdoe'), 'confirm then gone from the active list');
  assert.ok(htmlOf().includes('No aides registered yet'), htmlOf());

  await box.setAideDesk('deleted');
  assert.ok(htmlOf().includes('@jdoe'), 'soft-deleted aide appears in Recently deleted');
  assert.ok(htmlOf().includes('confirmRestoreAide'), 'Recently deleted has Restore');
  assert.ok(htmlOf().includes('oldaide'), 'Recently deleted lists inactive aides');
  assert.ok(els.aideDeskSub.textContent.indexOf('7 days') > 0, 'desk copy matches timesheets');
  assert.strictEqual(els.addAideBtn.hidden, true, 'Add stays off Recently deleted');
  assert.ok(desks[1].classList.contains('on'), 'Recently deleted tab is selected');

  box.confirmRestoreAide('jdoe');
  assert.strictEqual(els.nciDiscardGoBtn.textContent, 'Restore');
  assert.ok(els.nciDiscardTitle.textContent.indexOf('does not change their password') > 0);
  const pendingRestore = box._sharedConfirmOnYes();
  box.hideSharedConfirm();
  await pendingRestore;
  assert.strictEqual(posts[posts.length - 1].action, 'admin_restore_aide');
  assert.ok(!('tempPassword' in posts[posts.length - 1]), 'restore does not send a password');
  assert.ok(!htmlOf().includes('@jdoe'), 'restored aide leaves Recently deleted');

  await box.setAideDesk('active');
  assert.ok(htmlOf().includes('@jdoe'), 'Restore returns the aide to the active list');
  assert.ok(htmlOf().includes('>Delete<'), 'restored row can be deleted again');
  assert.ok(htmlOf().includes('Reset temp password'));

  assert.strictEqual(box.aideOnDesk({username: 'x', isActive: false, deactivated_at: '2026-09-25T00:00:00.000Z'}, 'deleted'), true, 'inactive aides with deactivated_at are Recently deleted');
  assert.strictEqual(box.aideOnDesk({username: 'x', isActive: false}, 'deleted'), false, 'inactive without deactivated_at stays off both desks');
  assert.strictEqual(box.aideOnDesk({username: 'x', is_active: false, deactivated_at: '2026-09-25T00:00:00.000Z'}, 'active'), false, 'default list hides deactivated aides');
  assert.strictEqual(box.aideOnDesk({username: 'x', isActive: true}, 'active'), true);
  assert.strictEqual(box.aideOnDesk({username: 'x', isActive: true, deactivated_at: '2026-09-25T00:00:00.000Z'}, 'active'), false);
  assert.strictEqual(box.aideOnDesk({username: 'x', isActive: true}, 'deleted'), false);

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
    'function sbMapAideDutyResult(data, username, active, aideId)',
    'async function sbDutyAideId(payload)',
    'async function sbAdminDeactivateAide(payload)',
    'async function sbAdminRestoreAide(payload)'
  ];
  const rpcSrc = rpcNames.map(function(sig){return extractFn(html, sig);}).join('\n');
  const calls = [];
  const rpcBox = {
    Date: Date,
    sbNormalizeWriteError: function(msg){return String(msg || 'Request failed.');},
    sbResolveAideId: async function(username){
      calls.push({op: 'resolve', username: username});
      return rpcBox.resolved || '';
    },
    sbRestRpc: async function(name, body){
      calls.push({op: 'rpc', name: name, body: body});
      if(rpcBox.mode === 'fail')return {ok: false, status: 400, error: 'Could not hide this aide.'};
      return {ok: true, data: {ok: true, success: true, username: 'jdoe', deactivated_at: rpcBox.stamp || '2026-09-25T12:00:00.000Z'}};
    },
    mode: 'ok',
    resolved: '',
    stamp: '2026-09-25T12:00:00.000Z'
  };
  vm.createContext(rpcBox);
  vm.runInContext(rpcSrc, rpcBox);
  const aide = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  return rpcBox.sbAdminDeactivateAide({username: 'jdoe', aideId: aide, clientIds: ['cccccccc-cccc-4ccc-8ccc-ccccccccccc3']}).then(function(deleted){
    assert.strictEqual(deleted.success, true);
    assert.strictEqual(deleted.is_active, false);
    assert.strictEqual(deleted.deactivated_at, '2026-09-25T12:00:00.000Z');
    assert.strictEqual(calls.length, 1, 'deactivate is one RPC');
    assert.strictEqual(calls[0].name, 'admin_deactivate_aide');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0].body)), {p_aide_id: aide});
    assert.ok(!/password/i.test(JSON.stringify(calls)), 'deactivate payload has no password');
    calls.length = 0;
    rpcBox.resolved = aide;
    return rpcBox.sbAdminDeactivateAide({username: 'mossier'});
  }).then(function(resolved){
    assert.strictEqual(resolved.success, true);
    assert.strictEqual(calls[0].op, 'resolve');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[1].body)), {p_aide_id: aide});
    calls.length = 0;
    rpcBox.mode = 'fail';
    return rpcBox.sbAdminDeactivateAide({username: 'mossier', aideId: aide});
  }).then(function(failed){
    assert.strictEqual(failed.success, false);
    assert.strictEqual(calls.length, 1, 'a failed RPC does not PATCH or unassign');
    assert.strictEqual(calls[0].name, 'admin_deactivate_aide');
    calls.length = 0;
    rpcBox.mode = 'ok';
    return rpcBox.sbAdminRestoreAide({username: 'mossier', aideId: aide});
  }).then(function(restored){
    assert.strictEqual(restored.success, true);
    assert.strictEqual(restored.is_active, true);
    assert.strictEqual(restored.deactivated_at, null);
    assert.strictEqual(calls[0].name, 'admin_restore_aide');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0].body)), {p_aide_id: aide});
    assert.ok(!/password/i.test(JSON.stringify(calls)), 'restore payload has no password');
    calls.length = 0;
    rpcBox.resolved = '';
    return rpcBox.sbAdminRestoreAide({username: 'mossier'});
  }).then(function(missingId){
    assert.strictEqual(missingId.success, false);
    assert.strictEqual(calls.filter(function(c){return c.op === 'rpc';}).length, 0, 'restore without an aide id does not call the RPC');
    console.log('admin-aidadel1-test: ok');
  });
}
