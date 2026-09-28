#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=cover-desk1'), 'cover-desk1 marker');
assert.ok(html.includes('?v=cover-desk1'), 'query marker');
assert.ok(html.includes('data-cover-desk1="v=cover-desk1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-28-cover-desk1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-cover-desk1">'), 'meta');
assert.ok(html.includes('GHOST-COVER-DESK1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes("var COVER_DESK1_MARKER='v=cover-desk1'"), 'script marker');
assert.ok(html.includes("var COVER_DESK1_BUILD='2026-09-28-cover-desk1'"), 'script build');
assert.ok(html.includes('NO PTO'), 'no pto note');
assert.ok(!html.includes('admin_rank_cover_desk'), 'no invented rank RPC');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-28-punch-leftovers1"') < html.indexOf('content="2026-09-28-cover-desk1"'), 'cover meta follows punch-leftovers1');
['v=punch-leftovers1','v=coverage-simple1','v=cover-card-cancel1','v=remi-float-hide1b','v=list-az1','v=tabbar-8','v=cover-unselect1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('>Cover<'), 'desk title is Cover');
assert.ok(desk.includes('id="coverList"'), 'open shift list stays');
assert.ok(desk.includes('data-cover-filter="hot"'), 'hot filter');
assert.ok(desk.includes('id="coverSmartView"'), 'smart assign sheet');
assert.ok(desk.includes('NO PTO'), 'desk states no pto');
assert.ok(!/Request PTO|PTO balance|pto_request/i.test(desk), 'no pto product on the desk');
assert.ok(html.includes("coverage:{label:'Cover'"), 'edit tabs label is Cover');
assert.ok(extractFn(html, 'function navEditDefaults()').includes('coverage'), 'Cover is in the default bar');
assert.ok(html.includes("list:['admin_list_open_shifts']"), 'list callable stays');
assert.ok(html.includes("rank:['admin_rank_backup_aides']"), 'rank callable stays');
assert.ok(html.includes("outcome:['admin_cover_outcome']"), 'outcome callable stays');
assert.ok(html.includes('client_refused_resume_next_day'), 'refused outcome stays on the desk');
assert.ok(html.includes("coverApplyOutcome('awaiting_client')"), 'wait posts awaiting_client');
assert.ok(html.includes("prefsGet:['admin_get_client_cover_prefs']"), 'get prefs callable');
assert.ok(html.includes("prefsSet:['admin_set_client_cover_prefs']"), 'set prefs callable');
assert.ok(html.includes('id="clientCoverNoBackup"'), 'client edit no-backup');
assert.ok(html.includes('id="clientCoverPreferWait"'), 'client edit prefer-wait');
const mapFn = extractFn(html, 'function coverMapShift(row)');
assert.ok(mapFn.includes('cover_no_backup') && mapFn.includes('cover_prefer_wait'), 'list flags map onto the shift');
assert.ok(!mapFn.includes('prefer_to_wait') && !mapFn.includes('client_no_backup'), 'no invented preference columns');
assert.ok(!extractFn(html, 'function coverMapRank(row)').includes('worked_this_client'), 'rank count is continuity_score');
const hardFn = extractFn(html, 'function coverDesk1HardBlocked(shift)');
assert.ok(hardFn.includes('coverDesk1NoBackup'), 'no backup is the hard gate');
assert.ok(extractFn(html, 'function coverOutcomeBody(openShiftId, outcome, backupAideId, notes').includes('p_manager_override'), 'outcome sends manager override');
assert.ok(extractFn(html, 'function coverDesk1Hot(shift)').includes('urgencyWithin48h'), 'hot badge is the 48h flag');
assert.ok(extractFn(html, 'async function coverDesk1Open(id)').includes("coverRpc('rank'"), 'smart assign uses backup rank');
assert.ok(!extractFn(html, 'async function coverDesk1Open(id)').includes('float_pool'), 'smart assign is not the float pool');

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

const ctx = {coverDesk1Filter:'all', coverDesk1Override:{}, coverDesk1Soft:{}, coverRanks:[]};
vm.createContext(ctx);
[
  'function coverDesk1NyParts(ms)',
  'function coverDesk1Ymd(iso)',
  'function coverDesk1Hot(shift)',
  'function coverDesk1Day(shift, nowMs)',
  'function coverDesk1Urgency(shift, nowMs)',
  'function coverDesk1Status(shift)',
  'function coverDesk1Bool(v)',
  'function coverDesk1NoBackup(shift)',
  'function coverDesk1PreferFlag(shift)',
  'function coverDesk1HardBlocked(shift)',
  'function coverDesk1SoftBlocked(shift)',
  'function coverDesk1Visits(row)',
  'function coverDesk1Miles(row)',
  'function coverDesk1MilesText(n)',
  'function coverDesk1SmartSort(rows)',
  'function coverPick(src)',
  'function coverNameOf(v)',
  'function coverIdOf(v)',
  'function coverPickPhone(obj)',
  'function coverIntakeSource(src)',
  'function coverMapShift(row)',
  'function coverMapRank(row)',
  'function coverOutcomeBody(openShiftId, outcome, backupAideId, notes)',
  'function coverDesk1PrefsSetBody(clientId, noBackup, preferWait)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

const now = Date.parse('2026-09-28T19:02:00Z');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({startsAt:"2026-09-28T14:00:00Z", endsAt:"2026-09-28T19:00:00Z", urgencyWithin48h:true}, '+now+')', ctx), 'hot', 'urgency_within_48h is the hot badge');
assert.strictEqual(vm.runInContext('coverDesk1Day({startsAt:"2026-09-28T14:00:00Z"}, '+now+')', ctx), 'today', 'hot shift is still today on the calendar');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({startsAt:"2026-09-28T20:00:00Z", endsAt:"2026-09-29T00:00:00Z"}, '+now+')', ctx), 'today', 'later today without the 48h flag stays today');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({startsAt:"2026-09-29T13:00:00Z", endsAt:"2026-09-29T18:00:00Z"}, '+now+')', ctx), 'tmrw', 'next day is tomorrow');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({urgencyWithin48h:true, startsAt:"2026-09-29T13:00:00Z"}, '+now+')', ctx), 'hot', 'a tomorrow shift inside 48h wears the hot badge');
assert.strictEqual(vm.runInContext('coverDesk1Day({startsAt:"2026-09-29T13:00:00Z"}, '+now+')', ctx), 'tmrw', 'the 48h flag does not change the calendar day');

const sorted = JSON.parse(JSON.stringify(vm.runInContext('coverDesk1SmartSort([{id:"moe", name:"moe", distance:0.9, continuity:0, rank:4},{id:"devon", name:"Devon Park", distance:1.8, continuity:12, rank:2},{id:"jamal", name:"Jamal Wright", distance:2.4, continuity:4, rank:3},{id:"aisha", name:"Aisha Khan", distance:3.1, continuity:1, rank:1}]).map(function(r){return r.id;})', ctx)));
assert.deepStrictEqual(sorted, ['devon','jamal','aisha','moe'], 'continuity outranks a closer stranger');

const flagged = vm.runInContext('coverMapShift({id:"h1", client_name:"Helen Park", regular_aide_name:"Sara Nguyen", cover_no_backup:true, cover_prefer_wait:true, prefer_wait:true, status:"open", shift_start:"2026-09-29T13:00:00Z"})', ctx);
assert.strictEqual(flagged.coverNoBackup, true, 'cover_no_backup paints');
assert.strictEqual(flagged.coverPreferWait, true, 'cover_prefer_wait paints');
assert.strictEqual(vm.runInContext('coverDesk1HardBlocked('+JSON.stringify(flagged)+')', ctx), true, 'no backup blocks assign');
assert.strictEqual(vm.runInContext('coverDesk1SoftBlocked('+JSON.stringify(flagged)+')', ctx), false, 'no backup owns the gate when both flags are set');
const invented = vm.runInContext('coverMapShift({id:"old", client_name:"Helen Park", prefer_wait:true, no_backup:true, status:"awaiting_client", shift_start:"2026-09-29T13:00:00Z"})', ctx);
assert.strictEqual(invented.coverNoBackup, false, 'old prefer_wait column is ignored');
assert.strictEqual(invented.coverPreferWait, false, 'old no_backup column is ignored');
assert.strictEqual(vm.runInContext('coverDesk1HardBlocked('+JSON.stringify(invented)+')', ctx), false, 'awaiting_client alone is not the hard gate');
const soft = vm.runInContext('coverMapShift({id:"s1", client_name:"Ada Cole", cover_prefer_wait:true, status:"open", shift_start:"2026-09-28T14:00:00Z"})', ctx);
assert.strictEqual(vm.runInContext('coverDesk1SoftBlocked('+JSON.stringify(soft)+')', ctx), true, 'prefer wait is a soft gate');
assert.strictEqual(vm.runInContext('coverDesk1HardBlocked('+JSON.stringify(soft)+')', ctx), false);
ctx.coverDesk1Soft.s1 = true;
assert.strictEqual(vm.runInContext('coverDesk1SoftBlocked('+JSON.stringify(soft)+')', ctx), false, 'soft confirm unlocks prefer wait');
ctx.coverDesk1Override.h1 = true;
assert.strictEqual(vm.runInContext('coverDesk1HardBlocked('+JSON.stringify(flagged)+')', ctx), false, 'manager override unlocks no backup');
const overridden = vm.runInContext('coverOutcomeBody("os1","assigned_backup","b1","", true)', ctx);
assert.strictEqual(overridden.p_manager_override, true);
const plainOutcome = vm.runInContext('coverOutcomeBody("os1","assigned_backup","b1","")', ctx);
assert.strictEqual(plainOutcome.p_manager_override, undefined, 'override defaults off');
const setBody = vm.runInContext('coverDesk1PrefsSetBody("c1", null, true)', ctx);
assert.strictEqual(setBody.p_cover_no_backup, undefined, 'null leaves no-backup unchanged');
assert.strictEqual(setBody.p_cover_prefer_wait, true);

const ranked = vm.runInContext('coverMapRank({aide_id:"a1", name:"Devon", continuity_score:12, distance_miles:1.8, worked_this_client:4, score:9, rank:1})', ctx);
assert.strictEqual(ranked.continuity, 12, 'continuity_score is the times-worked count');
assert.strictEqual(vm.runInContext('coverDesk1Visits('+JSON.stringify(ranked)+')', ctx), 12, 'why-line uses continuity_score');
assert.strictEqual(ranked.score, 9);
assert.strictEqual(ranked.id, 'a1');

console.log('admin-cover-desk1 unit ok');
