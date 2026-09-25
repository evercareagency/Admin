#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=coveraide1b'), 'coveraide1b marker');
assert.ok(html.includes('admin-build 2026-09-25-coveraide1b'), 'coveraide1b build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-coveraide1b">'), 'coveraide1b meta');
assert.ok(html.indexOf('content="2026-09-25-coveraide1b"') < html.indexOf('content="2026-09-25-coveraide1"'), 'coveraide1b is the current build meta');
assert.ok(html.includes('v=coveraide1'), 'coveraide1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-coveraide1">'), 'coveraide1 meta stays');
assert.ok(html.includes('v=covercomms1'), 'covercomms1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-covercomms1">'), 'covercomms1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-coveraide1b"') < html.indexOf('content="2026-09-25-covercomms1"'), 'coveraide1b is ahead of covercomms1');
assert.ok(html.includes('v=cover1'), 'cover1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-cover1">'), 'cover1 meta stays');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'bottom bar stays five tabs');
assert.ok(!nav.includes('nav_coverage'), 'Coverage is not a bottom tab');
assert.ok(nav.includes('id="nav_backups"'), 'Backup tab stays');

const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_coverage"'), 'Coverage row stays in the More list');

const bak = admin.slice(admin.indexOf('id="tab_backups"'), admin.indexOf('id="tab_aides"'));
assert.ok(bak.includes('Phone-change draft'), 'Backup stays phone-change drafts');
assert.ok(!/Approve/i.test(bak), 'Backup has no Approve');
assert.ok(!/Decline/i.test(bak), 'Backup has no Decline');
assert.ok(!/Coverage/i.test(bak), 'Coverage desk is not on Backup');
assert.ok(!bak.includes('tab_coverage'), 'coverage panel is not inside Backup');

const desk = admin.slice(admin.indexOf('id="tab_coverage"'), admin.indexOf('id="tab_backups"'));
assert.ok(desk.includes('id="coverList"'), 'open shifts list stays');
assert.ok(desk.includes('Record call-off'), 'office intake stays');
assert.ok(html.includes("list:['admin_list_open_shifts']"), 'list callable stays');
assert.ok(html.includes("record:['admin_record_call_off']"), 'office record callable stays');
assert.ok(!html.includes('aide_record_call_off(') && !html.includes("sbRestRpc('aide_record_call_off'"), 'admin does not call the aide record RPC');

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
  throw new Error('unclosed ' + sig);
}

