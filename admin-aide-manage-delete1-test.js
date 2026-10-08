#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

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

assert.ok(html.includes('v=aide-manage-delete1'), 'marker');
assert.ok(html.includes('v=manage-clean1'), 'manage-clean1 marker');
assert.ok(html.includes('id="aideManageDoneBtn"') && html.includes('>Done</button>'), 'Done exits Manage');
assert.ok(html.includes('aide-creds-detail'), 'detail view hides the aides list');
assert.ok(html.includes('?v=aide-manage-delete1'), 'query marker');
assert.ok(html.includes('data-aide-manage-delete1="v=aide-manage-delete1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-28-aide-manage-delete1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-aide-manage-delete1">'), 'meta');
assert.ok(html.includes('<!-- aide manage delete 2026-09-28 v=aide-manage-delete1 ?v=aide-manage-delete1 admin-build 2026-09-28-aide-manage-delete1'), 'comment');
assert.ok(html.includes("var AIDE_MANAGE_DELETE1_MARKER='v=aide-manage-delete1'"), 'script marker');
assert.ok(html.includes("var AIDE_MANAGE_DELETE1_BUILD='2026-09-28-aide-manage-delete1'"), 'script build');
assert.ok(html.includes('GHOST-AIDE-SOFT-DELETE-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace CALLABLE via loop'), 'callable via loop');
assert.ok(html.includes('NO new SQL') && html.includes('NO bulk RPC'), 'no new sql or bulk rpc');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('Are you sure? at the top of the page'), 'page-level confirm note');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-28-cover-desk1"') < html.indexOf('content="2026-09-28-aide-manage-delete1"'), 'meta follows cover-desk1');
['v=aidadel1','v=aides-info1','v=compliance-bulk1','v=cover-unselect1','v=list-az-sticky1','v=cover-desk1','v=aidecreds1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-25-aidadel1','2026-09-27-aides-info1','2026-09-27-compliance-bulk1','2026-09-27-cover-unselect1','2026-09-28-list-az-sticky1','2026-09-28-cover-desk1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});

const aidesHdr = html.slice(html.indexOf('id="tab_aides"'), html.indexOf('id="aideDesk"'));
assert.ok(aidesHdr.includes('id="aideManageSure"') && aidesHdr.includes('>Are you sure?</p>'), 'Are you sure sits at the top of the aides page');
assert.ok(aidesHdr.indexOf('id="aideManageSure"') < aidesHdr.indexOf('class="page-hdr"'), 'sure heading is above the Aides title');
assert.ok(aidesHdr.includes('id="aideCredManageBtn"') && aidesHdr.includes('onclick="aideCredToggleManage()"'), 'Manage stays the credentials control');
assert.ok(aidesHdr.includes('>+ Aide<'), 'header aide button matches the lock');
assert.ok(!aidesHdr.includes('Manage ON'), 'no Manage ON badge');
assert.ok(!/MOCK \/ not live/.test(aidesHdr), 'no mock chrome');

const bar = html.slice(html.indexOf('id="aideManageBar"'), html.indexOf('id="aideCredsRoot"'));
assert.ok(bar.includes('>Select all<') && bar.includes('>Unselect all<'), 'select pair is in the bar');
assert.ok(bar.indexOf('>Select all<') < bar.indexOf('>Unselect all<'), 'Select all stays beside Unselect all');
assert.ok(bar.includes('id="aideManageDeleteSelected"') && bar.includes('>Delete selected<'), 'Delete selected');
assert.ok(bar.includes('id="aideManageCount"') && bar.includes('>0 selected<'), 'N selected');
assert.ok(bar.includes('disabled'), 'Delete selected starts disabled');
assert.ok(!/aideManageSelectAll[\s\S]{0,80}hidden/.test(bar) && !/aideManageUnselectAll[\s\S]{0,40}hidden/.test(bar), 'the pair is not hidden');

const sheet = html.slice(html.indexOf('id="aideManageConfirm"'), html.indexOf('id="tab_broadcast"'));
assert.ok(sheet.includes('id="aideManageConfirmTitle"'), 'sheet title');
assert.ok(sheet.includes('They move to Recently deleted.'), 'recently deleted copy');
assert.ok(sheet.includes('id="aideManageConfirmGo"') && sheet.includes('>Delete selected<'), 'primary Delete selected');
assert.ok(sheet.includes('>Cancel<'), 'cancel');
assert.ok(!sheet.includes('>Are you sure?<'), 'Are you sure is not only the sheet title');

const single = extractFn(html, 'function confirmSoftDeleteAide(username)');
const soft = extractFn(html, 'async function softDeleteAide(username)');
assert.ok(single.includes("showSharedConfirm('Are you sure?"), 'single delete still uses the shared confirm');
assert.ok(single.includes("'Soft-delete'"), 'single delete button stays Soft-delete');
assert.ok(soft.includes("'admin_deactivate_aide'"), 'single delete still posts admin_deactivate_aide');
assert.ok(extractFn(html, 'function aidesInfo1Delete()').includes('confirmSoftDeleteAide'), 'ellipsis Delete stays');
assert.ok(extractFn(html, 'function aidesInfo1Restore()').includes('confirmRestoreAide'), 'Restore stays');
assert.ok(html.includes("sbRestRpc('admin_deactivate_aide', {p_aide_id:aideId})"), 'deactivate body stays p_aide_id');
assert.ok(!/sbRestRpc\(\s*'admin_deactivate_aides'|rpc\(\s*'admin_deactivate_aides'/.test(html), 'no bulk rpc call');

const run = extractFn(html, 'async function aideManageDelete1Run()');
assert.ok(run.includes("postAideAction('admin_deactivate_aide','',payload)"), 'bulk reuses the single-delete action');
assert.ok(run.includes('for(i=0;i<picks.length;i++)'), 'one call per selected id');
assert.ok(run.includes('renderAides(true)'), 'refresh after confirm');
assert.ok(run.includes("cacheInvalidate('get_users')"), 'list cache drops so Recently deleted refetches');
assert.ok(!/reset_aide_temp_password|reseal|mossier|generateTempPassword|p_temp_password|tempPassword/.test(run), 'bulk flow never reseals');
assert.ok(!/DELETE\s+FROM|method:\s*'DELETE'|hard-delete|admin_deactivate_aides/.test(run), 'bulk flow does not hard-delete');
assert.ok(!/sbRestPatch|sbSoftUnassign/.test(run), 'Ace owns the ban and assignments');

const open = extractFn(html, 'function aideManageDelete1OpenConfirm()');
assert.ok(open.includes('Are you sure') === false, 'open confirm does not put Are you sure only in the sheet');
assert.ok(open.includes('aideManageSure'), 'open confirm reveals the page heading');
assert.ok(open.includes("'Delete 1 aide?'") && open.includes("'Delete '+n+' aides?'"), 'count copy');
assert.ok(extractFn(html, 'function aideManageDelete1SelectAll()').includes('aideManageDelete1Active'), 'select all is manage-mode only');
assert.ok(extractFn(html, 'function aideManageDelete1UnselectAll()').includes('aideManageDelete1Sel={}'), 'unselect clears');
assert.ok(!extractFn(html, 'function aideManageDelete1UnselectAll()').includes('postAideAction'), 'unselect does not post');
const credToggle = extractFn(html, 'function aideCredToggleManage()');
assert.ok(credToggle.includes('aideCredHideForManage()') && credToggle.includes('aideCredShowAfterManage()'), 'Manage closes credentials and leaves on the Aides list');
const credBack = extractFn(html, 'function aideCredShowAfterManage()');
assert.ok(credBack.includes('root.hidden=true') && credBack.includes("aideCredState.view='list'"), 'leaving Manage keeps the credential panel closed');
assert.ok(!credBack.includes('aideCredPaintList'), 'leaving Manage does not reopen the credential list');
const credHide = extractFn(html, 'function aideCredHideForManage()');
assert.ok(credHide.includes('root.hidden=true') && credHide.includes("aideCredState.view='list'"), 'Manage forces the credentials root hidden and leaves detail');
assert.ok(credHide.includes('aideCredCloseSheet()'), 'Manage closes the credential sheet');
const credAfter = extractFn(html, 'function aideCredsAfterAides()');
assert.ok(credAfter.indexOf('aideCredManageOn()') < credAfter.indexOf('root.hidden=!show'), 'credentials refresh cannot unhide the root during Manage');
const credRefresh = extractFn(html, 'async function aideCredsRefresh()');
assert.ok(credRefresh.indexOf('if(aideCredManageOn())return;') < credRefresh.indexOf('aideCredPaintList()'), 'credentials rollup does not paint during Manage');
assert.ok(extractFn(html, 'function aideCredPaintDetail(messageHtml)').includes('if(aideCredManageOn())'), 'credential detail does not paint during Manage');

function classList(){
  const set = new Set();
  return {
    add: function(c){set.add(c);},
    remove: function(c){set.delete(c);},
    contains: function(c){return set.has(c);},
    toggle: function(c, on){
      if(on === undefined){
        if(set.has(c))set.delete(c);
        else set.add(c);
        return;
      }
      if(on)set.add(c);
      else set.delete(c);
    }
  };
}
function node(id){
  return {
    id: id,
    hidden: true,
    disabled: false,
    checked: false,
    textContent: '',
    style: {display: ''},
    classList: classList(),
    attrs: {},
    getAttribute: function(k){return this.attrs[k] == null ? null : this.attrs[k];},
    setAttribute: function(k, v){this.attrs[k] = String(v);},
    closest: function(){return null;}
  };
}
const checks = [
  node('cb1'),
  node('cb2'),
  node('cb3')
];
checks[0].attrs = {'data-aide-key': 'id:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'data-aide-id': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'data-aide-user': 'amina'};
checks[1].attrs = {'data-aide-key': 'id:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'data-aide-id': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'data-aide-user': 'jordan'};
checks[2].attrs = {'data-aide-key': 'id:cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'data-aide-id': 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'data-aide-user': 'priya'};
checks.forEach(function(el){
  el.closest = function(sel){
    if(sel === 'article')return el.card;
    return null;
  };
  el.card = {classList: classList()};
});
const els = {
  tab_aides: node('tab_aides'),
  aideManageBar: node('aideManageBar'),
  aideManageCount: node('aideManageCount'),
  aideManageDeleteSelected: node('aideManageDeleteSelected'),
  aideManageSure: node('aideManageSure'),
  aideManageConfirm: node('aideManageConfirm'),
  aideManageConfirmTitle: node('aideManageConfirmTitle'),
  aideManageConfirmGo: node('aideManageConfirmGo'),
  aideCredManageBtn: node('aideCredManageBtn'),
  aidesContainer: {
    id: 'aidesContainer',
    querySelectorAll: function(sel){
      if(sel === 'input.aide-manage-cb')return checks;
      return [];
    }
  }
};
els.tab_aides.hidden = false;
els.tab_aides.classList.add('aide-manage-on');
els.aideManageSure.hidden = true;
els.aideManageConfirm.hidden = true;
els.aideManageSure.scrollIntoView = function(){els.aideManageSure.scrolled = true;};

const posts = [];
const toasts = [];
let rendered = 0;
let invalidated = 0;
let inflight = 0;
let failSecond = false;
const names = [
  'function aideManageDelete1Key(user)',
  'function aideManageDelete1Active()',
  'function aideManageDelete1IsSelected(user)',
  'function aideManageDelete1CheckHtml(user)',
  'function aideManageDelete1Boxes()',
  'function aideManageDelete1Toggle(el)',
  'function aideManageDelete1Picks()',
  'function aideManageDelete1PaintCount()',
  'function aideManageDelete1SelectAll()',
  'function aideManageDelete1UnselectAll()',
  'function aideManageDelete1Clear()',
  'function aideManageDelete1OpenConfirm()',
  'function aideManageDelete1CloseConfirm()',
  'function aideManageDelete1Sync()',
  'function aideManageDelete1OnDesk()',
  'function aideManageDelete1Bind()',
  'async function aideManageDelete1Run()'
];
const src = ["var aideManageDelete1Sel={};", "var aideManageDelete1Busy=false;"].concat(names.map(function(sig){return extractFn(html, sig);})).join('\n');
const box = {
  aideDesk: 'active',
  currentAdminRole: 'Admin',
  aideManageDelete1Sel: {},
  aideManageDelete1Busy: false,
  document: {
    getElementById: function(id){return els[id] || null;},
    addEventListener: function(){}
  },
  canManageAides: function(){return box.currentAdminRole === 'Admin' || box.currentAdminRole === 'Scheduler';},
  evercareSbEnabled: function(){return true;},
  escapeAttr: function(s){return String(s == null ? '' : s).replace(/"/g, '&quot;');},
  showTempMsg: function(msg, color){toasts.push({msg: msg, color: color});},
  logActivity: function(){},
  cacheInvalidate: function(){invalidated++;},
  renderAides: async function(){rendered++;},
  aceActionError: function(data, err){return (data && data.error) || (err && err.message) || 'Request failed.';},
  postAideAction: async function(action, alias, payload){
    inflight++;
    assert.strictEqual(inflight, 1, 'deactivate calls stay serial');
    await new Promise(function(resolve){setTimeout(resolve, 5);});
    inflight--;
    posts.push({action: action, alias: alias, payload: JSON.parse(JSON.stringify(payload))});
    if(failSecond && payload.aideId === 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'){
      return {data: {success: false, error: 'Could not hide this aide.'}, err: null, action: action};
    }
    return {data: {success: true, is_active: false, deactivated_at: '2026-09-28T20:00:00.000Z'}, err: null, action: action};
  }
};
vm.createContext(box);
vm.runInContext(src, box);

const checkHtml = box.aideManageDelete1CheckHtml({id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', username: 'amina', name: 'Amina Hassan'});
assert.ok(checkHtml.includes('aria-label="Select Amina Hassan"'), checkHtml);
assert.ok(checkHtml.includes('class="aide-manage-cb"'), checkHtml);
box.currentAdminRole = 'Nurse';
assert.strictEqual(box.aideManageDelete1CheckHtml({id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', username: 'amina', name: 'Amina'}), '', 'Nurse rows have no checkbox');
box.currentAdminRole = 'Admin';
box.aideDesk = 'deleted';
assert.strictEqual(box.aideManageDelete1CheckHtml({id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', username: 'amina', name: 'Amina'}), '', 'Recently deleted has no bulk checkbox');
box.aideDesk = 'active';

box.aideManageDelete1Sync();
assert.strictEqual(els.aideManageBar.hidden, false, 'bar shows when Manage is on');
assert.strictEqual(els.aideManageDeleteSelected.disabled, true, 'Delete selected disabled at 0');
assert.strictEqual(els.aideManageCount.textContent, '0 selected');
assert.strictEqual(els.aideCredManageBtn.getAttribute('aria-pressed'), 'true');

box.aideManageDelete1OpenConfirm();
assert.strictEqual(els.aideManageConfirm.hidden, true, 'empty selection does not confirm');
assert.strictEqual(posts.length, 0);

box.aideManageDelete1SelectAll();
assert.strictEqual(box.aideManageDelete1Picks().length, 3, 'select all checks every visible aide');
assert.ok(checks.every(function(el){return el.checked && el.card.classList.contains('is-selected');}));
assert.strictEqual(els.aideManageCount.textContent, '3 selected');
assert.strictEqual(els.aideManageDeleteSelected.disabled, false, 'Delete selected enables at N>=1');
assert.strictEqual(posts.length, 0, 'select all does not post');

box.aideManageDelete1UnselectAll();
assert.strictEqual(box.aideManageDelete1Picks().length, 0);
assert.ok(checks.every(function(el){return !el.checked;}));
assert.strictEqual(els.aideManageCount.textContent, '0 selected');
assert.strictEqual(els.aideManageDeleteSelected.disabled, true);
assert.strictEqual(els.aideManageBar.hidden, false, 'Unselect all leaves the pair on screen');
assert.strictEqual(posts.length, 0, 'unselect does not post');

box.aideManageDelete1Toggle(checks[0]);
checks[0].checked = true;
box.aideManageDelete1Toggle(checks[0]);
box.aideManageDelete1Toggle(checks[1]);
checks[1].checked = true;
box.aideManageDelete1Toggle(checks[1]);
assert.strictEqual(box.aideManageDelete1Picks().length, 2);
box.aideManageDelete1OpenConfirm();
assert.strictEqual(els.aideManageSure.hidden, false, 'Are you sure is on the page');
assert.strictEqual(els.aideManageSure.scrolled, true);
assert.strictEqual(els.aideManageConfirm.hidden, false, 'sheet opens');
assert.ok(els.tab_aides.classList.contains('aide-manage-confirming'));
assert.strictEqual(els.aideManageConfirmTitle.textContent, 'Delete 2 aides?');
box.aideManageDelete1CloseConfirm();
assert.strictEqual(els.aideManageConfirm.hidden, true, 'Cancel closes');
assert.strictEqual(els.aideManageSure.hidden, true);
assert.strictEqual(posts.length, 0, 'Cancel does not deactivate');
assert.strictEqual(box.aideManageDelete1Picks().length, 2, 'Cancel keeps the selection');

box.aideManageDelete1OpenConfirm();
const beforeRender = rendered;
(async function(){
await box.aideManageDelete1Run();
assert.strictEqual(posts.length, 2, 'one deactivate per selected id');
assert.deepStrictEqual(posts.map(function(p){return p.action;}), ['admin_deactivate_aide', 'admin_deactivate_aide']);
assert.deepStrictEqual(posts.map(function(p){return p.payload.aideId;}), [
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
]);
posts.forEach(function(p){
  assert.ok(!('tempPassword' in p.payload) && !('p_temp_password' in p.payload), 'no password field');
  assert.strictEqual(p.alias, '');
});
assert.strictEqual(els.aideManageConfirm.hidden, true, 'confirm closes after the loop');
assert.strictEqual(els.aideManageSure.hidden, true);
assert.strictEqual(box.aideManageDelete1Picks().length, 0);
assert.ok(rendered > beforeRender, 'Active list refreshes');
assert.strictEqual(invalidated, 1, 'Recently deleted cache is dropped');
assert.ok(/2 aides moved to Recently deleted/.test(toasts[toasts.length - 1].msg), toasts[toasts.length - 1].msg);

box.aideManageDelete1Toggle(checks[2]);
checks[2].checked = true;
box.aideManageDelete1Toggle(checks[2]);
box.aideManageDelete1OpenConfirm();
assert.strictEqual(els.aideManageConfirmTitle.textContent, 'Delete 1 aide?');
posts.length = 0;
toasts.length = 0;
await box.aideManageDelete1Run();
assert.strictEqual(posts.length, 1);
assert.ok(/1 aide moved to Recently deleted/.test(toasts[0].msg));

failSecond = true;
box.aideManageDelete1Toggle(checks[0]);
checks[0].checked = true;
box.aideManageDelete1Toggle(checks[0]);
box.aideManageDelete1Toggle(checks[1]);
checks[1].checked = true;
box.aideManageDelete1Toggle(checks[1]);
posts.length = 0;
toasts.length = 0;
await box.aideManageDelete1Run();
assert.strictEqual(posts.length, 2, 'a failed id does not stop the loop');
assert.ok(toasts.some(function(t){return t.color === 'var(--danger)' && /Could not hide this aide/.test(t.msg);}));
assert.ok(toasts.some(function(t){return /moved to Recently deleted/.test(t.msg);}));

box.evercareSbEnabled = function(){return false;};
box.aideManageDelete1Toggle(checks[0]);
checks[0].checked = true;
box.aideManageDelete1Toggle(checks[0]);
posts.length = 0;
toasts.length = 0;
box.aideManageDelete1OpenConfirm();
await box.aideManageDelete1Run();
assert.strictEqual(posts.length, 0, 'sheets rollback does not post');
assert.ok(/Supabase aides desk/.test(toasts[0].msg));

const credRoot = node('aideCredsRoot');
credRoot.hidden = false;
credRoot.innerHTML = 'creds';
const credDetail = node('aideCredDetail');
credDetail.hidden = false;
credDetail.innerHTML = 'Andre';
const credList = node('aideCredList');
credList.hidden = false;
const credSheet = node('aideCredSheet');
credSheet.hidden = false;
const credTab = node('tab_aides');
const credBtn = node('aideCredManageBtn');
const credEls = {aideCredsRoot: credRoot, aideCredDetail: credDetail, aideCredList: credList, aideCredSheet: credSheet, tab_aides: credTab, aideCredManageBtn: credBtn};
const credSrc = [
  'var aideCredState={view:"detail",seq:1,sheetOpen:true,pickAide:false,editing:{id:"1"},credentials:[{id:"1"}]};',
  extractFn(html, 'function aideCredManageOn()'),
  extractFn(html, 'function aideCredHideForManage()'),
  extractFn(html, 'function aideCredShowAfterManage()'),
  extractFn(html, 'function aideCredToggleManage()'),
  extractFn(html, 'function aideCredsAfterAides()')
].join('\n');
const credBox = {
  aideCredState: {view:'detail', seq:1, sheetOpen:true, pickAide:false, editing:{id:'1'}, credentials:[{id:'1'}]},
  aideDesk: 'active',
  currentAdminRole: 'Admin',
  document: {getElementById: function(id){return credEls[id] || null;}},
  aideCredBind: function(){credBox.bound = true;},
  aideCredsIsAdmin: function(){return true;},
  aideCredCloseSheet: function(){credSheet.hidden = true; credBox.aideCredState.sheetOpen = false;},
  aideCredPaintList: function(){credBox.painted = true; credList.hidden = false; credDetail.hidden = true;},
  aideManageDelete1Clear: function(){credBox.cleared = true;},
  aideManageDelete1Sync: function(){credBox.synced = true;}
};
vm.createContext(credBox);
vm.runInContext(credSrc, credBox);
credBox.aideCredToggleManage();
assert.strictEqual(credTab.classList.contains('aide-manage-on'), true);
assert.strictEqual(credRoot.hidden, true, 'Manage hides the credentials root');
assert.strictEqual(credDetail.innerHTML, '', 'Manage clears the Andre credential card');
assert.strictEqual(credBox.aideCredState.view, 'list');
assert.strictEqual(credSheet.hidden, true);
credBox.bound = false;
credBox.aideCredsAfterAides();
assert.strictEqual(credRoot.hidden, true, 'refresh during Manage does not show credentials');
assert.strictEqual(credBox.bound, true);
credTab.classList.add('aide-creds-on');
credDetail.innerHTML = 'Andre';
credBox.aideCredState.view = 'detail';
credBox.aideCredState.aideName = 'Andre';
credBox.aideCredToggleManage();
assert.strictEqual(credTab.classList.contains('aide-manage-on'), false);
assert.strictEqual(credTab.classList.contains('aide-creds-on'), false, 'leaving Manage shows the Aides list');
assert.strictEqual(credRoot.hidden, true, 'leaving Manage does not reopen credentials');
assert.strictEqual(credDetail.innerHTML, '');
assert.strictEqual(credBox.aideCredState.view, 'list');
assert.strictEqual(credBox.aideCredState.aideName, '');
assert.strictEqual(credBox.painted, undefined);

const clientsHdr = html.slice(html.indexOf('id="tab_clients"'), html.indexOf('id="clientSearch"'));
assert.ok(clientsHdr.includes('id="clientManageSure"') && clientsHdr.includes('>Are you sure?</p>'), 'Clients Are you sure sits at the top of the page');
assert.ok(clientsHdr.indexOf('id="clientManageSure"') < clientsHdr.indexOf('class="page-hdr"'), 'Clients sure heading is above the title');
assert.ok(clientsHdr.includes('id="clientsAzChip"') && clientsHdr.includes('onclick="listAz1Toggle(event)"'), 'Clients A–Z chip stays');
assert.ok(clientsHdr.includes('id="clientManageBtn"') && clientsHdr.includes('onclick="clientManageDelete1ToggleManage()"'), 'Clients Manage toggles this desk');
assert.ok(clientsHdr.includes('data-client-desk="active"') && clientsHdr.includes('>Recently deleted<'), 'Clients Active and Recently deleted tabs');
assert.ok(clientsHdr.includes('id="clientManageSelectAll"') && clientsHdr.includes('>Select all<') && clientsHdr.includes('>Unselect all<'), 'Clients select pair stays visible');
assert.ok(clientsHdr.indexOf('>Select all<') < clientsHdr.indexOf('>Unselect all<'), 'Clients Select all stays beside Unselect all');
assert.ok(clientsHdr.includes('id="clientManageDeleteSelected"') && clientsHdr.includes('>Delete selected<'), 'Clients Delete selected');
assert.ok(clientsHdr.includes('id="clientInsLegend"') && clientsHdr.includes('data-client-ins1="v=client-ins1"'), 'client-ins1 legend stays');
assert.ok(!clientsHdr.includes('Manage ON'), 'no Clients Manage ON badge');
const clientSheet = html.slice(html.indexOf('id="clientManageConfirm"'), html.indexOf('id="tab_nurse"'));
assert.ok(clientSheet.includes('They move to Recently deleted.'), 'Clients recently deleted copy');
assert.ok(clientSheet.includes('id="clientManageConfirmGo"') && clientSheet.includes('>Delete selected<'), 'Clients primary Delete selected');
assert.ok(!clientSheet.includes('>Are you sure?<'), 'Clients Are you sure is not only the sheet title');
assert.ok(!clientSheet.includes('>Restore<'), 'no invented Clients Restore');
const clientRun = extractFn(html, 'async function clientManageDelete1Run()');
assert.ok(clientRun.includes("apiPost({action:'archive_client', clientId:id, id:id})"), 'Clients bulk reuses archive_client');
assert.ok(clientRun.includes('for(i=0;i<picks.length;i++)'), 'one archive call per selected client');
assert.ok(clientRun.includes('res.is_active===false'), 'archive success is is_active false');
assert.ok(clientRun.includes('sbSoftUnassignClient(id)'), 'confirmed archive also soft-unassigns that client');
assert.ok(clientRun.includes("String(res.id||res.clientId||'')===String(id)"), 'archive is verified by the selected id');
assert.ok(clientRun.includes('renderClients(true)'), 'Clients list refreshes');
assert.ok(clientRun.includes("cacheInvalidate('get_clients')"), 'Clients cache drops');
assert.ok(!/reset_aide_temp_password|reseal|mossier|admin_deactivate_client|sbRestRpc|method:\s*'DELETE'|DELETE\s+FROM/.test(clientRun), 'Clients bulk never reseals, hard-deletes, or invents a client RPC');
assert.ok(extractFn(html, 'function deleteClient(id)').includes("showSharedConfirm('Delete this client? This cannot be undone.'"), 'single client delete confirm stays');
assert.ok(html.includes("if(payload.clientDesk==='deleted')clientPairs.push(['is_active','eq.false']);"), 'Recently deleted clients are is_active false');
assert.ok(html.includes("else if(!payload.includeInactive)clientPairs.push(['is_active','eq.true']);"), 'Active clients stay is_active true unless includeInactive');
const clientOpen = extractFn(html, 'function clientManageDelete1OpenConfirm()');
assert.ok(clientOpen.includes('clientManageSure'), 'Clients confirm reveals the page heading');
assert.ok(clientOpen.includes("'Delete 1 client?'") && clientOpen.includes("'Delete '+n+' clients?'"), 'client count copy');
assert.ok(!extractFn(html, 'function clientManageDelete1UnselectAll()').includes('apiPost'), 'client unselect does not post');
const unassignClient = extractFn(html, 'async function sbSoftUnassignClient(clientId)');
assert.ok(unassignClient.includes("['client_id','eq.'+id]") && unassignClient.includes("['is_active','eq.true']"), 'assignment soft-unassign filters client_id and active rows');
assert.ok(unassignClient.includes('{is_active:false}'), 'assignment update is is_active false');
assert.ok(!/method:\s*'DELETE'|DELETE\s+FROM/.test(unassignClient), 'assignment unassign is not a hard DELETE');
const restoreClient = extractFn(html, 'async function sbAdminRestoreClient(payload)');
assert.ok(restoreClient.includes("{is_active:true}") && restoreClient.includes("['select','id,is_active']"), 'client restore is PATCH is_active true verified by id select');
assert.ok(!/sbRestRpc|admin_restore_client|admin_deactivate_client/.test(restoreClient), 'client restore is not an RPC');
assert.ok(html.includes('function restoreClient(id)') && html.includes('↺ Restore</button>'), 'Recently deleted clients can restore');
assert.ok(html.includes("action:'restore_client'"), 'restore posts restore_client');

const cchecks = [node('cc1'), node('cc2')];
cchecks[0].attrs = {'data-client-key':'id:c1', 'data-client-id':'c1'};
cchecks[1].attrs = {'data-client-key':'id:c2', 'data-client-id':'c2'};
cchecks.forEach(function(el){
  el.closest = function(sel){return sel === '.aide-card' ? el.card : null;};
  el.card = {classList: classList()};
});
const cels = {
  tab_clients: node('tab_clients'),
  clientManageBar: node('clientManageBar'),
  clientManageCount: node('clientManageCount'),
  clientManageDeleteSelected: node('clientManageDeleteSelected'),
  clientManageSure: node('clientManageSure'),
  clientManageConfirm: node('clientManageConfirm'),
  clientManageConfirmTitle: node('clientManageConfirmTitle'),
  clientManageConfirmGo: node('clientManageConfirmGo'),
  clientManageBtn: node('clientManageBtn'),
  clientsContainer: {querySelectorAll: function(sel){return sel === 'input.aide-manage-cb' ? cchecks : [];}}
};
cels.tab_clients.classList.add('client-manage-on');
cels.clientManageSure.scrollIntoView = function(){};
const cposts = [];
const ctoasts = [];
const cunassign = [];
const cnames = [
  'function clientManageDelete1Key(client)',
  'function clientManageDelete1Active()',
  'function clientManageDelete1IsSelected(client)',
  'function clientManageDelete1CheckHtml(client)',
  'function clientManageDelete1Boxes()',
  'function clientManageDelete1Toggle(el)',
  'function clientManageDelete1Picks()',
  'function clientManageDelete1PaintCount()',
  'function clientManageDelete1SelectAll()',
  'function clientManageDelete1UnselectAll()',
  'function clientManageDelete1Clear()',
  'function clientManageDelete1OpenConfirm()',
  'function clientManageDelete1CloseConfirm()',
  'function clientManageDelete1Sync()',
  'function clientManageDelete1OnDesk()',
  'function clientManageDelete1ToggleManage()',
  'function clientManageDelete1Bind()',
  'async function clientManageDelete1Run()'
];
const csrc = ["var clientManageDelete1Sel={};", "var clientManageDelete1Busy=false;"].concat(cnames.map(function(sig){return extractFn(html, sig);})).join('\n');
const cbox = {
  clientDesk: 'active',
  currentAdminRole: 'Admin',
  clientManageDelete1Sel: {},
  clientManageDelete1Busy: false,
  document: {getElementById: function(id){return cels[id] || null;}, addEventListener: function(){}},
  canManageAides: function(){return cbox.currentAdminRole === 'Admin' || cbox.currentAdminRole === 'Scheduler';},
  evercareSbEnabled: function(){return true;},
  escapeAttr: function(s){return String(s == null ? '' : s);},
  showTempMsg: function(msg, color){ctoasts.push({msg: msg, color: color});},
  cacheInvalidate: function(){},
  renderClients: async function(){},
  aceActionError: function(data, err){return (data && data.error) || (err && err.message) || 'Request failed.';},
  apiPost: async function(payload){
    cposts.push(JSON.parse(JSON.stringify(payload)));
    return {success: true, is_active: false, id: payload.id};
  },
  sbSoftUnassignClient: async function(id){
    cunassign.push(id);
    return {ok: true, data: []};
  }
};
vm.createContext(cbox);
vm.runInContext(csrc, cbox);
assert.ok(cbox.clientManageDelete1CheckHtml({id:'c1', name:'Helen Vargas'}).includes('aria-label="Select Helen Vargas"'));
cbox.currentAdminRole = 'Nurse';
assert.strictEqual(cbox.clientManageDelete1CheckHtml({id:'c1', name:'Helen'}), '', 'Nurse client rows have no checkbox');
cbox.currentAdminRole = 'Admin';
cbox.clientDesk = 'deleted';
assert.strictEqual(cbox.clientManageDelete1CheckHtml({id:'c1', name:'Helen'}), '', 'Recently deleted clients have no checkbox');
cbox.clientDesk = 'active';
cbox.clientManageDelete1Sync();
cbox.clientManageDelete1SelectAll();
assert.strictEqual(cbox.clientManageDelete1Picks().length, 2);
assert.strictEqual(cposts.length, 0, 'client select all does not post');
cbox.clientManageDelete1UnselectAll();
assert.strictEqual(cbox.clientManageDelete1Picks().length, 0);
cchecks[0].checked = true;
cbox.clientManageDelete1Toggle(cchecks[0]);
cchecks[1].checked = true;
cbox.clientManageDelete1Toggle(cchecks[1]);
cbox.clientManageDelete1OpenConfirm();
assert.strictEqual(cels.clientManageSure.hidden, false);
assert.strictEqual(cels.clientManageConfirmTitle.textContent, 'Delete 2 clients?');
await cbox.clientManageDelete1Run();
assert.strictEqual(cposts.length, 2);
assert.deepStrictEqual(cposts[0], {action:'archive_client', clientId:'c1', id:'c1'});
assert.deepStrictEqual(cposts[1], {action:'archive_client', clientId:'c2', id:'c2'});
assert.deepStrictEqual(cunassign, ['c1', 'c2']);
assert.ok(/2 clients moved to Recently deleted/.test(ctoasts[0].msg));

const tsPanel = html.slice(html.indexOf('id="tab_timesheets"'), html.indexOf('id="tab_payroll"'));
assert.ok(tsPanel.indexOf('id="tsManageSure"') < tsPanel.indexOf('id="payReady"'), 'Timesheets Are you sure sits above pay readiness');
assert.ok(tsPanel.includes('>Are you sure?</p>'), 'Timesheets page-level Are you sure');
assert.ok(tsPanel.includes('id="tsManageBtn"') && tsPanel.includes('onclick="tsManageDelete1ToggleManage()"'), 'Timesheets Manage toggles this desk');
assert.ok(tsPanel.includes('id="tsManageSelectAll"') && tsPanel.includes('>Select all<') && tsPanel.includes('>Unselect all<'), 'Timesheets select pair stays visible');
assert.ok(tsPanel.indexOf('>Select all<') < tsPanel.indexOf('>Unselect all<'), 'Timesheets Select all stays beside Unselect all');
assert.ok(tsPanel.includes('id="tsManageDeleteSelected"') && tsPanel.includes('>Delete selected<'), 'Timesheets Delete selected');
assert.ok(tsPanel.includes('data-ts-desk="active"') && tsPanel.includes('>Recently deleted<'), 'Timesheets Active and Recently deleted stay');
assert.ok(!tsPanel.includes('data-ts-desk="archived"') && !tsPanel.includes('>Archived<'), 'Timesheets Archived tab is gone');
assert.ok(tsPanel.includes('id="payReadyExport"') && tsPanel.includes('id="exportAllPdfsBtn"'), 'payready and pdf desk stay');
assert.ok(!tsPanel.includes('Manage ON'), 'no Timesheets Manage ON badge');
const tsSheet = html.slice(html.indexOf('id="tsManageConfirm"'), html.indexOf('id="tab_payroll"'));
assert.ok(tsSheet.includes('They move to Recently deleted.'), 'Timesheets recently deleted copy');
assert.ok(tsSheet.includes('id="tsManageConfirmGo"') && tsSheet.includes('>Delete selected<'), 'Timesheets primary Delete selected');
assert.ok(!tsSheet.includes('>Are you sure?<'), 'Timesheets Are you sure is not only the sheet title');
const tsRun = extractFn(html, 'async function tsManageDelete1Run()');
assert.ok(tsRun.includes("apiPost({action:'trash_timesheet', id:id})"), 'Timesheets bulk reuses trash_timesheet');
assert.ok(tsRun.includes('for(i=0;i<picks.length;i++)'), 'one trash call per selected timesheet');
assert.ok(tsRun.includes('res.is_active===false&&res.deleted_at'), 'trash success needs is_active false and deleted_at');
assert.ok(tsRun.includes('renderTimesheets()'), 'Timesheets list refreshes');
assert.ok(tsRun.includes("cacheInvalidate('get_all')"), 'Timesheets cache drops');
assert.ok(!/reset_aide_temp_password|reseal|mossier|action:\s*'delete'|sbAdminSoftDeleteTimesheet|sbRestRpc|method:\s*'DELETE'|DELETE\s+FROM/.test(tsRun), 'Timesheets bulk never reseals, hard-deletes, or archives without deleted_at');
assert.ok(extractFn(html, 'function quickDelete(id)').includes("showSharedConfirm('Delete this timesheet?'"), 'single delete confirm is the trash confirm');
assert.ok(extractFn(html, 'function quickDelete(id)').includes('commitTimesheetTrash'), 'single delete uses trash_timesheet');
assert.ok(html.includes("action:'restore_trashed_timesheet'"), 'existing trash restore stays');
const trashFn = extractFn(html, 'async function sbAdminTrashTimesheet(payload)');
assert.ok(trashFn.includes('is_active:false,deleted_at:stamp') && trashFn.includes("['select','id,is_active,deleted_at']"), 'trash PATCH sets deleted_at and selects the stamp');
assert.ok(!/method:\s*'DELETE'|DELETE\s+FROM/.test(trashFn), 'trash is not a hard DELETE');
const trashRestore = extractFn(html, 'async function sbAdminRestoreTrashedTimesheet(payload)');
assert.ok(trashRestore.includes('is_active:true,deleted_at:null') && trashRestore.includes("['deleted_at','not.is.null']"), 'Recently deleted restore requires deleted_at');
const archiveOnly = extractFn(html, 'async function sbAdminSoftDeleteTimesheet(payload)');
assert.ok(!archiveOnly.includes('deleted_at:'), 'box Archive does not set deleted_at');
const tsOpen = extractFn(html, 'function tsManageDelete1OpenConfirm()');
assert.ok(tsOpen.includes('tsManageSure'), 'Timesheets confirm reveals the page heading');
assert.ok(tsOpen.includes("'Delete 1 timesheet?'") && tsOpen.includes("'Delete '+n+' timesheets?'"), 'timesheet count copy');
assert.ok(!extractFn(html, 'function tsManageDelete1UnselectAll()').includes('apiPost'), 'timesheet unselect does not post');
const paintFn = html.slice(html.indexOf('function paintTimesheets'), html.indexOf('function layoutA1BackupFail'));
assert.ok(paintFn.includes('class="ts-card-top"><strong>${aideShown}'), 'timesheet card strong stays the aide name');
assert.ok(paintFn.includes('class="ts-card-sub">${clientShown'), 'timesheet card subtitle stays');

const tchecks = [node('tc1'), node('tc2')];
tchecks[0].attrs = {'data-ts-key':'id:t1', 'data-ts-id':'t1'};
tchecks[1].attrs = {'data-ts-key':'id:t2', 'data-ts-id':'t2'};
tchecks.forEach(function(el){
  el.closest = function(sel){return sel === 'article.ts-card' ? el.card : null;};
  el.card = {classList: classList()};
});
const tels = {
  tab_timesheets: node('tab_timesheets'),
  tsManageBar: node('tsManageBar'),
  tsManageCount: node('tsManageCount'),
  tsManageDeleteSelected: node('tsManageDeleteSelected'),
  tsManageSure: node('tsManageSure'),
  tsManageConfirm: node('tsManageConfirm'),
  tsManageConfirmTitle: node('tsManageConfirmTitle'),
  tsManageConfirmGo: node('tsManageConfirmGo'),
  tsManageBtn: node('tsManageBtn'),
  tsCards: {querySelectorAll: function(sel){return sel === 'input.aide-manage-cb' ? tchecks : [];}}
};
tels.tab_timesheets.classList.add('ts-manage-on');
tels.tsManageSure.scrollIntoView = function(){};
const tposts = [];
const ttoasts = [];
const tnames = [
  'function tsManageDelete1Key(rec)',
  'function tsManageDelete1Active()',
  'function tsManageDelete1IsSelected(rec)',
  'function tsManageDelete1CheckHtml(rec)',
  'function tsManageDelete1Boxes()',
  'function tsManageDelete1Toggle(el)',
  'function tsManageDelete1Picks()',
  'function tsManageDelete1PaintCount()',
  'function tsManageDelete1SelectAll()',
  'function tsManageDelete1UnselectAll()',
  'function tsManageDelete1Clear()',
  'function tsManageDelete1OpenConfirm()',
  'function tsManageDelete1CloseConfirm()',
  'function tsManageDelete1Sync()',
  'function tsManageDelete1OnDesk()',
  'function tsManageDelete1ToggleManage()',
  'function tsManageDelete1Bind()',
  'async function tsManageDelete1Run()'
];
const tsrc = ["var tsManageDelete1Sel={};", "var tsManageDelete1Busy=false;"].concat(tnames.map(function(sig){return extractFn(html, sig);})).join('\n');
const tbox = {
  tsDesk: 'active',
  currentAdminRole: 'Admin',
  tsManageDelete1Sel: {},
  tsManageDelete1Busy: false,
  document: {getElementById: function(id){return tels[id] || null;}, addEventListener: function(){}},
  canManageAides: function(){return tbox.currentAdminRole === 'Admin' || tbox.currentAdminRole === 'Scheduler';},
  evercareSbEnabled: function(){return true;},
  escapeAttr: function(s){return String(s == null ? '' : s);},
  showTempMsg: function(msg, color){ttoasts.push({msg: msg, color: color});},
  cacheInvalidate: function(){},
  renderTimesheets: async function(){},
  aceActionError: function(data, err){return (data && data.error) || (err && err.message) || 'Request failed.';},
  apiPost: async function(payload){
    tposts.push(JSON.parse(JSON.stringify(payload)));
    if(payload && payload.id === 't2') return {success: true, is_active: false};
    return {success: true, is_active: false, deleted_at: '2026-09-28T12:00:00Z', id: payload.id};
  }
};
vm.createContext(tbox);
vm.runInContext(tsrc, tbox);
assert.ok(tbox.tsManageDelete1CheckHtml({id:'t1', empName:'Andre'}).includes('aria-label="Select Andre"'));
tbox.currentAdminRole = 'Nurse';
assert.strictEqual(tbox.tsManageDelete1CheckHtml({id:'t1', empName:'Andre'}), '', 'Nurse timesheet rows have no checkbox');
tbox.currentAdminRole = 'Admin';
tbox.tsDesk = 'deleted';
assert.strictEqual(tbox.tsManageDelete1CheckHtml({id:'t1', empName:'Andre'}), '', 'Recently deleted timesheets have no checkbox');
tbox.tsDesk = 'archived';
assert.strictEqual(tbox.tsManageDelete1CheckHtml({id:'t1', empName:'Andre'}), '', 'Archived timesheets have no checkbox');
tbox.tsDesk = 'active';
tbox.tsManageDelete1Sync();
tbox.tsManageDelete1SelectAll();
assert.strictEqual(tbox.tsManageDelete1Picks().length, 2);
assert.strictEqual(tposts.length, 0, 'timesheet select all does not post');
tbox.tsManageDelete1UnselectAll();
assert.strictEqual(tbox.tsManageDelete1Picks().length, 0);
tchecks[0].checked = true;
tbox.tsManageDelete1Toggle(tchecks[0]);
tchecks[1].checked = true;
tbox.tsManageDelete1Toggle(tchecks[1]);
tbox.tsManageDelete1OpenConfirm();
assert.strictEqual(tels.tsManageSure.hidden, false);
assert.strictEqual(tels.tsManageConfirmTitle.textContent, 'Delete 2 timesheets?');
await tbox.tsManageDelete1Run();
assert.strictEqual(tposts.length, 2);
assert.deepStrictEqual(tposts[0], {action:'trash_timesheet', id:'t1'});
assert.deepStrictEqual(tposts[1], {action:'trash_timesheet', id:'t2'});
assert.ok(/1 timesheet moved to Recently deleted/.test(ttoasts[0].msg), 'only the stamped row counts');
assert.ok(ttoasts[1] && ttoasts[1].msg, 'missing deleted_at is not a success');

console.log('admin-aide-manage-delete1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
