#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=payready1'), 'payready1 marker');
assert.ok(html.includes('data-payready="v=payready1"'), 'payready1 string marker');
assert.ok(html.includes('admin-build 2026-09-25-payready1'), 'payready1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-payready1">'), 'payready1 meta');
assert.ok(html.includes('<!-- admin pay readiness 2026-09-25 v=payready1 admin-build 2026-09-25-payready1'), 'payready1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-payready1'), 'payready1 is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1b"'), 'aidecreds1b stays after payready1');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1b"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after aidecreds1b');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1"') < html.indexOf('content="2026-09-25-remidate1"'), 'remidate1 stays after aidecreds1');
assert.ok(html.indexOf('content="2026-09-25-remidate1"') < html.indexOf('content="2026-09-25-ncipdf1"'), 'ncipdf1 stays after remidate1');
['v=aidecreds1b','v=aidecreds1','v=remidate1','v=ncipdf1','v=remichat1','v=remiscroll1','v=remi1','v=phonezoom1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const note = html.slice(html.indexOf('v=payready1'), html.indexOf('<meta name="admin-build" content="2026-09-25-payready1">'));
assert.ok(/not the Scheduler desk-brain/.test(note), 'Scheduler desk-brain does not own pay readiness');
assert.ok(/Remi stays the corner chip/.test(note), 'Remi stays corner-only');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(/admin_pay_readiness_rollup/.test(note) && /admin_timesheet_readiness_rollup/.test(note), 'note names the rollup candidates');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'payready1 note does not reseal Auth');
assert.ok(html.includes("var COPILOT_KINDS=['coverage_open','timesheet_late','schedule_gap','aide_issue','backup_needed','inservice_due','intake_pending','compliance_flag','broadcast_needed','login_fail']"), 'Remi radar kinds stay');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');

const panel = html.slice(html.indexOf('id="payReady"'), html.indexOf('id="tsDeskSub"'));
assert.ok(panel.includes('>Pay ready<'), 'all-ready title');
assert.ok(panel.includes('>Export ready list<'), 'export button');
assert.ok(panel.includes('>Open timesheet<'), 'open timesheet');
assert.ok(panel.includes('>Hold pay<'), 'hold pay');
assert.ok(panel.includes('Not full payroll — readiness only.'), 'readiness footer');
assert.ok(panel.includes('Nothing held this pay period'), 'empty subtitle');
assert.ok(panel.includes('← Pay held'), 'held detail back label');
assert.ok(!/copilotFab|remi-chip/.test(panel), 'Remi chip stays out of the pay screen');
assert.ok(!/\$|pay_amount|gross|hourly_rate/.test(panel), 'pay screen HTML has no money fields');
assert.ok(!html.includes('id="tsFiles"') && !html.includes('payReadyToggleFiles'), 'pay readiness does not hide the live timesheet desk');
assert.ok(html.includes('data-ts-desk="active"') && html.includes('id="exportAllPdfsBtn"') && html.includes('id="tsSearch"'), 'existing timesheet desk stays on the page');

const srcStart = html.indexOf('var PAYREADY_MARKER');
const srcEndFn = extractFn(html, 'function payReadyExport()');
const src = html.slice(srcStart, html.indexOf(srcEndFn) + srcEndFn.length);
assert.ok(!/sbRestRpc\(|pay_amount|\$[0-9]/.test(extractFn(html, 'function payReadyHold()')), 'Hold pay does not post payroll');
assert.ok(extractFn(html, 'async function payReadyFetchAce(weekStart)').includes("sbRestRpc(name, body)"), 'rollup uses sbRestRpc');
assert.ok(extractFn(html, 'async function payReadyFetchAce(weekStart)').includes('p_week_start'), 'rollup sends the week');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser/.test(src), 'payready functions do not reseal Auth');

