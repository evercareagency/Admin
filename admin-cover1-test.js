#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=cover1'), 'cover1 marker');
assert.ok(html.includes('admin-build 2026-09-25-cover1'), 'cover1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-cover1">'), 'cover1 meta');
assert.ok(html.indexOf('content="2026-09-25-cover1"') < html.indexOf('content="2026-09-25-aidadel1"'), 'cover1 is the current build meta');
assert.ok(html.includes('v=aidadel1'), 'aidadel1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidadel1">'), 'aidadel1 meta stays');
assert.ok(html.includes('v=navedit1'), 'navedit1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-navedit1">'), 'navedit1 meta stays');
assert.ok(html.includes('v=nursecomp57'), 'nursecomp57 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-nursecomp57">'), 'nursecomp57 meta stays');
assert.ok(html.includes('v=layoutA1'), 'layoutA1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-layoutA1">'), 'layoutA1 meta stays');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('GHOST-COVER1-CONTRACT-v1'), 'cover contract note');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'bottom bar stays five tabs');
assert.ok(!nav.includes('nav_coverage'), 'Coverage is not a bottom tab');
assert.ok(nav.includes('id="nav_backups"'), 'Backup tab stays');

const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_coverage"'), 'Coverage row is in the More list');
assert.ok(more.includes("showTab('coverage')"), 'Coverage opens with showTab');
assert.ok(more.includes('data-layout-roles="Admin Scheduler"'), 'Coverage uses the ops role gate');
assert.ok(more.indexOf('id="nav_coverage"') < more.indexOf('id="nav_clients"'), 'Coverage is the first More row');

const bak = admin.slice(admin.indexOf('id="tab_backups"'), admin.indexOf('id="tab_aides"'));
assert.ok(bak.includes('Phone-change draft'), 'Backup stays phone-change drafts');
assert.ok(bak.includes('>Open drafts<') || html.includes('>Open drafts<'), 'Open drafts stays');
assert.ok(!/Approve/i.test(bak), 'Backup has no Approve');
assert.ok(!/Decline/i.test(bak), 'Backup has no Decline');
assert.ok(!/Coverage/i.test(bak), 'Coverage desk is not on Backup');
assert.ok(!/PTO/i.test(bak), 'Backup has no PTO');
assert.ok(!bak.includes('tab_coverage'), 'coverage panel is not inside Backup');

const desk = admin.slice(admin.indexOf('id="tab_coverage"'), admin.indexOf('id="tab_backups"'));
assert.ok(desk.includes('id="coverList"'), 'open shifts list');
assert.ok(html.includes('class="cover-chip">Within 48h</span>'), 'urgency chip copy');
assert.ok(desk.includes('id="coverIntakeView"'), 'intake view');
assert.ok(desk.includes('Record call-off'), 'intake action');
assert.ok(desk.includes('id="coverRankPanel"'), 'smart assign panel');
assert.ok(desk.includes('Ranked backups from the office.'), 'rank panel is the live office list');
assert.ok(!desk.includes('No stand-in ranks') && !html.includes('No stand-in ranks'), 'rank panel is not a stub');
assert.ok(desk.includes('>Text client<') && desk.includes('>Call client<'), 'text or call the client first');
assert.ok(desk.includes('Client refused / resume next day'), 'refused outcome');
assert.ok(desk.includes('>Assign backup<') && desk.includes('>Confirm assign<'), 'assign only after confirm');
assert.ok(desk.includes('>Awaiting client<') && desk.includes('>Cancel shift<') && desk.includes('>Reopen<'), 'awaiting, cancel, and reopen outcomes');
assert.ok(!/Request PTO|PTO balance|pto_request/i.test(desk), 'coverage is not a PTO product');

