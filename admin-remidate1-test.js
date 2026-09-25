#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remidate1'), 'remidate1 marker');
assert.ok(html.includes('admin-build 2026-09-25-remidate1'), 'remidate1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remidate1">'), 'remidate1 meta');
assert.ok(html.includes('<!-- admin us dates 2026-09-25 v=remidate1 admin-build 2026-09-25-remidate1'), 'remidate1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-coverunlock1'), 'coverunlock1 is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after payready1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remidate1">'), 'remidate1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-ncipdf1">'), 'ncipdf1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remichat1">'), 'remichat1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1"') < html.indexOf('content="2026-09-25-remidate1"'), 'remidate1 stays after aidecreds1');
assert.ok(html.indexOf('content="2026-09-25-remidate1"') < html.indexOf('content="2026-09-25-ncipdf1"'), 'ncipdf1 stays after remidate1');
assert.ok(html.indexOf('content="2026-09-25-ncipdf1"') < html.indexOf('content="2026-09-25-remichat1"'), 'remichat1 stays after ncipdf1');
['v=ncipdf1','v=remichat1','v=remiscroll1','v=remi1','v=phonezoom1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const clientModal = html.slice(html.indexOf('id="clientModal"'), html.indexOf('id="locationMapModal"'));
const aideModal = html.slice(html.indexOf('id="addAideModal"'), html.indexOf('id="aideTempPwdModal"'));
assert.ok(!/type="date"|data-date="mdy"/.test(clientModal), 'Add Client has no date field');
assert.ok(!/type="date"|data-date="mdy"/.test(aideModal), 'Add Aide has no date field');
assert.ok(html.includes('placeholder="MM/DD/YYYY" inputmode="numeric" data-date="mdy" maxlength="10"'), 'Coverage and supervisory dates are typed MM/DD/YYYY');
assert.ok(!html.includes('id="coverDate"') || html.includes('id="coverDate" placeholder="MM/DD/YYYY"'), 'Coverage date field shows MM/DD/YYYY');
assert.ok(html.includes('function coverNyYmd(iso)'), 'service date payload helper stays');
assert.ok(html.includes('p_service_date:coverNyYmd'), 'skip payload still sends ISO service date');
assert.ok(html.includes('p_week_start'), 'schedule week payload stays ISO');
assert.ok(html.includes("data-date=\"'+schedAttr(cell.date)+'\""), 'schedule data-date stays the ISO cell date');

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
  'function formatAdminDate(val)',
  'function formatAdminDateCopy(text)',
  'function formatDateTimeLabel(val)',
  'function formatWeekLabel(val)',
  'function coverNyYmd(iso)',
  'function coverServiceDate(iso)',
  'function coverComposeWhen(date, time)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});

assert.strictEqual(vm.runInContext('formatAdminDate("2026-09-26")', ctx), '09/26/2026');
assert.strictEqual(vm.runInContext('formatAdminDate("9/6/2026")', ctx), '09/06/2026');
assert.strictEqual(vm.runInContext('formatAdminDate("2026-09-26T16:00:00Z")', ctx), '09/26/2026');
assert.strictEqual(vm.runInContext('formatWeekLabel("2026-09-13")', ctx), 'Week of 09/13/2026');
assert.ok(!/2026-09-26/.test(vm.runInContext('formatDateTimeLabel("2026-09-26T16:00:00Z")', ctx)), 'timestamp label is not ISO');
assert.ok(/^09\/26\/2026, /.test(vm.runInContext('formatDateTimeLabel("2026-09-26T16:00:00Z")', ctx)), 'timestamp label leads with MM/DD/YYYY');
assert.strictEqual(vm.runInContext('formatAdminDateCopy("week 2026-09-21 and 2026-09-25T16:00:00Z")', ctx), 'week 09/21/2026 and 09/25/2026');
assert.strictEqual(vm.runInContext('coverServiceDate("2026-09-26T16:00:00Z")', ctx), '09/26/2026');
assert.strictEqual(vm.runInContext('coverNyYmd("2026-09-26T16:00:00Z")', ctx), '2026-09-26', 'Ace service date stays YYYY-MM-DD');
const composed = vm.runInContext('coverComposeWhen("09/26/2026","08:00")', ctx);
assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(composed), 'composed shift start stays ISO');
assert.ok(!composed.includes('/'), 'composed shift start is not MM/DD/YYYY');

const quiet = html.slice(html.indexOf('function copilotPaintQuiet'), html.indexOf('function copilotPaintRadar'));
assert.ok(/8:00 PM/.test(quiet), 'quiet hours copy is a clock range');
assert.ok(!/\d{4}-\d{2}-\d{2}/.test(quiet), 'quiet hours copy has no ISO date');

console.log('admin-remidate1-test: ok');