function el(id){
  return {id:id, hidden:false, textContent:'', innerHTML:'', attrs:{}, setAttribute:function(k,v){this.attrs[k]=v;}};
}
const ids = ['payReady','payReadyListView','payReadyDetail','payReadyWeek','payReadyCount','payHeldCount','payReadyRows','payReadyEmpty','payReadyTitle','payReadyEmptyTitle','payReadyEmptySub','payReadyMark','payReadyExport','payDetailName','payDetailClient','payDetailWeek','payDetailBanner','payDetailChecks'];
const els = {};
ids.forEach(function(id){els[id]=el(id);});
const calls = [];
const box = {
  document:{getElementById:function(id){return els[id]||null;}},
  sbRestRpc: async function(name, body){
    calls.push({name:name, body:JSON.parse(JSON.stringify(body))});
    if(box.mode==='ace'){
      if(name==='admin_pay_readiness_rollup')return {ok:true, data:{success:true, week_start:'2026-09-21', week_end:'2026-09-27', rows:[
        {id:'ace-1', aide_name:'Jordan Smith', client_name:'Ruth Coleman', role:'Home Health Aide', status:'held', reason:'missing_signature', pay_amount:240, gross:240, checks:{submitted:true, save_day_complete:true, signature:'missing', office_review:'clear'}},
        {id:'ace-2', aide_name:'Maya Brooks', role:'Home Health Aide', status:'ready', hourly_rate:18}
      ]}};
    }
    return {ok:false, status:404, error:'Could not find the function'};
  },
  sbAideListRpcMissing:function(got){
    var err=String((got&&got.error)||'');
    return !!(got&&got.status===404)||/could not find the function/i.test(err);
  },
  mode:'miss',
  Intl:Intl,
  URL:URL,
  Blob:Blob
};
vm.createContext(box);
vm.runInContext(src, box);

const week = vm.runInContext("payReadyWeekRange(new Date('2026-09-25T16:00:00Z'))", box);
assert.strictEqual(week.week_start, '2026-09-21');
assert.strictEqual(week.week_end, '2026-09-27');
assert.strictEqual(week.label, '09/21/2026\u201309/27/2026');
assert.ok(!/Sep/.test(week.label), 'week label is MM/DD/YYYY');

const nextWeek = vm.runInContext("payReadyWeekRange(new Date('2026-09-28T04:00:00Z'))", box);
assert.strictEqual(nextWeek.label, '09/28/2026\u201310/04/2026');

const mixed = vm.runInContext("payReadyStubRollup('mixed', payReadyWeekRange(new Date('2026-09-25T16:00:00Z')))", box);
const mixedCounts = vm.runInContext('payReadyCounts('+JSON.stringify(mixed.rows)+')', box);
assert.strictEqual(mixedCounts.held, 4);
assert.strictEqual(mixedCounts.ready, 12);
const mixedHtml = vm.runInContext('payReadyRowsHtml(payReadyStubRollup("mixed", {week_start:"2026-09-21",week_end:"2026-09-27",label:"09/21/2026\\u201309/27/2026"}).rows)', box);
['missing signature','not submitted','sent back','incomplete Save Day','All current','Jordan Smith','Maya Brooks','Alex Nguyen','Home Health Aide'].forEach(function(bit){
  assert.ok(mixedHtml.includes(bit), 'list shows '+bit);
});
assert.ok(!/\$|pay_amount|gross|hourly/.test(mixedHtml), 'list html has no money');

const detail = vm.runInContext('payReadyDetailModel(payReadyStubRollup("mixed", {label:"09/21/2026\\u201309/27/2026"}).rows[0], "09/21/2026\\u201309/27/2026")', box);
assert.strictEqual(detail.name, 'Jordan Smith');
assert.strictEqual(detail.client, 'Client: Ruth Coleman');
assert.strictEqual(detail.week, 'Week of 09/21/2026\u201309/27/2026');
assert.strictEqual(detail.banner, 'Held \u2014 missing signature');
assert.strictEqual(detail.checks.map(function(c){return c.label;}).join('|'), 'Submitted|Save Day complete|Signature|Office review');
assert.strictEqual(detail.checks[0].text, 'Yes');
assert.strictEqual(detail.checks[1].text, 'Yes');
assert.ok(/^Missing /.test(detail.checks[2].text), detail.checks[2].text);
assert.strictEqual(detail.checks[2].tone, 'bad');
assert.strictEqual(detail.checks[3].text, 'Clear');
assert.strictEqual(detail.checks[3].tone, 'ok');

