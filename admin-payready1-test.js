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
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-payready1c'), 'payready1c is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-payready1b"') < html.indexOf('content="2026-09-25-coverunlock1"'), 'coverunlock1 stays after payready1b');
assert.ok(html.indexOf('content="2026-09-25-coverunlock1"') < html.indexOf('content="2026-09-25-payready1"'), 'payready1 stays after coverunlock1');
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
assert.ok(/GHOST-PAYREADY1-CONTRACT-v1/.test(note), 'note names the payready contract');
assert.ok(/admin_timesheet_pay_readiness/.test(note) && /admin_set_timesheet_pay_hold/.test(note) && /admin_timesheet_pay_export/.test(note), 'note names the three Ace callables');
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
const srcEndFn = extractFn(html, 'async function payReadyExport()');
const src = html.slice(srcStart, html.indexOf(srcEndFn) + srcEndFn.length);
const holdFn = extractFn(html, 'async function payReadyHold()');
const fetchFn = extractFn(html, 'async function payReadyFetchAce(weekStart)');
const exportFn = extractFn(html, 'async function payReadyExport()');
assert.ok(holdFn.includes('sbRestRpc(PAYREADY_HOLD_RPC,{p_timesheet_id:id,p_hold:true})'), 'Hold pay posts the Ace hold callable');
assert.ok(!/pay_amount|gross|hourly_rate|p_note|p_amount/.test(holdFn), 'Hold pay does not send payroll');
assert.ok(fetchFn.includes('sbRestRpc(PAYREADY_READINESS_RPC, body)'), 'readiness uses sbRestRpc');
assert.ok(fetchFn.includes('p_week_start') && !fetchFn.includes('p_aide_id'), 'week list sends p_week_start and leaves p_aide_id off');
assert.ok(exportFn.includes('sbRestRpc(PAYREADY_EXPORT_RPC, body)'), 'export uses the Ace export callable');
assert.ok(!html.includes('function payReadyStubRollup') && !html.includes('function payReadyNameList') && !html.includes('admin_pay_readiness_rollup'), 'stub roster and guessed RPC names are gone');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser/.test(src), 'payready functions do not reseal Auth');