assert.ok(!html.includes("navEditCatalog") || !extractFn(html, 'function navEditCatalog()').includes('coverage'), 'Coverage is not a bottom-tab choice');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-cover1">'), 'cover1 build meta stays');
assert.ok(html.includes("sbRestRpc('admin_record_call_off'") || html.includes("record:['admin_record_call_off']"), 'record callable name');
assert.ok(html.includes("list:['admin_list_open_shifts']"), 'list callable name');
assert.ok(html.includes("rank:['admin_rank_backup_aides']"), 'rank callable name');
assert.ok(html.includes("outcome:['admin_cover_outcome']"), 'outcome callable name');
assert.ok(!html.includes('record_coverage_call_off') && !html.includes('p_starts_at') && !html.includes("p_shift_id:"), 'old guessed names are not the contract');
assert.ok(html.includes('p_shift_start') && html.includes('p_shift_end') && html.includes('p_reason'), 'record args');
assert.ok(html.includes('p_include_resolved') && html.includes('p_open_shift_id') && html.includes('p_backup_aide_id') && html.includes('p_notes'), 'list rank outcome args');
assert.ok(html.includes('awaiting_client') && html.includes('cancelled') && html.includes('reopen'), 'returned statuses are tolerated');
assert.ok(html.includes('schedule_exceptions') && html.includes('does not also post upsert_schedule_exception'), 'Ace owns the schedule exception sync');
assert.ok(desk.includes('id="coverEndTime"'), 'intake collects shift end');
assert.ok(html.includes('client_refused_resume_next_day') && html.includes('assigned_backup'), 'outcome values');
const loadRanks = extractFn(html, 'async function coverLoadRanks(shift)');
assert.ok(loadRanks.includes('coverRankRows') && loadRanks.includes('coverPaintRanks'), 'rank panel paints the aides Ace returns');
assert.ok(!/not live|stand-in|stub/i.test(loadRanks), 'rank loader is not a stub');
const rankSrc = [
  extractFn(html, 'function coverMapRank(row)'),
  extractFn(html, 'function coverRankRows(data)'),
  extractFn(html, 'function coverPaintRanks(rows)')
].join('\n');
assert.ok(!/continuity\s*\*\s*10|40\s*-/.test(rankSrc), 'desk does not recompute Ace score');
assert.ok(!/distance_miles\s*:\s*['"]?\d/.test(rankSrc), 'rank mapper does not invent miles');
assert.ok(html.includes('p_limit'), 'rank limit arg');

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

const ctx = {};
vm.createContext(ctx);
[
  'function coverWithin48h(startsAt, nowMs)',
  'function coverStatusKey(shift)',
  'function coverShiftUrgent(shift, nowMs)',
  'function coverPick(src)',
  'function coverNameOf(v)',
  'function coverIdOf(v)',
  'function coverIntakeSource(src)',
  'function coverMapShift(row)',
  'function coverCanAssign(shift)',
  'function coverMapRank(row)',
  'function coverRankRows(data)',
  'function coverIsOpen(shift)',
  'function coverCoerceNode(data)',
  'function coverShiftRows(data)',
  'function coverRecordBody(clientId, aideId, shiftStart, shiftEnd, reason)',
  'function coverListBody()',
  'function coverRankArgs(openShiftId)',
  'function coverOutcomeBody(openShiftId, outcome, backupAideId, notes)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

const now = Date.parse('2026-09-25T12:00:00Z');
assert.strictEqual(vm.runInContext('coverWithin48h("2026-09-26T12:00:00Z", ' + now + ')', ctx), true, 'tomorrow is within 48h');
assert.strictEqual(vm.runInContext('coverWithin48h("2026-09-28T12:00:00Z", ' + now + ')', ctx), false, 'three days out is not within 48h');
assert.strictEqual(vm.runInContext('coverWithin48h("", ' + now + ')', ctx), false, 'blank when is not urgent');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"open", startsAt:"2026-09-26T08:00:00Z", endsAt:"2026-09-26T16:00:00Z"}, ' + now + ')', ctx), true, 'open shift inside the window');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"awaiting_client", startsAt:"2026-09-26T08:00:00Z", endsAt:"2026-09-26T16:00:00Z"}, ' + now + ')', ctx), true, 'awaiting client inside the window');
assert.strictEqual(vm.runInContext('coverShiftUrgent({startsAt:"2026-09-26T08:00:00Z"}, ' + now + ')', ctx), false, 'start without end is not the chip rule');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"open", urgencyWithin48h:true, startsAt:"2026-10-01T00:00:00Z", endsAt:"2026-10-01T08:00:00Z"}, ' + now + ')', ctx), false, 'timestamps beat the urgency flag');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"open", startsAt:"2026-09-25T08:00:00Z", endsAt:"2026-09-25T10:00:00Z"}, ' + now + ')', ctx), false, 'ended shift is not within 48h');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"open", startsAt:"2026-09-28T12:00:00Z", endsAt:"2026-09-28T16:00:00Z"}, ' + now + ')', ctx), false, 'start past 48h is not the chip');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"assigned_backup", startsAt:"2026-09-26T08:00:00Z", endsAt:"2026-09-26T16:00:00Z"}, ' + now + ')', ctx), false, 'assigned is not a chip status');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"cancelled", urgency_within_48h:true}, ' + now + ')', ctx), false, 'cancelled is not a chip status');
assert.strictEqual(vm.runInContext('coverShiftUrgent({status:"open", urgency_within_48h:true}, ' + now + ')', ctx), true, 'flag is the fallback when a timestamp is missing');

