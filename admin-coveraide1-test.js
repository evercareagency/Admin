#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=coveraide1'), 'coveraide1 marker');
assert.ok(html.includes('admin-build 2026-09-25-coveraide1'), 'coveraide1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-coveraide1">'), 'coveraide1 meta');
assert.ok(html.indexOf('content="2026-09-25-coveraide1"') < html.indexOf('content="2026-09-25-cover1"'), 'coveraide1 is the current build meta');
assert.ok(html.includes('GHOST-COVERAIDE1-CONTRACT-v1'), 'coveraide contract note');
assert.ok(html.includes('v=cover1'), 'cover1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-cover1">'), 'cover1 meta stays');
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

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'bottom bar stays five tabs');
assert.ok(!nav.includes('nav_coverage'), 'Coverage is not a bottom tab');
assert.ok(nav.includes('id="nav_backups"'), 'Backup tab stays');

const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_coverage"'), 'Coverage row stays in the More list');
assert.ok(more.includes("showTab('coverage')"), 'Coverage still opens with showTab');

const bak = admin.slice(admin.indexOf('id="tab_backups"'), admin.indexOf('id="tab_aides"'));
assert.ok(bak.includes('Phone-change draft'), 'Backup stays phone-change drafts');
assert.ok(bak.includes('>Open drafts<') || html.includes('>Open drafts<'), 'Open drafts stays');
assert.ok(!/Approve/i.test(bak), 'Backup has no Approve');
assert.ok(!/Decline/i.test(bak), 'Backup has no Decline');
assert.ok(!/Coverage/i.test(bak), 'Coverage desk is not on Backup');
assert.ok(!/PTO/i.test(bak), 'Backup has no PTO');
assert.ok(!bak.includes('tab_coverage'), 'coverage panel is not inside Backup');

const desk = admin.slice(admin.indexOf('id="tab_coverage"'), admin.indexOf('id="tab_backups"'));
assert.ok(desk.includes('id="coverList"'), 'open shifts list stays');
assert.ok(desk.includes('Record call-off'), 'office intake stays');
assert.ok(!/Request PTO|PTO balance|pto_request/i.test(desk), 'coverage is not a PTO product');
assert.ok(!html.includes('aide_record_call_off(') && !html.includes("sbRestRpc('aide_record_call_off'"), 'admin does not call the aide record RPC');
assert.ok(html.includes("list:['admin_list_open_shifts']"), 'list callable stays');
assert.ok(html.includes("record:['admin_record_call_off']"), 'office record callable stays');
assert.ok(!html.includes('reset_aide_temp_password') || html.includes('Never reset_aide_temp_password'), 'this tip does not add a password rotate');

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
  'function coverIntakeSource(src)',
  'function coverSourceLabel(key)',
  'function coverSourceChips(shift)',
  'function coverNameOf(v)',
  'function coverIdOf(v)',
  'function coverMapShift(row)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

assert.strictEqual(vm.runInContext('coverIntakeSource({})', ctx), 'office', 'missing source defaults to office');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"ace"})', ctx), 'office', 'pipeline ace is not an aide flag');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"local"})', ctx), 'office', 'phone-session rows are office intake');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"office"})', ctx), 'office', 'explicit office');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"Office"})', ctx), 'office', 'office is case-insensitive and still office');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"aide"})', ctx), 'aide', 'source aide');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"Aide"})', ctx), 'aide', 'Aide capitalisation');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"caregiver"})', ctx), 'aide', 'caregiver alias');
assert.strictEqual(vm.runInContext('coverIntakeSource({source:"aide_record_call_off"})', ctx), 'aide', 'aide record callable name as source');
assert.strictEqual(vm.runInContext('coverIntakeSource({calloff_source:"aide"})', ctx), 'aide', 'calloff_source');
assert.strictEqual(vm.runInContext('coverIntakeSource({submitted_by:"aide"})', ctx), 'aide', 'submitted_by aide');
assert.strictEqual(vm.runInContext('coverIntakeSource({aide_submitted:true})', ctx), 'aide', 'aide_submitted flag');
assert.strictEqual(vm.runInContext('coverIntakeSource({from_aide:true})', ctx), 'aide', 'from_aide flag');
assert.strictEqual(vm.runInContext('coverIntakeSource({submitted_by_aide:true})', ctx), 'aide', 'submitted_by_aide flag');
assert.strictEqual(vm.runInContext('coverIntakeSource({aide_call_off:true})', ctx), 'aide', 'aide_call_off flag');
assert.strictEqual(vm.runInContext('coverIntakeSource({regular_aide:{name:"Bea"}})', ctx), 'office', 'the regular aide object is not the source flag');
assert.strictEqual(vm.runInContext('coverIntakeSource({aide_submitted:false, source:"office"})', ctx), 'office', 'a false aide flag does not flip the chip');

