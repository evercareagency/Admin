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
assert.ok(html.includes('client_refused_resume_next_day'), 'prefer-wait reuses refuse outcome');

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

const ctx = {coverDesk1Filter:'all', coverDesk1Override:{}, coverRanks:[]};
vm.createContext(ctx);
[
  'function coverDesk1NyParts(ms)',
  'function coverDesk1Ymd(iso)',
  'function coverDesk1Urgency(shift, nowMs)',
  'function coverDesk1FlagOn(v)',
  'function coverDesk1PrefersWait(shift)',
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
  'function coverMapRank(row)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

const now = Date.parse('2026-09-28T19:02:00Z');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({startsAt:"2026-09-28T14:00:00Z", endsAt:"2026-09-28T19:00:00Z"}, '+now+')', ctx), 'hot', 'in-progress today is hot');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({startsAt:"2026-09-28T20:00:00Z", endsAt:"2026-09-29T00:00:00Z"}, '+now+')', ctx), 'today', 'later today stays today');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({startsAt:"2026-09-29T13:00:00Z", endsAt:"2026-09-29T18:00:00Z"}, '+now+')', ctx), 'tmrw', 'next day is tomorrow');
assert.strictEqual(vm.runInContext('coverDesk1Urgency({urgencyLabel:"hot", startsAt:"2026-10-01T13:00:00Z", endsAt:"2026-10-01T18:00:00Z"}, '+now+')', ctx), 'hot', 'explicit hot wins');

const sorted = JSON.parse(JSON.stringify(vm.runInContext('coverDesk1SmartSort([{id:"moe", name:"moe", distance:0.9, continuity:0, rank:4},{id:"devon", name:"Devon Park", distance:1.8, continuity:12, rank:2},{id:"jamal", name:"Jamal Wright", distance:2.4, continuity:4, rank:3},{id:"aisha", name:"Aisha Khan", distance:3.1, continuity:1, rank:1}]).map(function(r){return r.id;})', ctx)));
assert.deepStrictEqual(sorted, ['devon','jamal','aisha','moe'], 'continuity outranks a closer stranger');

const pref = vm.runInContext('coverMapShift({id:"h1", client_name:"Helen Park", regular_aide_name:"Sara Nguyen", prefer_wait:true, no_backup:true, shift_start:"2026-09-29T13:00:00Z"})', ctx);
assert.strictEqual(pref.preferWait, true);
assert.strictEqual(pref.noBackup, true);
assert.strictEqual(vm.runInContext('coverDesk1PrefersWait('+JSON.stringify(pref)+')', ctx), true);
const plain = vm.runInContext('coverMapShift({id:"r1", client_name:"Rivera", shift_start:"2026-09-29T17:00:00Z"})', ctx);
assert.strictEqual(plain.preferWait, false, 'missing flags do not invent prefer-wait');
assert.strictEqual(plain.noBackup, false);

const ranked = vm.runInContext('coverMapRank({aide_id:"a1", name:"Devon", continuity_score:4, distance_miles:1.8, worked_this_client:12, score:9, rank:1})', ctx);
assert.strictEqual(ranked.visits, 12, 'explicit continuity count wins');
assert.strictEqual(ranked.continuity, 4, 'ace score field stays stored');
assert.strictEqual(ranked.score, 9);

console.log('admin-cover-desk1 unit ok');