const mapped = vm.runInContext('coverMapShift({id:"s1", client_name:"Ada", regular_aide_name:"Bea", starts_at:"2026-09-26T12:00:00Z", status:"open"})', ctx);
assert.strictEqual(mapped.clientName, 'Ada');
assert.strictEqual(mapped.aideName, 'Bea');
assert.strictEqual(mapped.startsAt, '2026-09-26T12:00:00Z');
assert.strictEqual(mapped.id, 's1');

const ranked = vm.runInContext('coverMapRank({aide_id:"a1", username:"cam", name:"Cam Diaz", continuity_score:4, distance_miles:1.2, score:78.8, rank:1})', ctx);
assert.strictEqual(ranked.id, 'a1');
assert.strictEqual(ranked.username, 'cam');
assert.strictEqual(ranked.name, 'Cam Diaz');
assert.strictEqual(ranked.distance, 1.2);
assert.strictEqual(ranked.continuity, 4);
assert.strictEqual(ranked.score, 78.8, 'score is stored, not recomputed');
assert.strictEqual(ranked.rank, 1);
assert.strictEqual(vm.runInContext('coverMapRank({distance_miles:9, score:31})', ctx), null, 'a distance without an aide is not a rank');
assert.strictEqual(vm.runInContext('coverMapRank({aide_name:"Cam", distance_miles:1.2, continuity:"4 visits"})', ctx), null, 'old field names are not the contract');
assert.strictEqual(vm.runInContext('coverMapRank({aide_id:"a2", name:"Dee", distance_miles:null, score:10, rank:2}).distance', ctx), null, 'null miles stay empty');
assert.strictEqual(vm.runInContext('coverRankRows({success:false, aides:[{aide_id:"a", name:"Nope"}]}).length', ctx), 0, 'failed rank payload is not shown');
assert.strictEqual(vm.runInContext('coverRankRows({ranks:[{aide_id:"a", name:"Dee"}]}).length', ctx), 0, 'ranks key is not the contract');
const rankOrder = vm.runInContext('coverRankRows({success:true, aides:[{aide_id:"b", name:"Dee Lang", username:"dee", continuity_score:1, distance_miles:null, score:10, rank:2},{aide_id:"a", name:"Cam Diaz", username:"cam", continuity_score:4, distance_miles:1.2, score:11, rank:1}]})', ctx);
assert.strictEqual(rankOrder[0].name, 'Cam Diaz');
assert.strictEqual(rankOrder[0].score, 11, 'a mismatched formula score is still shown as Ace sent it');
assert.strictEqual(rankOrder[1].distance, null);
assert.strictEqual(vm.runInContext('coverCanAssign({status:"open"})', ctx), true);
assert.strictEqual(vm.runInContext('coverCanAssign({status:"awaiting_client"})', ctx), true);
assert.strictEqual(vm.runInContext('coverCanAssign({status:"call_off"})', ctx), false, 'assign only from open or awaiting client');
assert.strictEqual(vm.runInContext('coverCanAssign({status:"cancelled"})', ctx), false);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"assigned"})', ctx), false);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"assigned_backup"})', ctx), false);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"client_refused_resume_next_day"})', ctx), false);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"cancelled"})', ctx), false);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"open"})', ctx), true);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"awaiting_client"})', ctx), true);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"reopen"})', ctx), true);
assert.strictEqual(vm.runInContext('coverShiftRows({shifts:[{id:"s2", client_name:"Ada"}]}).length', ctx), 1);