function el(id){
  return {id:id, hidden:false, textContent:'', innerHTML:'', attrs:{}, setAttribute:function(k,v){this.attrs[k]=v;}};
}
const ids = ['payReady','payReadyListView','payReadyDetail','payReadyWeek','payReadyCount','payHeldCount','payReadyRows','payReadyEmpty','payReadyTitle','payReadyEmptyTitle','payReadyEmptySub','payReadyMark','payReadyExport','payDetailName','payDetailClient','payDetailWeek','payDetailBanner','payDetailChecks'];
const els = {};
ids.forEach(function(id){els[id]=el(id);});
const calls = [];
const box = {
  document:{
    getElementById:function(id){return els[id]||null;},
    createElement:function(){return {href:'', download:'', click:function(){box.downloaded=this.download;}, remove:function(){}};},
    body:{appendChild:function(){}}
  },
  sbRestRpc: async function(name, body){
    calls.push({name:name, body:JSON.parse(JSON.stringify(body||{}))});
    if(box.mode==='ace' && name==='admin_timesheet_pay_readiness')return {ok:true, data:box.aceData};
    if(box.mode==='export' && name==='admin_timesheet_pay_export')return {ok:true, data:box.exportData};
    if(box.mode==='hold' && name==='admin_set_timesheet_pay_hold')return {ok:true, data:{timesheet_id:body.p_timesheet_id, pay_hold:true, pay_status:'held'}};
    return {ok:false, status:404, error:'Could not find the function'};
  },
  mode:'miss',
  aceData:null,
  exportData:null,
  downloaded:'',
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

const aceMixed = {
  success:true,
  week_start:'2026-09-21',
  week_end:'2026-09-27',
  ready_count:12,
  held_count:4,
  rows:[
    {timesheet_id:'ts-js', aide_name:'Jordan Smith', client_name:'Ruth Coleman', role:'Home Health Aide', pay_status:'held', held_reason:'missing_signature', label:'missing signature', checklist:{submitted:true, save_day_complete:true, signature:'missing', office_review:'clear'}, pay_hold:false, pay_amount:240, gross:240},
    {timesheet_id:'ts-cw', aide_name:'Casey White', role:'Home Health Aide', client_name:'Helen Grant', pay_status:'held', held_reason:'not_submitted', label:'not submitted', checklist:{submitted:false, save_day_complete:false, signature:false, office_review:null}, pay_hold:false},
    {timesheet_id:'ts-tr', aide_name:'Taylor Reed', role:'Home Health Aide', client_name:'Luis Ortega', pay_status:'held', held_reason:'sent_back', label:'sent back', checklist:{submitted:true, save_day_complete:true, signature:true, office_review:'sent_back'}, pay_hold:false},
    {timesheet_id:'ts-md', aide_name:'Morgan Davis', role:'Home Health Aide', client_name:'June Patel', pay_status:'held', held_reason:'incomplete_save_day', label:'incomplete Save Day', checklist:{submitted:true, save_day_complete:false, signature:'present', office_review:'clear'}, pay_hold:false},
    {timesheet_id:'ts-mh', aide_name:'Robin Shah', role:'Home Health Aide', pay_status:'ready', held_reason:'manual_hold', label:'manual hold', checklist:{submitted:true, save_day_complete:true, signature:true, office_review:'clear'}, pay_hold:true},
    {timesheet_id:'ts-mb', aide_name:'Maya Brooks', role:'Home Health Aide', pay_status:'ready', checklist:{submitted:true, save_day_complete:true, signature:true, office_review:'clear'}, hourly_rate:18},
    {timesheet_id:'ts-an', aide_name:'Alex Nguyen', role:'Home Health Aide', pay_status:'ready', checklist:{submitted:true, save_day_complete:true, signature:true, office_review:'clear'}}
  ]
};
box.aceData = aceMixed;
const mixed = vm.runInContext('payReadyMapRollup('+JSON.stringify(aceMixed)+', "2026-09-21")', box);
assert.strictEqual(mixed.ready_count, 12);
assert.strictEqual(mixed.held_count, 4);
assert.strictEqual(mixed.rows[4].status, 'ready', 'pay_status ready wins over a stray hold reason');
assert.ok(!('pay_amount' in mixed.rows[0]) && !('gross' in mixed.rows[0]) && !('hourly_rate' in mixed.rows[5]), 'mapped rows drop money');
const mixedHtml = vm.runInContext('payReadyRowsHtml('+JSON.stringify(mixed.rows)+')', box);
['missing signature','not submitted','sent back','incomplete Save Day','All current','Jordan Smith','Maya Brooks','Alex Nguyen','Home Health Aide'].forEach(function(bit){
  assert.ok(mixedHtml.includes(bit), 'list shows '+bit);
});
assert.ok(!/\$|pay_amount|gross|hourly|240/.test(mixedHtml), 'list html has no money');

const detail = vm.runInContext('payReadyDetailModel('+JSON.stringify(mixed.rows[0])+', "09/21/2026\\u201309/27/2026")', box);
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

const manual = vm.runInContext('payReadyMapRow({timesheet_id:"ts-hold", aide_name:"Parker Lee", pay_status:"held", held_reason:"manual_hold", checklist:{submitted:true, save_day_complete:true, signature:true, office_review:"clear"}, pay_hold:true})', box);
assert.strictEqual(manual.reason, 'manual_hold');
assert.strictEqual(manual.reasonLabel, 'manual hold');

const clear = vm.runInContext('payReadyMapRollup({week_start:"2026-09-21", week_end:"2026-09-27", ready_count:16, held_count:0, rows:[]})', box);
assert.strictEqual(clear.held_count, 0);
assert.strictEqual(clear.ready_count, 16);
const csv = vm.runInContext('payReadyTableToCsv({columns:["Aide","Client","Week","Readiness","gross"], rows:[["Maya Brooks","Ruth Coleman","09/21/2026\u201309/27/2026","ready","240"]]})', box);
assert.strictEqual(csv.split('\n')[0], 'Aide,Client,Week,Readiness');
assert.ok(!/gross|240|\$/.test(csv), 'export drops payroll columns');

box.mode = 'miss';
(async function(){
const missed = await vm.runInContext('payReadyFetchAce("2026-09-21")', box);
assert.strictEqual(missed.error, 'Could not load pay readiness.');
assert.deepStrictEqual(calls.map(function(c){return c.name;}), ['admin_timesheet_pay_readiness']);
assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});

calls.length = 0;
const loadedMiss = await vm.runInContext('payReadyLoad()', box);
assert.ok(loadedMiss && loadedMiss.error);
assert.ok(!els.payReadyRows.innerHTML.includes('Jordan Smith'), 'a failed readiness call does not paint a stub roster');
assert.strictEqual(els.payReadyCount.textContent, 'Ready \u2014');

box.mode = 'ace';
calls.length = 0;
const ace = await vm.runInContext('payReadyFetchAce("2026-09-21")', box);
assert.strictEqual(calls.length, 1);
assert.strictEqual(calls[0].name, 'admin_timesheet_pay_readiness');
assert.strictEqual(ace.source, 'ace');
assert.strictEqual(ace.label, '09/21/2026\u201309/27/2026');
assert.strictEqual(ace.rows[0].name, 'Jordan Smith');
assert.strictEqual(ace.rows[0].status, 'held');
assert.strictEqual(ace.rows[0].timesheet_id, 'ts-js');

box.payReadyState = mixed;
box.payReadyView = 'list';
els.payReadyExport.hidden = true;
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payReadyCount.textContent, 'Ready 12');
assert.strictEqual(els.payHeldCount.textContent, 'Held 4');
assert.strictEqual(els.payReadyWeek.textContent, 'Week of 09/21/2026\u201309/27/2026');
assert.strictEqual(els.payReadyTitle.hidden, true);
assert.strictEqual(els.payReadyEmpty.hidden, true);
assert.strictEqual(els.payReadyExport.hidden, false, 'export stays visible when ready and held');
assert.ok(els.payReadyRows.innerHTML.includes('Held') && els.payReadyRows.innerHTML.includes('Ready'));