const office = vm.runInContext('coverMapShift({open_shift_id:"os1", client_name:"Ada", regular_aide_name:"Bea", shift_start:"2026-09-26T12:00:00Z", shift_end:"2026-09-26T16:00:00Z", status:"open"})', ctx);
assert.strictEqual(office.intakeSource, 'office');
assert.strictEqual(office.source, 'ace', 'a list row stays on the office pipeline');

const aide = vm.runInContext('coverMapShift({open_shift_id:"os2", client:{name:"Sam Lee"}, regular_aide:{name:"Cam Diaz"}, shift_start:"2026-09-28T13:00:00Z", shift_end:"2026-09-28T17:00:00Z", status:"open", source:"aide"})', ctx);
assert.strictEqual(aide.intakeSource, 'aide');
assert.strictEqual(aide.source, 'ace', 'aide source does not replace the local/ace pipeline');
assert.strictEqual(aide.clientName, 'Sam Lee');

const local = vm.runInContext('coverMapShift({id:"local-1", clientName:"Ada", source:"local", intakeSource:"office", status:"open"})', ctx);
assert.strictEqual(local.source, 'local');
assert.strictEqual(local.intakeSource, 'office');

const now = Date.parse('2026-09-25T12:00:00Z');
const officeChip = vm.runInContext('coverSourceChips({intakeSource:"office", status:"open", startsAt:"2026-09-26T08:00:00Z", endsAt:"2026-09-26T16:00:00Z"})', ctx);
assert.ok(officeChip.includes('>Office<'), 'office chip copy');
assert.ok(officeChip.includes('cover-chip-office'), 'office chip class');
assert.ok(officeChip.includes('>Within 48h<'), 'urgency chip still paints beside source');
const aideChip = vm.runInContext('coverSourceChips({intakeSource:"aide", status:"open", startsAt:"2026-09-28T13:00:00Z", endsAt:"2026-09-28T17:00:00Z"})', ctx);
assert.ok(aideChip.includes('>Aide<'), 'aide chip copy');
assert.ok(aideChip.includes('cover-chip-aide'), 'aide chip class');
assert.ok(!aideChip.includes('Within 48h'), 'a later shift does not get the urgency chip');
assert.strictEqual(vm.runInContext('coverSourceLabel("aide")', ctx), 'Aide');
assert.strictEqual(vm.runInContext('coverSourceLabel("office")', ctx), 'Office');
assert.strictEqual(vm.runInContext('coverSourceLabel("")', ctx), 'Office');

const paint = extractFn(html, 'function coverPaintList()');
assert.ok(paint.includes('coverSourceChips'), 'open list paints the source chip');
assert.ok(paint.includes('data-cover-intake'), 'open list marks the source');
const detail = extractFn(html, 'function coverPaintOutcome()');
assert.ok(detail.includes('coverSourceChips'), 'detail paints the source chip');
assert.ok(detail.includes('Source · '), 'detail names the source');

const record = extractFn(html, 'async function coverRecordCalloff()');
assert.ok(record.includes("intakeSource:'office'") || record.includes('intakeSource=\'office\'') || record.includes('found.intakeSource=\'office\''), 'office record path stays Office');
assert.ok(record.includes('admin_record_call_off') || html.includes("record:['admin_record_call_off']"), 'record still uses the office callable');

console.log('admin-coveraide1-test: ok');
