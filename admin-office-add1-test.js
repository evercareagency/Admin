#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const {execFileSync} = require('child_process');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');
const old = execFileSync('git', ['-C', __dirname, 'show', 'HEAD:index.html'], {encoding: 'utf8', maxBuffer: 20 * 1024 * 1024});

assert.ok(html.includes('OFFICE_ADD1'), 'OFFICE_ADD1 marker');
assert.ok(html.includes('v=office-add1'), 'office-add1 marker');
assert.ok(html.includes("var OFFICE_ADD1_MARKER='v=office-add1'"), 'script query marker');
assert.ok(html.includes("var OFFICE_ADD1_BUILD='2026-11-26-office-add1'"), 'script build');
assert.ok(html.includes('<meta name="admin-build" content="2026-11-26-office-add1">'), 'build meta');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(!html.includes('CREATE TABLE') && !html.includes('ALTER TABLE'), 'index does not carry SQL');
assert.ok(fs.existsSync(path.join(__dirname, 'sql/office-add1-PREVIEW-DO-NOT-APPLY.sql')), 'unapplied SQL file is present');
const sql = fs.readFileSync(path.join(__dirname, 'sql/office-add1-PREVIEW-DO-NOT-APPLY.sql'), 'utf8');
assert.ok(sql.startsWith('-- office-add1 PREVIEW. DO NOT APPLY.'), 'SQL file says do not apply');
assert.ok(sql.includes('admin_set_shift_repeat'), 'repeat RPC is listed');
assert.ok(sql.includes('admin_mark_visit_checked'), 'mark-checked RPC is listed');
assert.ok(sql.includes('admin_list_aide_pay_rates'), 'pay rate RPC is listed');
assert.ok(sql.includes("not in ('admin', 'Admin')"), 'pay rates refuse a non-admin role');
assert.ok(sql.includes('time_entry_mode'), 'preview SQL lists time_entry_mode');
assert.ok(sql.includes('exemption_reason'), 'preview SQL lists exemption_reason');
assert.ok(sql.includes('exempt_effective_from'), 'preview SQL lists exempt_effective_from');

