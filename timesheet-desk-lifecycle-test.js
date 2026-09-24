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

assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-sched1m">'), 'admin-build');
assert.ok(html.includes('v=warmoff1'), 'warmoff1 marker stays');
assert.ok(html.includes('v=pdf1p'), 'pdf1p marker');
assert.ok(html.includes('v=sbcut1b'), 'archive hotfix marker stays');
assert.ok(html.includes('const TS_PDF_PAGE_FIT=0.96'), 'letter fit shrinks the overlay inside the page');
assert.ok(html.includes('height:10.56in !important'), 'print sheet is under one Letter page');
assert.ok(html.includes('@page{size:letter;margin:0;}'), 'letter page margin is zero');
const renderDoc = extractFn(html, 'async function renderTimesheetPdfDoc(r)');
assert.ok(renderDoc.includes("jsPDF('p','pt','letter',true)"), 'letter pdf');
assert.ok(renderDoc.includes('TS_PDF_PAGE_FIT'), 'draw size uses the fit');
assert.ok(!renderDoc.includes('addPage'), 'renderer does not add a second page');
assert.ok(html.includes('id="tsDetailPdfBtn"'), 'one primary PDF button');
assert.ok(html.includes('>📄 PDF</button>'), 'PDF label is the merged action');
assert.ok(!html.includes('Save as PDF File'), 'Save as PDF File is not a separate primary button');
assert.ok(!html.includes('>🖨️ Print timesheet</button>'), 'Print is not a primary button');
assert.ok(html.includes('id="tsDetailMorePrint"'), 'Print stays under More');
assert.ok(html.includes('id="tsDetailMoreSig"') && html.includes('Collect Signature'), 'Collect Signature under More');
assert.ok(html.includes('id="tsDetailMoreSave"') && html.includes('Save Edits'), 'Save Edits under More');
assert.ok(html.includes('id="tsDetailMoreDelete"') && html.includes('Delete…'), 'Delete is under More');
assert.ok(html.includes('id="tsDetailArchiveBtn"') && html.includes('🗄️ Archive'), 'Archive uses a box icon');
assert.ok(!/id="tsDetailArchiveBtn"[^>]*mbtn-danger/.test(html), 'Archive is not a trash button');
assert.ok(html.includes('data-ts-desk="active"') && html.includes('data-ts-desk="archived"') && html.includes('data-ts-desk="deleted"'), 'Active, Archived, Recently deleted desks');
assert.ok(html.includes("showSharedConfirm('Archive this timesheet?'"), 'archive confirm copy');
assert.ok(html.includes("showSharedConfirm('Move to Recently deleted? You can restore for 7 days.'"), 'delete confirm copy');

const archive = extractFn(html, 'async function sbAdminSoftDeleteTimesheet(payload)');
assert.ok(archive.includes('sbRestPatchActive'), 'archive still uses the is_active patch');
assert.ok(!/deleted_at\s*:/.test(archive), 'archive body does not write deleted_at');
assert.ok(!/method:\s*'DELETE'/.test(archive), 'archive is not a hard delete');

const trash = extractFn(html, 'async function sbAdminTrashTimesheet(payload)');
assert.ok(trash.includes('is_active:false'), 'delete sets is_active false');
assert.ok(trash.includes('deleted_at:stamp'), 'delete sets deleted_at');
assert.ok(!/method:\s*'DELETE'/.test(trash), 'delete is not a hard delete');

const restoreArchived = extractFn(html, 'async function sbAdminRestoreTimesheet(payload)');
assert.ok(restoreArchived.includes('is_active:true'), 'restore archive sets is_active true');
assert.ok(restoreArchived.includes("'is.null'"), 'restore archive requires deleted_at null');
assert.ok(!restoreArchived.includes('deleted_at:null'), 'restore archive does not write deleted_at');

const restoreTrash = extractFn(html, 'async function sbAdminRestoreTrashedTimesheet(payload)');
assert.ok(restoreTrash.includes('is_active:true'), 'restore trash sets is_active true');
assert.ok(restoreTrash.includes('deleted_at:null'), 'restore trash clears deleted_at');

const desk = [
  extractFn(html, 'function sbTimesheetDesk(view)'),
  extractFn(html, 'function sbTimesheetListPairs(view)'),
  extractFn(html, 'function sbTimesheetOnDesk(row, view)')
].join('\n');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(desk, ctx);
const activePairs = vm.runInContext("sbTimesheetListPairs('active')", ctx);
const archivedPairs = vm.runInContext("sbTimesheetListPairs('archived')", ctx);
const deletedPairs = vm.runInContext("sbTimesheetListPairs({timesheetDesk:'deleted'})", ctx);
function pair(pairs, key){
  const hit = pairs.find(function(p){return p[0]===key;});
  return hit ? hit[1] : null;
}
assert.strictEqual(pair(activePairs, 'is_active'), 'eq.true');
assert.strictEqual(pair(activePairs, 'deleted_at'), 'is.null');
assert.strictEqual(pair(activePairs, 'order'), 'submitted_at.desc');
assert.strictEqual(pair(archivedPairs, 'is_active'), 'eq.false');
assert.strictEqual(pair(archivedPairs, 'deleted_at'), 'is.null');
assert.strictEqual(pair(deletedPairs, 'is_active'), 'eq.false');
assert.strictEqual(pair(deletedPairs, 'deleted_at'), 'not.is.null');
assert.strictEqual(pair(deletedPairs, 'order'), 'deleted_at.desc');
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:true,status:'submitted'}, 'active')", ctx), true);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:null,status:'submitted'}, 'archived')", ctx), true);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:'2026-09-24T00:00:00Z',status:'submitted'}, 'deleted')", ctx), true);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:'2026-09-24T00:00:00Z',status:'submitted'}, 'active')", ctx), false);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:false,deleted_at:null,status:'submitted'}, 'active')", ctx), false);
assert.strictEqual(vm.runInContext("sbTimesheetOnDesk({is_active:true,status:'backup'}, 'active')", ctx), false);

const pending = extractFn(html, 'function isPendingActionsHtml(i)');
const completed = extractFn(html, 'function isCompletedActionsHtml(i)');
assert.ok(pending.includes('Send Reminder'));
assert.ok(!pending.includes('View Cert') && !pending.includes('Print Cert'));
assert.ok(completed.includes('View Cert') && completed.includes('Print Cert'));
assert.ok(html.includes('Personal Care / Home Making'));
assert.ok(html.includes('background:#FDFBF0'));
assert.ok(!/Skilled Nursing/.test(html));

console.log('timesheet-desk-lifecycle-test: ok');