const ctx = {coverShifts:[], coverListGen:0};
vm.createContext(ctx);
[
  'function coverWithin48h(startsAt, nowMs)',
  'function coverStatusKey(shift)',
  'function coverShiftUrgent(shift, nowMs)',
  'function coverPick(src)',
  'function coverIntakeSource(src)',
  'function coverSourceLabel(key)',
  'function coverSourceChips(shift)',
  'function coverNameOf(v)',
  'function coverIdOf(v)',
  'function coverPickPhone(obj)',
  'function coverMapShift(row)',
  'function coverCoerceNode(data)',
  'function coverShiftRows(data)',
  'function coverEnvelopeId(data, depth)',
  'function coverSameClient(a, b)',
  'function coverSameWindow(a, b)',
  'function coverWindowConflicts(row, draft)',
  'function coverCopyBlanks(dest, src)',
  'function coverDraftShift(fields)',
  'function coverIsOpen(shift)',
  'function coverFind(id)',
  'function coverRecordedShift(payload, draft)',
  'function coverMergeRecorded(created)',
  'function coverListVisible(shift)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

const morning = {
  id:'os-am',
  clientId:'bowlax',
  clientName:'Bowlax',
  aideId:'moe',
  aideName:'moe',
  startsAt:'2026-09-27T12:00:00.000Z',
  endsAt:'2026-09-27T16:00:00.000Z',
  status:'open',
  intakeSource:'office',
  source:'ace',
  justRecorded:false
};
const afternoonDraft = {
  clientId:'bowlax',
  clientName:'Bowlax',
  aideId:'moe',
  aideName:'moe',
  startsAt:'2026-09-27T17:00:00.000Z',
  endsAt:'2026-09-27T18:00:00.000Z',
  phone:'2165550100',
  note:'sick'
};

ctx.coverShifts = [Object.assign({}, morning)];
const fromIdOnly = vm.runInContext('coverRecordedShift({success:true, open_shift_id:"os-pm", status:"open", urgency_within_48h:false, schedule_exception_id:"ex-pm"}, this.draft)', Object.assign(ctx, {draft:afternoonDraft}));
assert.strictEqual(fromIdOnly.id, 'os-pm');
assert.strictEqual(fromIdOnly.startsAt, afternoonDraft.startsAt, 'record payload without times keeps the hours just entered');
assert.strictEqual(fromIdOnly.clientName, 'Bowlax');
assert.strictEqual(fromIdOnly.intakeSource, 'office');
ctx.coverShifts = [Object.assign({}, morning)];
vm.runInContext('coverMergeRecorded(this.created)', Object.assign(ctx, {created:fromIdOnly}));
assert.strictEqual(ctx.coverShifts.length, 2, 'list that omits the insert still shows the new row');
assert.strictEqual(ctx.coverShifts[1].id, 'os-am');
assert.strictEqual(ctx.coverShifts[1].startsAt, morning.startsAt, 'same-day morning hours stay');
assert.strictEqual(ctx.coverShifts[0].id, 'os-pm');
assert.strictEqual(ctx.coverShifts[0].startsAt, afternoonDraft.startsAt);
assert.strictEqual(ctx.coverShifts[0].intakeSource, 'office');
assert.ok(vm.runInContext('coverListVisible(coverShifts[0])', ctx));
assert.ok(vm.runInContext('coverListVisible(coverShifts[1])', ctx));
assert.ok(vm.runInContext('coverSourceChips(coverShifts[0])', ctx).includes('>Office<'));
assert.ok(!vm.runInContext('coverShiftUrgent(coverShifts[0], ' + Date.parse('2026-09-25T14:00:00Z') + ')', ctx), 'Sep 27 13:00 ET is outside the 48h chip from Friday morning');
assert.ok(vm.runInContext('coverListVisible(coverShifts[0])', ctx), 'outside the 48h chip still stays on the open list');

ctx.coverShifts = [Object.assign({}, morning), {
  id:'os-pm',
  clientId:'bowlax',
  clientName:'Bowlax',
  aideName:'moe',
  startsAt:afternoonDraft.startsAt,
  endsAt:afternoonDraft.endsAt,
  status:'open',
  intakeSource:'office',
  source:'ace'
}];
vm.runInContext('coverMergeRecorded(this.created)', Object.assign(ctx, {created:fromIdOnly}));
assert.strictEqual(ctx.coverShifts.length, 2, 'a list that already has the new id does not duplicate it');

const nested = vm.runInContext('coverEnvelopeId({success:true, data:{open_shift_id:"os-nest"}})', ctx);
assert.strictEqual(nested, 'os-nest', 'nested open_shift_id is the created id');
const bare = vm.runInContext('coverEnvelopeId("6f1b1c2a-3d4e-4f5a-8b6c-7d8e9f0a1b2c")', ctx);
assert.strictEqual(bare, '6f1b1c2a-3d4e-4f5a-8b6c-7d8e9f0a1b2c');

ctx.coverShifts = [Object.assign({}, morning)];
const wrongFirst = vm.runInContext('coverRecordedShift({success:true, open_shift_id:"os-pm", shifts:[{open_shift_id:"os-am", client_name:"Bowlax", shift_start:"2026-09-27T12:00:00.000Z", shift_end:"2026-09-27T16:00:00.000Z", status:"open", source:"office"}]}, this.draft)', Object.assign(ctx, {draft:afternoonDraft}));
assert.strictEqual(wrongFirst.id, 'os-pm', 'the created id wins over an older shifts[0]');
assert.strictEqual(wrongFirst.startsAt, afternoonDraft.startsAt);
ctx.coverShifts = [Object.assign({}, morning)];
vm.runInContext('coverMergeRecorded(this.created)', Object.assign(ctx, {created:wrongFirst}));
assert.strictEqual(ctx.coverShifts.length, 2);
assert.strictEqual(ctx.coverShifts[1].startsAt, morning.startsAt);

ctx.coverShifts = [Object.assign({}, morning)];
const collided = vm.runInContext('coverRecordedShift({success:true, open_shift_id:"os-am", status:"open"}, this.draft)', Object.assign(ctx, {draft:afternoonDraft}));
assert.notStrictEqual(collided.id, 'os-am', 'a different window does not reuse the morning id');
ctx.coverShifts = [Object.assign({}, morning)];
vm.runInContext('coverMergeRecorded(this.created)', Object.assign(ctx, {created:collided}));
assert.strictEqual(ctx.coverShifts.length, 2, 'same client same day different hours are both open');
assert.strictEqual(ctx.coverShifts[1].id, 'os-am');
assert.strictEqual(ctx.coverShifts[1].startsAt, morning.startsAt);

const aideRow = {
  id:'os-aide',
  clientId:'bowlax',
  clientName:'Bowlax',
  aideName:'moe',
  startsAt:'2026-09-28T13:00:00.000Z',
  endsAt:'2026-09-28T14:00:00.000Z',
  status:'open',
  intakeSource:'aide',
  source:'ace'
};
ctx.coverShifts = [Object.assign({}, morning), Object.assign({}, aideRow)];
vm.runInContext('coverMergeRecorded(this.created)', Object.assign(ctx, {created:fromIdOnly}));
assert.strictEqual(ctx.coverShifts.find(function(s){return s.id==='os-aide';}).intakeSource, 'aide', 'an aide row on another window stays Aide');
assert.ok(vm.runInContext('coverSourceChips(coverShifts.find(function(s){return s.id==="os-aide";}))', ctx).includes('>Aide<'));

assert.strictEqual(vm.runInContext('coverListVisible({status:"resolved", justRecorded:true})', ctx), true, 'the row just recorded is not filtered off the open list');
assert.strictEqual(vm.runInContext('coverListVisible({status:"resolved"})', ctx), false, 'an older resolved row stays off the open list');
assert.strictEqual(vm.runInContext('coverListVisible({status:"open", startsAt:"2026-09-28T17:00:00.000Z", endsAt:"2026-09-28T18:00:00.000Z"})', ctx), true, 'a later open shift is not dropped for being outside 48h');
assert.strictEqual(vm.runInContext('coverShiftRows({success:false, shifts:[{open_shift_id:"x", client_name:"No"}]}).length', ctx), 0);
assert.strictEqual(vm.runInContext('coverShiftRows({success:true, call_offs:[{open_shift_id:"os1", client_name:"Ada", status:"open"}]}).length', ctx), 1, 'call_offs list key is read');
assert.strictEqual(vm.runInContext('coverShiftRows({shifts:[{id:"s2", client_name:"Ada"}]}).length', ctx), 1);

const record = extractFn(html, 'async function coverRecordCalloff()');
const reloadAt = record.indexOf('coverReload({keepOnFail:true})');
const toastAt = record.indexOf("showTempMsg('Call-off recorded. Shift is open.'");
const awaitAt = record.indexOf('await reloaded');
const mergeAt = record.indexOf('coverMergeRecorded(created)');
assert.ok(reloadAt > 0 && toastAt > reloadAt && awaitAt > toastAt && mergeAt > awaitAt, 'success refetches the list while toasting, then merges the created row');
assert.ok(record.includes("intakeSource:'office'") || record.includes("intakeSource='office'"), 'office record path stays Office');
const reloadFn = extractFn(html, 'async function coverReload(opts)');
assert.ok(reloadFn.includes('coverListGen'), 'a newer list fetch wins');
assert.ok(reloadFn.includes('gen!==coverListGen'), 'a stale list response does not paint');
assert.ok(reloadFn.includes('admin_list_open_shifts') || html.includes("list:['admin_list_open_shifts']"), 'reload uses the open-shift list');
const paint = extractFn(html, 'function coverPaintList()');
assert.ok(paint.includes('coverListVisible'), 'open list uses the visible-row rule');
assert.ok(paint.includes('coverSourceChips'), 'open list still paints the source chip');
assert.ok(!paint.includes('coverShiftUrgent') || paint.includes('coverSourceChips'), 'Within 48h is not the list filter');

console.log('admin-coveraide1b-test: ok');