function grab(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start > 0, sig);
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
['function gpsDistanceUi(d){', 'function buildPrintHtml(', 'function printTimesheetSheet(){', 'function openTimesheetPrint(r){', 'function formatDistanceMiles(d){'].forEach(function(sig){
  assert.strictEqual(grab(html, sig), grab(old, sig), 'timesheet/PDF function unchanged: ' + sig);
});
assert.strictEqual(
  (html.match(/body > \*:not\(#tsPrintSheet\):not\(#tsPrintOverlay\)/g) || []).length,
  (old.match(/body > \*:not\(#tsPrintSheet\):not\(#tsPrintOverlay\)/g) || []).length,
  'timesheet print hide selector is unchanged'
);

const start = html.indexOf('// OFFICE_ADD1_START');
const end = html.indexOf('// OFFICE_ADD1_END');
assert.ok(start > 0 && end > start, 'office module markers');
const src = html.slice(start, end);
assert.ok(src.includes('↻ weekly'), 'weekly mark copy');
assert.ok(!/holiday pay/i.test(src), 'no holiday pay copy in the office module');
assert.ok(src.includes('Exempt, manual entry'), 'exempt chip copy');
assert.ok(src.includes('Clock in at each visit (Sandata EVV)'), 'clock-in card copy');
assert.ok(src.includes('see Clock In'), 'calm confirm copy');
assert.ok(src.includes("officeScreen") || src.includes("aideedit"), 'aide preview screens');
assert.ok(src.includes('admin_list_aide_pay_rates'), 'pay rate RPC name');
assert.ok(!src.includes('gpsDistanceUi') && !src.includes('buildPrintHtml') && !src.includes('printTimesheetSheet'), 'module does not call timesheet printers');

const els = {};
function el(id){
  const node = {
    id: id,
    hidden: false,
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    disabled: false,
    dataset: {},
    classList: {add: function(){}, remove: function(){}},
    children: [],
    appendChild: function(child){this.children.push(child);},
    querySelectorAll: function(){return [];},
    setAttribute: function(name, value){this[name] = value;},
    addEventListener: function(){}
  };
  els[id] = node;
  return node;
}
['officePayLock','officePayRates','officePayBody','officePayEmpty','officePayNote','officeRepeatPreview','schedHead'].forEach(el);

const calls = [];
const sandbox = {
  currentAdminRole: 'Scheduler',
  console: console,
  Intl: Intl,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Object: Object,
  Array: Array,
  document: {getElementById: function(id){return els[id] || null;}, querySelectorAll: function(){return [];}},
  sbRestRpc: async function(name, body){
    calls.push({name: name, body: body});
    return {ok: true, data: {rows: [{aide_name: 'Should Not Load', hourly_rate: 99}]}};
  },
  schedEnsureWeek: function(){return '2026-11-23';},
  schedReadDayChecks: function(){return [1, 3, 5];}
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const exemptCounts = sandbox.officeExemptCounts();
assert.strictEqual(exemptCounts.all, 8);
assert.strictEqual(exemptCounts.clock, 5);
assert.strictEqual(exemptCounts.exempt, 3);
assert.strictEqual(sandbox.officeExemptFind('test').evv, 'exempt');
assert.strictEqual(sandbox.officeAdd1Holiday('2026-11-26'), 'Thanksgiving');
assert.strictEqual(sandbox.officeAdd1Holiday('2026-11-25'), '');
assert.strictEqual(sandbox.officeAdd1HolidayPayLine('2026-11-26', 'Admin'), '');
assert.strictEqual(sandbox.officeAdd1HolidayPayLine('2026-11-26', 'Scheduler'), '');
assert.strictEqual(sandbox.officeAdd1HolidayPayLine('2026-11-26', 'Nurse'), '');
assert.strictEqual(sandbox.officeAdd1NeedsLook(1000), false);
assert.strictEqual(sandbox.officeAdd1NeedsLook(1001), true);
assert.ok(sandbox.officeAdd1FormatFt(2400).includes('ft'));
assert.ok(sandbox.officeAdd1CountShifts('2026-11-23', [1, 3, 5], '2026-11-30') >= 4);

const north = sandbox.officeAdd1SupervisionStatus({last: '2026-09-20', visits: 1}, '2026-11-26');
assert.strictEqual(north.status, 'overdue');
const west = sandbox.officeAdd1SupervisionStatus({last: '2026-09-28', visits: 1}, '2026-11-26');
assert.strictEqual(west.status, 'due');
const east = sandbox.officeAdd1SupervisionStatus({last: '2026-11-20', visits: 2}, '2026-11-26');
assert.strictEqual(east.status, 'ok');
const none = sandbox.officeAdd1SupervisionStatus({visits: 0}, '2026-11-26');
assert.strictEqual(none.status, 'overdue');

const today = sandbox.officeAdd1SampleToday();
assert.ok(today.progress.length >= 1, 'a visit is in progress at the preview clock');
assert.ok(today.late.length >= 1, 'a visit is late');
assert.ok(today.missed.length >= 1, 'a visit is missed');
assert.ok(today.open.length >= 1, 'an open shift is listed');

const split = sandbox.officeAdd1SplitAides(sandbox.officeAdd1SampleAides());
assert.strictEqual(split.onCall.length, 1);
assert.ok(split.available.length >= 1);
assert.strictEqual(split.onCall[0].name, 'Aide Two');

const repeat = sandbox.officeAdd1RepeatPreviewText({on: true, days: [1, 3, 5], week: '2026-11-23', until: '2027-01-31'});
assert.ok(/^\d+ shifts /.test(repeat), repeat);

(async function(){
  const pay = await sandbox.officeAdd1LoadPay();
  assert.strictEqual(pay.forbidden, true);
  assert.strictEqual(calls.length, 0, 'Scheduler payroll load does not call a pay RPC');
  assert.ok(els.officePayLock.textContent.includes('Payroll is locked'));
  assert.strictEqual(els.officePayBody.innerHTML, '');
  sandbox.currentAdminRole = 'Admin';
  calls.length = 0;
  const adminPay = await sandbox.officeAdd1LoadPay();
  assert.strictEqual(adminPay.forbidden, false);
  assert.ok(calls.some(function(c){return c.name === 'admin_list_aide_pay_rates';}), 'Admin asks for pay rates');
  const doc = sandbox.officeAdd1MissedPrintDocument([{on: '2026-11-25', client: 'East Sample', aide: 'Aide Two', when: '9:00 AM – 1:00 PM', reason: 'Client declined service'}]);
  assert.ok(doc.includes('Missed visits'));
  assert.ok(doc.includes('East Sample'));
  assert.ok(!doc.includes('blank-letter') && !doc.includes('HHA'), 'print view is not the timesheet');
  console.log('office-add1 test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
