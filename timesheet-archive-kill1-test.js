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

assert.ok(html.includes('v=timesheet-archive-kill1'), 'marker');
assert.ok(html.includes('?v=timesheet-archive-kill1'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-28-timesheet-archive-kill1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-timesheet-archive-kill1">'), 'meta');
assert.ok(html.includes("var TIMESHEET_ARCHIVE_KILL1_MARKER='v=timesheet-archive-kill1'"), 'script marker');
assert.ok(html.includes('GHOST-TIMESHEET-ARCHIVE-KILL1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace migrate DONE'), 'Ace migrate DONE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('v=aide-manage-delete1') && html.includes('v=manage-done1') && html.includes('v=manage-dots-creds1') && html.includes('v=payready1') && html.includes('v=pdf1p'), 'prior markers named');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');

const desk = html.slice(html.indexOf('aria-label="Timesheet desk"'), html.indexOf('id="tsManageBar"'));
assert.ok(desk.includes('data-ts-desk="active"') && desk.includes('>Active<'), 'Active tab');
assert.ok(desk.includes('data-ts-desk="deleted"') && desk.includes('>Recently deleted<'), 'Recently deleted tab');
assert.ok(!desk.includes('archived') && !desk.includes('>Archived<'), 'no Archived tab');
assert.ok(!html.includes('data-ts-desk="archived"'), 'no archived desk attribute');
assert.ok(!html.includes('>Archived<'), 'no Archived tab label');
assert.ok(!html.includes('Archived timesheets stay on file'), 'subtitle drops archived copy');
assert.ok(!html.includes('🗄️ No archived timesheets.'), 'empty state drops archived copy');

const detail = html.slice(html.indexOf('id="tsDetailActions"'), html.indexOf('id="detailBody"'));
assert.ok(detail.includes('id="tsDetailArchiveBtn"') && detail.includes('>🗄️ Delete</button>'), 'cabinet label is Delete');
assert.ok(detail.includes('mbtn-archive'), 'cabinet class stays');
assert.ok(detail.includes('id="tsDetailRestoreBtn"') && detail.includes('onclick="restoreCurrentTimesheet()"'), 'detail Restore stays');
assert.ok(detail.includes('id="tsDetailMoreDelete"') && detail.includes('trashTimesheet()') && detail.includes('>Delete…</button>'), 'More Delete stays as alias');
assert.ok(!detail.includes('🗄️ Archive'), 'Archive label is gone');
assert.ok(!html.includes("showSharedConfirm('Archive this timesheet?'"), 'archive confirm is gone');
assert.ok(!html.includes("'Yes, archive'"), 'Yes, archive is gone');
assert.ok(!html.includes('onclick="restoreArchivedTimesheet('), 'row Archive Restore is not wired');

const quick = extractFn(html, 'function quickDelete(id)');
const del = extractFn(html, 'function deleteRec()');
const trash = extractFn(html, 'function trashTimesheet()');
const restoreCur = extractFn(html, 'function restoreCurrentTimesheet()');
const rowBtn = extractFn(html, 'function timesheetRowDeskButton(r)');
const sync = extractFn(html, 'function syncTimesheetDetailActions(r)');
const commitTrash = extractFn(html, 'async function commitTimesheetTrash(id)');
assert.ok(quick.includes("showSharedConfirm('Delete this timesheet?'") && quick.includes("'Delete'") && quick.includes('commitTimesheetTrash'), 'quickDelete is the trash confirm');
assert.ok(!quick.includes('commitTimesheetDelete') && !quick.includes("action:'delete'"), 'quickDelete does not archive');
assert.ok(del.includes("showSharedConfirm('Delete this timesheet?'") && del.includes("'Delete'") && del.includes('commitTimesheetTrash'), 'deleteRec is the trash confirm');
assert.ok(!del.includes('commitTimesheetDelete') && !del.includes('quickDelete('), 'deleteRec does not archive or double-confirm');
assert.ok(trash.includes('deleteRec()'), 'More Delete aliases the same confirm');
assert.ok(restoreCur.includes('commitTimesheetTrashRestore') && !restoreCur.includes('commitTimesheetArchiveRestore'), 'detail Restore is trash only');
assert.ok(rowBtn.includes('restoreTrashedTimesheet') && !rowBtn.includes('restoreArchivedTimesheet'), 'rows restore only Recently deleted');
assert.ok(rowBtn.includes('title="Delete"') && rowBtn.includes('aria-label="Delete"') && rowBtn.includes('quickDelete'), 'active row cabinet is Delete');
assert.ok(sync.includes("show('tsDetailRestoreBtn',trashed)") && !sync.includes('||archived') && !sync.includes('timesheetRecordArchived'), 'Restore only when deleted_at is set');
assert.ok(commitTrash.includes("action:'trash_timesheet'") && commitTrash.includes('Moved to Recently deleted · restore 7 days.'), 'trash toast');
assert.ok(html.includes("action:'restore_trashed_timesheet'"), 'trashed restore stays');
assert.ok(html.includes('v=payready1') && html.includes('id="payReadyExport"') && html.includes('id="exportAllPdfsBtn"'), 'payready and pdf desk stay');
assert.ok(html.includes('v=list-az-sticky1') && html.includes('v=cover-desk1') && html.includes('v=aide-manage-delete1'), 'list-az, cover, aides Manage stay');
assert.ok(html.includes('MM/DD/YYYY'), 'dates people read stay MM/DD/YYYY');

const deskFns = [
  extractFn(html, 'function sbTimesheetDesk(view)'),
  extractFn(html, 'function sbTimesheetListPairs(view)'),
  extractFn(html, 'function sbTimesheetOnDesk(row, view)')
].join('\n');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(deskFns, ctx);
function pair(pairs, key){
  const hit = pairs.find(function(p){return p[0]===key;});
  return hit ? hit[1] : null;
}
const activePairs = vm.runInContext("sbTimesheetListPairs('active')", ctx);
const archivedPairs = vm.runInContext("sbTimesheetListPairs('archived')", ctx);
assert.strictEqual(vm.runInContext("sbTimesheetDesk('archived')", ctx), 'deleted');
assert.strictEqual(pair(activePairs, 'is_active'), 'eq.true');
assert.strictEqual(pair(activePairs, 'deleted_at'), 'is.null');
assert.strictEqual(pair(archivedPairs, 'deleted_at'), 'not.is.null');
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:true,deleted_at:null,status:'submitted'}, 'active')", ctx), true);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:'2026-09-28T00:00:00Z',status:'submitted'}, 'active')", ctx), false);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:null,status:'submitted'}, 'active')", ctx), false);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:null,status:'submitted'}, 'deleted')", ctx), false);