vm.runInContext('payReadyOpenDetail("ts-js")', box);
assert.strictEqual(els.payReadyDetail.hidden, false);
assert.strictEqual(els.payReadyListView.hidden, true);
assert.strictEqual(els.payDetailName.textContent, 'Jordan Smith');
assert.strictEqual(els.payDetailBanner.textContent, 'Held \u2014 missing signature');
assert.ok(els.payDetailChecks.innerHTML.includes('Save Day complete'));
assert.ok(els.payDetailChecks.innerHTML.includes('Office review'));

box.mode = 'hold';
calls.length = 0;
await vm.runInContext('payReadyHold()', box);
const holdCall = calls.filter(function(c){return c.name==='admin_set_timesheet_pay_hold';})[0];
assert.ok(holdCall, 'Hold pay calls admin_set_timesheet_pay_hold');
assert.deepStrictEqual(holdCall.body, {p_timesheet_id:'ts-js', p_hold:true});

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

box.mode = 'export';
box.exportData = {columns:['Aide','Client','Week','Readiness','gross'], rows:[['Maya Brooks','Ruth Coleman','09/21/2026\u201309/27/2026','ready','240']]};
calls.length = 0;
const exported = await vm.runInContext('payReadyExport()', box);
assert.strictEqual(calls[0].name, 'admin_timesheet_pay_export');
assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});
assert.strictEqual(exported.split('\n')[0], 'Aide,Client,Week,Readiness');
assert.ok(!/240|gross|\$/.test(exported), 'downloaded ready list is not a payroll file');
assert.ok(box.downloaded.indexOf('EverCare_Ready_List_')===0, box.downloaded);

console.log('admin-payready1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
