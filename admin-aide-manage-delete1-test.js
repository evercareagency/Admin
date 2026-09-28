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

assert.ok(html.includes('v=aide-manage-delete1'), 'marker');
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

console.log('admin-aide-manage-delete1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