const tabs = [
  {desk:'active', on:true, selected:'true'},
  {desk:'deleted', on:false, selected:'false'}
];
const subEl = {textContent:''};
const ui = {
  tsDesk: 'active',
  document: {
    querySelectorAll: function(){return tabs;},
    getElementById: function(id){return id === 'tsDeskSub' ? subEl : null;}
  },
  renderTimesheets: function(){ui.paints = (ui.paints || 0) + 1;},
  tsManageDelete1OnDesk: function(){}
};
tabs.forEach(function(btn){
  btn.getAttribute = function(name){return name === 'data-ts-desk' ? btn.desk : '';};
  btn.classList = {toggle: function(cls, on){if(cls === 'on')btn.on = !!on;}};
  btn.setAttribute = function(name, value){if(name === 'aria-selected')btn.selected = value;};
});
vm.createContext(ui);
vm.runInContext(extractFn(html, 'function setTimesheetDesk(view)'), ui);
ui.setTimesheetDesk('archived');
assert.strictEqual(ui.tsDesk, 'deleted', 'archived desk coerces to Recently deleted');
assert.strictEqual(tabs[1].on, true);
assert.strictEqual(tabs[0].on, false);
assert.ok(!/archived/i.test(subEl.textContent), 'subtitle has no archived string');
assert.ok(/7 days/.test(subEl.textContent));
ui.setTimesheetDesk('active');
assert.strictEqual(ui.tsDesk, 'active');
assert.strictEqual(subEl.textContent, 'Active submitted caregiver timesheets');

