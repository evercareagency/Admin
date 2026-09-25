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
assert.ok(desk.includes('No stand-in ranks'), 'rank panel is an honest stub until Ace answers');
assert.ok(desk.includes('>Text client<') && desk.includes('>Call client<'), 'text or call the client first');
assert.ok(desk.includes('Client refused / resume next day'), 'refused outcome');
assert.ok(desk.includes('>Assign backup<') && desk.includes('>Confirm assign<'), 'assign only after confirm');
assert.ok(!/Request PTO|PTO balance|pto_request/i.test(desk), 'coverage is not a PTO product');

assert.ok(!html.includes("navEditCatalog") || !extractFn(html, 'function navEditCatalog()').includes('coverage'), 'Coverage is not a bottom-tab choice');
assert.ok(html.includes("sbRestRpc") && html.includes("'record_call_off'") && html.includes("'list_open_shifts'"), 'record and list RPC names');
assert.ok(html.includes("'rank_backup_aides'") && html.includes("'cover_outcome'"), 'rank and outcome RPC names');
assert.ok(html.includes('client_refused_resume_next_day') && html.includes('assigned_backup'), 'outcome values');
assert.ok(!/distance_miles\s*:\s*['"]?\d/.test(html.slice(html.indexOf('function coverMapRank'), html.indexOf('function coverRankRows'))), 'rank mapper does not invent miles');

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
  'function coverShiftUrgent(shift, nowMs)',
  'function coverPick(src)',
  'function coverMapShift(row)',
  'function coverMapRank(row)',
  'function coverRankRows(data)',
  'function coverIsOpen(shift)',
  'function coverShiftRows(data)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

const now = Date.parse('2026-09-25T12:00:00Z');
assert.strictEqual(vm.runInContext('coverWithin48h("2026-09-26T12:00:00Z", ' + now + ')', ctx), true, 'tomorrow is within 48h');
assert.strictEqual(vm.runInContext('coverWithin48h("2026-09-28T12:00:00Z", ' + now + ')', ctx), false, 'three days out is not within 48h');
assert.strictEqual(vm.runInContext('coverWithin48h("", ' + now + ')', ctx), false, 'blank when is not urgent');
assert.strictEqual(vm.runInContext('coverShiftUrgent({startsAt:"2026-09-26T08:00:00Z"}, ' + now + ')', ctx), true);
assert.strictEqual(vm.runInContext('coverShiftUrgent({urgency:"Within 48h", startsAt:"2026-10-01T00:00:00Z"}, ' + now + ')', ctx), true, 'Ace urgency flag is honored');

const mapped = vm.runInContext('coverMapShift({id:"s1", client_name:"Ada", regular_aide_name:"Bea", starts_at:"2026-09-26T12:00:00Z", status:"open"})', ctx);
assert.strictEqual(mapped.clientName, 'Ada');
assert.strictEqual(mapped.aideName, 'Bea');
assert.strictEqual(mapped.startsAt, '2026-09-26T12:00:00Z');
assert.strictEqual(mapped.id, 's1');

const ranked = vm.runInContext('coverMapRank({aide_id:"a1", aide_name:"Cam", distance_miles:1.2, continuity:"4 visits"})', ctx);
assert.strictEqual(ranked.name, 'Cam');
assert.strictEqual(ranked.distance, 1.2);
assert.strictEqual(ranked.continuity, '4 visits');
assert.strictEqual(vm.runInContext('coverMapRank({distance_miles:9})', ctx), null, 'a distance without an aide is not a rank');
assert.strictEqual(vm.runInContext('coverMapRank({aide_name:"Dee"}).distance', ctx), null, 'missing distance stays empty');
assert.strictEqual(vm.runInContext('coverRankRows({ok:false, ranks:[{aide_name:"Nope"}]}).length', ctx), 0, 'failed rank payload is not shown');
assert.strictEqual(vm.runInContext('coverRankRows({ranks:[{aide_name:"Dee", continuity:2}]})[0].name', ctx), 'Dee');
assert.strictEqual(vm.runInContext('coverIsOpen({status:"assigned"})', ctx), false);
assert.strictEqual(vm.runInContext('coverIsOpen({status:"open"})', ctx), true);
assert.strictEqual(vm.runInContext('coverShiftRows({shifts:[{id:"s2", client_name:"Ada"}]}).length', ctx), 1);

console.log('admin-cover1-test: ok');