const locked = vm.runInContext('coverMapShift({open_shift_id:"os1", client_name:"Ada", regular_aide_name:"Bea", shift_start:"2026-09-26T12:00:00Z", shift_end:"2026-09-26T16:00:00Z", status:"awaiting_client"})', ctx);
assert.strictEqual(locked.id, 'os1');
assert.strictEqual(locked.startsAt, '2026-09-26T12:00:00Z');
assert.strictEqual(locked.endsAt, '2026-09-26T16:00:00Z');
assert.strictEqual(locked.status, 'awaiting_client');
assert.strictEqual(locked.statusExplicit, true);

const nested = vm.runInContext('coverMapShift({open_shift_id:"os9", client:{client_id:"c9", name:"Ada Cole"}, regular_aide:{aide_id:"a9", username:"bea", name:"Bea Ortiz"}, shift_start:"2026-09-26T12:00:00Z", shift_end:"2026-09-26T16:00:00Z", status:"open", urgency_within_48h:true, schedule_exception_id:"ex9", sms_stub:"not_sent_v1"})', ctx);
assert.strictEqual(nested.clientName, 'Ada Cole');
assert.strictEqual(nested.clientId, 'c9');
assert.strictEqual(nested.aideName, 'Bea Ortiz');
assert.strictEqual(nested.aideId, 'a9');
assert.strictEqual(nested.urgencyWithin48h, true);
assert.strictEqual(nested.scheduleExceptionId, 'ex9');
assert.strictEqual(nested.smsStub, 'not_sent_v1');

const recordBody = vm.runInContext('coverRecordBody("c1","a1","2026-09-26T12:00:00Z","2026-09-26T16:00:00Z","sick")', ctx);
assert.deepStrictEqual(Object.keys(recordBody), ['p_client_id','p_regular_aide_id','p_shift_start','p_shift_end','p_reason']);
assert.strictEqual(recordBody.p_reason, 'sick');
assert.strictEqual(JSON.stringify(vm.runInContext('coverListBody()', ctx)), JSON.stringify({p_include_resolved:false}));
assert.strictEqual(JSON.stringify(vm.runInContext('coverRankArgs("os1")', ctx)), JSON.stringify({p_open_shift_id:'os1', p_limit:20}));
const outcomeBody = vm.runInContext('coverOutcomeBody("os1","assigned_backup","b1","desk note")', ctx);
assert.strictEqual(outcomeBody.p_open_shift_id, 'os1');
assert.strictEqual(outcomeBody.p_outcome, 'assigned_backup');
assert.strictEqual(outcomeBody.p_backup_aide_id, 'b1');
assert.strictEqual(outcomeBody.p_notes, 'desk note');
const refuseBody = vm.runInContext('coverOutcomeBody("os1","client_refused_resume_next_day", null, "")', ctx);
assert.strictEqual(refuseBody.p_backup_aide_id, undefined);
assert.strictEqual(refuseBody.p_notes, undefined);

console.log('admin-cover1-test: ok');