const confirms = [];
const posts = [];
const box = {
  currentRec: {id:'ts-1', empName:'Andre', clientName:'Helen', weekStart:'2026-09-21', deleted_at:null, deletedAt:''},
  showSharedConfirm: function(title, fn, label){confirms.push({title:title, label:label, fn:fn});},
  commitTimesheetTrash: function(id){posts.push({kind:'trash', id:id});},
  commitTimesheetTrashRestore: function(id){posts.push({kind:'restore', id:id});},
  commitTimesheetArchiveRestore: function(id){posts.push({kind:'archive-restore', id:id});},
  commitTimesheetDelete: function(id){posts.push({kind:'archive', id:id});},
  logActivity: function(){},
  closeModal: function(){},
  formatWeekLabel: function(v){return v;},
  timesheetRecordDeleted: function(r){return !!(r && (r.deletedAt || r.deleted_at));},
  tsDesk: 'active'
};
vm.createContext(box);
vm.runInContext([
  extractFn(html, 'function quickDelete(id)'),
  extractFn(html, 'function deleteRec()'),
  extractFn(html, 'function trashTimesheet()'),
  extractFn(html, 'function restoreCurrentTimesheet()'),
  extractFn(html, 'function timesheetRowDeskButton(r)'),
  extractFn(html, 'function syncTimesheetDetailActions(r)')
].join('\n'), box);
box.quickDelete('ts-9');
assert.strictEqual(confirms[0].title, 'Delete this timesheet?');
assert.strictEqual(confirms[0].label, 'Delete');
confirms[0].fn();
assert.deepStrictEqual(posts[0], {kind:'trash', id:'ts-9'});
box.deleteRec();
assert.strictEqual(confirms[1].title, 'Delete this timesheet?');
assert.strictEqual(confirms[1].label, 'Delete');
box.currentRec = {id:'ts-1', empName:'Andre', clientName:'Helen', weekStart:'2026-09-21', deleted_at:null, deletedAt:''};
box.trashTimesheet();
assert.strictEqual(confirms[2].title, 'Delete this timesheet?');
assert.strictEqual(confirms[2].label, 'Delete');
confirms[1].fn();
assert.deepStrictEqual(posts[0] && posts[posts.length-1], {kind:'trash', id:'ts-1'});
const activeRow = box.timesheetRowDeskButton({id:'ts-2', isActive:true});
assert.ok(activeRow.includes('quickDelete') && activeRow.includes('aria-label="Delete"') && !activeRow.includes('restoreArchivedTimesheet'));
box.tsDesk = 'deleted';
const deletedRow = box.timesheetRowDeskButton({id:'ts-3', deleted_at:'2026-09-28T00:00:00Z'});
assert.ok(deletedRow.includes('restoreTrashedTimesheet') && !deletedRow.includes('restoreArchivedTimesheet'));
box.tsDesk = 'active';
const ghost = box.timesheetRowDeskButton({id:'ts-4', isActive:false, deleted_at:null});
assert.ok(ghost.includes('quickDelete') && !ghost.includes('restoreArchivedTimesheet'), 'archived-only row is Delete, not Archive Restore');

const shown = {};
box.document = {getElementById: function(id){return {hidden:false, setAttribute:function(){shown[id]=false;}, removeAttribute:function(){shown[id]=true;}};}};
box.closeTimesheetMore = function(){};
box.syncTimesheetDetailActions({deleted_at:null, isActive:false});
assert.strictEqual(shown.tsDetailRestoreBtn, false, 'archived-only detail has no Restore');
assert.strictEqual(shown.tsDetailArchiveBtn, true, 'archived-only detail still offers Delete');
box.syncTimesheetDetailActions({deleted_at:'2026-09-28T00:00:00Z'});
assert.strictEqual(shown.tsDetailRestoreBtn, true, 'trashed detail restores');
assert.strictEqual(shown.tsDetailArchiveBtn, false);
box.currentRec = {id:'ts-3', deleted_at:'2026-09-28T00:00:00Z'};
box.restoreCurrentTimesheet();
assert.deepStrictEqual(posts[posts.length-1], {kind:'restore', id:'ts-3'});
assert.ok(!posts.some(function(p){return p.kind==='archive'||p.kind==='archive-restore';}), 'no archive path from these controls');

console.log('timesheet-archive-kill1-test: ok');