const clear = vm.runInContext("payReadyStubRollup('clear', {week_start:'2026-09-21',week_end:'2026-09-27',label:'09/21/2026\\u201309/27/2026'})", box);
assert.strictEqual(vm.runInContext('payReadyCounts('+JSON.stringify(clear.rows)+')', box).held, 0);
assert.strictEqual(clear.rows.length, 16);
const csv = vm.runInContext('payReadyExportCsv('+JSON.stringify(clear)+')', box);
assert.ok(csv.startsWith('Aide,Client,Week,Readiness'), 'export columns are readiness only');
assert.strictEqual(csv.split('\n')[0], 'Aide,Client,Week,Readiness');
assert.ok(!/\$/.test(csv), 'export has no dollar amounts');

box.mode = 'miss';
(async function(){
const missed = await vm.runInContext('payReadyFetchAce("2026-09-21")', box);
assert.strictEqual(missed, null);
assert.deepStrictEqual(calls.map(function(c){return c.name;}), ['admin_pay_readiness_rollup','admin_timesheet_readiness_rollup']);
assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});
assert.strictEqual(box.payReadyFetchAce.off, true, 'missing callables stop the probe');

box.payReadyFetchAce.off = false;
box.mode = 'ace';
calls.length = 0;
const ace = await vm.runInContext('payReadyFetchAce("2026-09-21")', box);
assert.strictEqual(calls.length, 1);
assert.strictEqual(ace.source, 'ace');
assert.strictEqual(ace.label, '09/21/2026\u201309/27/2026');
assert.strictEqual(ace.rows[0].name, 'Jordan Smith');
assert.strictEqual(ace.rows[0].status, 'held');
assert.ok(!('pay_amount' in ace.rows[0]) && !('gross' in ace.rows[0]), 'held row drops money');
assert.ok(!('hourly_rate' in ace.rows[1]), 'ready row drops money');
const aceHtml = vm.runInContext('payReadyRowsHtml('+JSON.stringify(ace.rows)+')', box);
assert.ok(aceHtml.includes('missing signature') && aceHtml.includes('All current'));
assert.ok(!aceHtml.includes('240') && !aceHtml.includes('18'), 'painted rows do not show amounts');

box.payReadyState = mixed;
box.payReadyView = 'list';
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payReadyCount.textContent, 'Ready 12');
assert.strictEqual(els.payHeldCount.textContent, 'Held 4');
assert.strictEqual(els.payReadyWeek.textContent, 'Week of 09/21/2026\u201309/27/2026');
assert.strictEqual(els.payReadyTitle.hidden, true);
assert.strictEqual(els.payReadyEmpty.hidden, true);
assert.ok(els.payReadyRows.innerHTML.includes('Held') && els.payReadyRows.innerHTML.includes('Ready'));

vm.runInContext('payReadyOpenDetail("pay-js")', box);
assert.strictEqual(els.payReadyDetail.hidden, false);
assert.strictEqual(els.payReadyListView.hidden, true);
assert.strictEqual(els.payDetailName.textContent, 'Jordan Smith');
assert.strictEqual(els.payDetailBanner.textContent, 'Held \u2014 missing signature');
assert.ok(els.payDetailChecks.innerHTML.includes('Save Day complete'));
assert.ok(els.payDetailChecks.innerHTML.includes('Office review'));

box.payReadyState = clear;
box.payReadyView = 'list';
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payReadyCount.textContent, 'Ready 16');
assert.strictEqual(els.payHeldCount.textContent, 'Held 0');
assert.strictEqual(els.payReadyTitle.hidden, false);
assert.strictEqual(els.payReadyTitle.textContent, 'Pay ready');
assert.strictEqual(els.payReadyEmptyTitle.textContent, 'All 16 timesheets ready');
assert.strictEqual(els.payReadyEmptySub.textContent, 'Nothing held this pay period');
assert.strictEqual(els.payReadyExport.hidden, false);
assert.strictEqual(els.payReadyDetail.hidden, true);

console.log('admin-payready1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
