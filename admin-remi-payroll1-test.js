#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-payroll1'), 'remi-payroll1 marker');
assert.ok(html.includes('data-remi-payroll1="v=remi-payroll1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-payroll1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'meta');
assert.ok(html.includes('<!-- remi payroll 2026-09-27 v=remi-payroll1 admin-build 2026-09-27-remi-payroll1'), 'comment');
assert.ok(html.includes("var REMI_PAYROLL1_MARKER='v=remi-payroll1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-PAYROLL1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-sched-time-tap1'), 'first admin-build is remi-payroll1');
assert.ok(html.indexOf('content="2026-09-27-remi-payroll1"') < html.indexOf('content="2026-09-27-remi-ideas763"'), 'ideas763 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-remi-ideas763"') < html.indexOf('content="2026-09-27-remi-float-noshow1"'), 'float stays after ideas763');
assert.ok(html.indexOf('content="2026-09-27-remi-float-noshow1"') < html.indexOf('content="2026-09-27-remi-proof1"'), 'proof stays');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'sched stays');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'rules stays');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis stays');
['v=remi-float-noshow1','v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=coverage-simple1','v=remi-ideas763'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');

const start = html.indexOf('// remi payroll1 v=remi-payroll1');
const end = html.indexOf('// end remi payroll1 v=remi-payroll1');
assert.ok(start > 0 && end > start, 'payroll script block');
const src = html.slice(start, end);
['admin_parse_remi_payroll_range','admin_set_remi_payroll_range_prefs','admin_get_remi_payroll_report','admin_export_remi_payroll_csv','admin_export_remi_payroll_pdf','admin_export_remi_payroll','admin_run_remi_payroll_report'].forEach(function(name){
  assert.ok(src.includes(name), name);
});
assert.ok(src.includes('p_start_date') && src.includes('p_end_date') && src.includes('p_text'), 'range params');
assert.ok(src.includes('is_scheduler_office'), 'office gate');
assert.ok(src.includes('sbRestRpc'), 'office JWT');
assert.ok(src.includes('42501'), 'nurse 42501');
assert.ok(!/hrs paid/i.test(src), 'summary never says hrs paid');
assert.ok(!/not paid/i.test(src), 'flags never say not paid');
assert.ok(!/\bQuo\b|twilio|send_sms|sms:/.test(src), 'no Quo or SMS');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!src.includes('admin_why_open') && !src.includes('remiIdeas763'), 'does not depend on ideas763');
assert.ok(src.includes('DATE') === false || src.includes('>Date<'), 'date column');
assert.ok(src.includes('>Date</th>') && src.includes('>Client</th>') && src.includes('>In</th>') && src.includes('>Out</th>') && src.includes('>Hours</th>'), 'DATE CLIENT IN OUT HOURS');
assert.ok(src.includes('covered for '), 'covers name the permanent aide');
assert.ok(src.includes('always visible'), 'covers stay visible');
assert.ok(src.includes('Aide chat'), 'chase stays in aide chat');

const schedStart = html.indexOf('// remi sched1 v=remi-sched1');
const schedEnd = html.indexOf('// end remi sched1 v=remi-sched1');
const schedSrc = html.slice(schedStart, schedEnd);
assert.ok(schedSrc.includes('p_recurrence') && schedSrc.includes('p_interval_days') && schedSrc.includes('p_anchor_date') && schedSrc.includes('p_range_prefs'), 'sched create/update accepts biweekly fields');
assert.ok(schedSrc.includes("payroll_report:'payroll_report'"), 'payroll_report kind');
assert.ok(schedSrc.includes("out.anchor_date='2026-09-23'"), 'payroll anchor is Wed 09/23');
assert.ok(!/out\.anchor_date='2026-09-24'/.test(schedSrc), 'payroll anchor is never Thu 09/24');
assert.ok(src.includes("REMI_PAYROLL1_ANCHOR='2026-09-23'"), 'anchor constant');
assert.ok(src.includes("REMI_PAYROLL1_NEXT='2026-10-07T12:00:00+00:00'"), 'next run constant');
assert.ok(!/sbRestRpc\(\s*['"]list_due_remi_scheduled_jobs['"]/.test(schedSrc), 'list_due stays off the desk');

const DOT = '\u00B7';
const LABEL = 'Every other Wednesday '+DOT+' 8:00 AM ET '+DOT+' payroll report in Remi rail';
const PDF_B64 = Buffer.from('%PDF-1.4\n').toString('base64');

function row(date, client, inn, out, hours, extra){
  extra = extra || {};
  return Object.assign({date:date, on_date:date, client_name:client, 'in':inn, out:out, hours:hours, is_flag:false, deep_link:{surface:'timesheets', timesheet_id:'ts-'+date+'-'+client.replace(/\s/g,''), on_date:date}}, extra);
}
function cover(date, client, inn, out, hours, who){
  return row(date, client, inn, out, hours, {is_cover:true, covered_for:who});
}
const REPORT = {
  success:true,
  marker:'remi-payroll1',
  v:'remi-payroll1',
  start_date:'2026-09-14',
  end_date:'2026-09-27',
  start_date_display:'09/14/2026',
  end_date_display:'09/27/2026',
  stats:{aides:8, paid_shifts:35, paid_hours:236.39, covers:7, flags:3},
  job:{
    job_key:'payroll_report',
    recurrence:'biweekly',
    schedule_label:LABEL,
    next_run_at:'2026-10-07T12:00:00+00:00',
    anchor_date:'2026-09-23',
    interval_days:14
  },
  aides:[
    {aide_id:'devon', aide_name:'Devon', permanent_client_name:'Helen Park', summary_line:'Devon '+DOT+' Helen Park '+DOT+' 36.15', paid_hours:40.20, regulars:[row('2026-09-14','Helen Park','8:01 AM','4:03 PM',8.03), row('2026-09-17','Helen Park','8:02 AM','12:05 PM',4.05,{same_day:true, slot_label:'scheduled 8:00 – 12:00'})], covers:[cover('2026-09-17','Bowlax','1:01 PM','5:04 PM',4.05,'Lina')], flags:[]},
    {aide_id:'maria', aide_name:'Maria', permanent_client_name:'Rivera', summary_line:'Maria '+DOT+' Rivera '+DOT+' 24.00', paid_hours:28.00, regulars:[row('2026-09-15','Rivera','8:05 AM','4:05 PM',8.00)], covers:[cover('2026-09-19','Helen Park','9:00 AM','1:00 PM',4.00,'Devon')], flags:[{flag_label:'Flag '+DOT+' unsigned', missing_reason:'In/Out missing', on_date:'2026-09-22', client_name:'Rivera', is_flag:true, deep_link:{surface:'timesheets', timesheet_id:'ts-maria-unsigned', on_date:'2026-09-22'}}]},
    {aide_id:'lina', aide_name:'Lina', permanent_client_name:'Bowlax', summary_line:'Lina '+DOT+' Bowlax '+DOT+' 12.05', paid_hours:16.05, regulars:[row('2026-09-14','Bowlax','8:00 AM','4:03 PM',8.05), row('2026-09-17','Bowlax','','',null,{is_cancel:true, cancel_note:'cancelled'})], covers:[cover('2026-09-23','Rivera','1:00 PM','5:00 PM',4.00,'Maria')], flags:[{flag_label:'Flag '+DOT+' missing', missing_reason:'timesheet missing', on_date:'2026-09-21', client_name:'Bowlax', is_flag:true, deep_link:{surface:'timesheets', timesheet_id:'ts-lina-missing', on_date:'2026-09-21'}}]},
    {aide_id:'jamal', aide_name:'Jamal', permanent_client_name:'Torres', summary_line:'Jamal '+DOT+' Torres '+DOT+' 32.00', paid_hours:36.00, regulars:[row('2026-09-14','Torres','8:00 AM','4:00 PM',8.00)], covers:[cover('2026-09-24','Nguyen','9:00 AM','1:00 PM',4.00,'Keisha')], flags:[]},
    {aide_id:'keisha', aide_name:'Keisha', permanent_client_name:'Nguyen', summary_line:'Keisha '+DOT+' Nguyen '+DOT+' 28.05', paid_hours:32.05, regulars:[row('2026-09-15','Nguyen','8:00 AM','4:00 PM',8.00), row('2026-09-25','Nguyen','8:00 AM','12:00 PM',4.00)], covers:[cover('2026-09-26','Torres','10:00 AM','2:00 PM',4.00,'Jamal')], flags:[{flag_label:'Flag '+DOT+' unsigned', missing_reason:'In/Out missing', on_date:'2026-09-22', client_name:'Nguyen', is_flag:true, deep_link:{surface:'timesheets', timesheet_id:'ts-keisha-unsigned', on_date:'2026-09-22'}}]},
    {aide_id:'omar', aide_name:'Omar', permanent_client_name:'Brooks', summary_line:'Omar '+DOT+' Brooks '+DOT+' 20.00', paid_hours:20.00, regulars:[row('2026-09-14','Brooks','8:05 AM','4:05 PM',8.00)], covers:[], flags:[]},
    {aide_id:'priya', aide_name:'Priya', permanent_client_name:'Castillo', summary_line:'Priya '+DOT+' Castillo '+DOT+' 16.00', paid_hours:24.00, regulars:[row('2026-09-15','Castillo','8:00 AM','4:00 PM',8.00)], covers:[cover('2026-09-23','Brooks','1:00 PM','5:00 PM',4.00,'Omar'), cover('2026-09-26','Whitfield','9:00 AM','1:00 PM',4.00,'Andre')], flags:[]},
    {aide_id:'andre', aide_name:'Andre', permanent_client_name:'Whitfield', summary_line:'Andre '+DOT+' Whitfield '+DOT+' 40.00', paid_hours:40.00, regulars:[row('2026-09-14','Whitfield','8:00 AM','4:00 PM',8.00)], covers:[], flags:[]}
  ]
};
const PAY_JOB = {
  id:'pay1', title:'Payroll report', kind:'payroll_report', job_key:'payroll_report', is_on:true, weekday:'wed', local_time:'08:00',
  recurrence:'biweekly', interval_days:14, anchor_date:'2026-09-23', sort_order:5,
  schedule_label:LABEL, next_run_at:'2026-10-07T12:00:00+00:00'
};

function runSlice(){
  const sandbox = {currentAdminRole:'Admin', copilotView:'payroll', console:console, atob:function(s){return Buffer.from(s,'base64').toString('binary');}, Uint8Array:Uint8Array};
  vm.createContext(sandbox);
  vm.runInContext(schedSrc + '\n' + src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_PAYROLL1_MARKER, 'v=remi-payroll1');
  assert.strictEqual(sandbox.REMI_PAYROLL1_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.REMI_PAYROLL1_ANCHOR, '2026-09-23');
  const next = sandbox.remiPayroll1FormatNext('2026-10-07T12:00:00+00:00');
  assert.ok(next.indexOf('Wed') === 0, next);
  assert.ok(next.indexOf('10/07/2026') >= 0, next);
  assert.ok(next.indexOf('10/08') < 0, next);
  const coerced = sandbox.remiPayroll1NextText({next_run_at:'2026-10-08T12:00:00+00:00', next_run_label:'Thu 10/08/2026 8:00 AM ET', anchor_date:'2026-09-24'});
  assert.ok(coerced.indexOf('Wed') === 0 && coerced.indexOf('10/07/2026') >= 0, coerced);
  assert.strictEqual(sandbox.remiPayroll1AnchorIso('2026-09-24'), '2026-09-23');
  assert.ok(/8:00\s*AM/i.test(next), next);
  assert.ok(next.indexOf('ET') >= 0, next);

  const parsed = sandbox.remiSched1Parse('every other Wednesday at 8:00 AM payroll report');
  assert.strictEqual(parsed.kind, 'payroll_report');
  assert.strictEqual(parsed.weekday, 'wed');
  assert.strictEqual(parsed.local_time, '08:00');
  assert.strictEqual(parsed.recurrence, 'biweekly');
  assert.strictEqual(parsed.interval_days, 14);
  assert.strictEqual(parsed.anchor_date, '2026-09-23');
  assert.strictEqual(parsed.summary, LABEL);
  const body = sandbox.remiSched1CreateBody(parsed);
  assert.strictEqual(body.p_kind, 'payroll_report');
  assert.strictEqual(body.p_job_key, 'payroll_report');
  assert.strictEqual(body.p_recurrence, 'biweekly');
  assert.strictEqual(body.p_interval_days, 14);
  assert.strictEqual(body.p_anchor_date, '2026-09-23');
  assert.strictEqual(body.p_weekday, 'wed');
  assert.strictEqual(body.p_local_time, '08:00');
  const weekly = sandbox.remiSched1Parse('Hey Remi \u2014 every Monday at 9 give me the missing hours report.');
  assert.strictEqual(weekly.kind, 'missing_hours_report');
  assert.ok(!weekly.recurrence, 'weekly missing-hours stays weekly');
  const weeklyBody = sandbox.remiSched1CreateBody(weekly);
  assert.ok(!Object.prototype.hasOwnProperty.call(weeklyBody, 'p_recurrence'));
  assert.ok(!Object.prototype.hasOwnProperty.call(weeklyBody, 'p_anchor_date'));
  assert.strictEqual(sandbox.remiPayroll1IsRangeAsk('every other Wednesday at 8:00 AM payroll report'), false);
  assert.strictEqual(sandbox.remiPayroll1IsRangeAsk('Sep 13\u201327'), true);
  assert.strictEqual(sandbox.remiPayroll1IsRangeAsk('last week'), true);
  assert.strictEqual(sandbox.remiPayroll1IsRangeAsk('run payroll'), true);
  assert.ok(sandbox.remiPayroll1FromAsk('last 2 weeks'), 'last 2 weeks confirms a range');

  sandbox.remiPayroll1Report = REPORT;
  sandbox.remiPayroll1Job = REPORT.job;
  sandbox.remiPayroll1Start = '2026-09-14';
  sandbox.remiPayroll1End = '2026-09-27';
  sandbox.remiPayroll1OpenMap = {};
  const collapsed = sandbox.remiPayroll1ReportHtml();
  assert.ok(collapsed.indexOf('Devon '+DOT+' Helen Park '+DOT+' 36.15') >= 0, collapsed);
  assert.ok(collapsed.indexOf('Maria '+DOT+' Rivera '+DOT+' 24.00') >= 0, 'maria summary');
  assert.ok(collapsed.indexOf('Lina '+DOT+' Bowlax '+DOT+' 12.05') >= 0, 'lina summary');
  assert.ok(collapsed.indexOf('Keisha '+DOT+' Nguyen '+DOT+' 28.05') >= 0, 'keisha summary');
  assert.ok(collapsed.indexOf('236.39') >= 0, 'paid hours number');
  assert.ok(collapsed.indexOf('Flag '+DOT+' missing') >= 0, 'missing flag');
  assert.ok(collapsed.indexOf('Flag '+DOT+' unsigned') >= 0, 'unsigned flag');
  assert.ok(collapsed.indexOf('covered for Lina') >= 0, 'cover line');
  assert.ok(collapsed.indexOf('always visible') >= 0, 'covers header');
  assert.ok(collapsed.indexOf('none this period') >= 0, 'empty covers stay');
  assert.ok(!/hrs paid/i.test(collapsed), collapsed);
  assert.ok(!/not paid/i.test(collapsed), collapsed);
  assert.ok(collapsed.indexOf('aria-expanded="false"') >= 0, 'collapsed by default');
  assert.ok(collapsed.indexOf('09/14/2026') >= 0 && collapsed.indexOf('09/27/2026') >= 0, 'MM/DD/YYYY range');
  assert.ok(collapsed.indexOf(LABEL) >= 0, 'biweekly label');
  assert.ok(collapsed.indexOf('Wed 10/07/2026') >= 0, 'next run');
  assert.ok(collapsed.indexOf('Anchor pay day 09/23/2026') >= 0, 'anchor');
  assert.ok(collapsed.indexOf('10/08/2026') < 0, 'next run is never Thu 10/08');

  sandbox.remiPayroll1Toggle('lina');
  sandbox.remiPayroll1Toggle('keisha');
  const open = sandbox.remiPayroll1ReportHtml();
  assert.ok(open.indexOf('data-aide="lina" class="pay-aide open"') >= 0 || open.indexOf('class="pay-aide open"') >= 0, open.slice(0, 200));
  assert.ok(open.indexOf('>Hours</th>') >= 0, 'hours column');
  assert.ok(open.indexOf('8:00 AM') >= 0 && open.indexOf('4:03 PM') >= 0, 'signed in and out');
  assert.ok(!/hrs paid/i.test(open) && !/not paid/i.test(open), 'expanded copy stays clean');

  const downloads = [];
  sandbox.downloadBlob = function(blob, name){downloads.push(name);};
  sandbox.Blob = function(parts, opts){this.parts=parts; this.type=opts&&opts.type;};
  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='admin_parse_remi_payroll_range')return {ok:true, data:{success:true, start_date:'2026-09-13', end_date:'2026-09-27', start_date_display:'09/13/2026', end_date_display:'09/27/2026'}};
    if(name==='admin_set_remi_payroll_range_prefs')return {ok:true, data:{success:true}};
    if(name==='admin_get_remi_payroll_report')return {ok:true, data:REPORT};
    if(name==='admin_run_remi_payroll_report')return {ok:true, data:{success:true, report:REPORT, job:{next_run_at:'2026-10-07T12:00:00+00:00', anchor_date:'2026-09-23', schedule_label:LABEL}, rail_chip:{summary:'Payroll report ready', receipt_id:'rcpt-pay-1', open_label:'Open full proof \u2192'}, receipt:{id:'rcpt-pay-1', chip_summary:'Payroll report ready'}}};
    if(name==='admin_export_remi_payroll_csv')return {ok:true, data:{csv_text:'aide,client,hours\nDevon,Helen Park,36.15\n', filename:'payroll.csv'}};
    if(name==='admin_export_remi_payroll_pdf')return {ok:true, data:{content_base64:PDF_B64, storage_path:'4f97f4d3-6635-4544-904c-6b06aa02d40b/other/pay.pdf', filename:'payroll.pdf'}};
    if(name==='admin_export_remi_payroll')return {ok:true, data:{csv_text:'both\n', filename:'both.csv', content_base64:PDF_B64, storage_path:'4f97f4d3-6635-4544-904c-6b06aa02d40b/other/both.pdf'}};
    if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{jobs:[PAY_JOB]}};
    if(name==='admin_update_remi_scheduled_job')return {ok:true, data:{success:true}};
    return {ok:false, error:'unexpected '+name};
  };
  sandbox.copilotChat = [];
  sandbox.copilotView = 'chat';
  sandbox.copilotPaintChat = function(){};
  const ask = sandbox.remiPayroll1FromAsk('Sep 13\u201327');
  sandbox.copilotChat.push({role:'remi', text:ask.text, payroll:ask.payroll, payrollQuery:'Sep 13\u201327'});
  const looked = await sandbox.remiPayroll1Lookup(0);
  assert.strictEqual(looked.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_parse_remi_payroll_range');
  assert.strictEqual(rpc[0].body.p_text, 'Sep 13\u201327');
  assert.strictEqual(sandbox.copilotChat[0].payroll.draft.start_date, '2026-09-13');
  assert.strictEqual(sandbox.copilotChat[0].payroll.draft.start_date_display, '09/13/2026');
  rpc.length = 0;
  const confirmed = await sandbox.remiPayroll1Confirm(0);
  assert.strictEqual(confirmed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_set_remi_payroll_range_prefs');
  assert.strictEqual(rpc[0].body.p_start_date, '2026-09-13');
  assert.strictEqual(rpc[0].body.p_end_date, '2026-09-27');
  assert.strictEqual(rpc[1].name, 'admin_get_remi_payroll_report');
  assert.strictEqual(rpc[1].body.p_start_date, '2026-09-13');
  assert.strictEqual(sandbox.copilotView, 'payroll');

  rpc.length = 0;
  downloads.length = 0;
  const csv = await sandbox.remiPayroll1Export('csv');
  assert.strictEqual(csv.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_export_remi_payroll_csv');
  assert.ok(downloads.indexOf('payroll.csv') >= 0, downloads.join(','));
  rpc.length = 0;
  const pdf = await sandbox.remiPayroll1Export('pdf');
  assert.strictEqual(pdf.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_export_remi_payroll_pdf');
  const bytes = sandbox.remiPayroll1PdfBytes(PDF_B64);
  assert.strictEqual(sandbox.remiPayroll1IsPdf(bytes), true);
  rpc.length = 0;
  const both = await sandbox.remiPayroll1Export('both');
  assert.strictEqual(both.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_export_remi_payroll');
  rpc.length = 0;
  sandbox.copilotChat = [];
  const ran = await sandbox.remiPayroll1Run();
  assert.strictEqual(ran.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_run_remi_payroll_report');
  assert.strictEqual(sandbox.remiPayroll1Chip.receipt_id, 'rcpt-pay-1');
  assert.ok(sandbox.copilotChat.some(function(msg){return msg.proof && msg.proof.receipt_id==='rcpt-pay-1';}), 'rail chip');

  sandbox.remiSched1Cache = [PAY_JOB];
  sandbox.document = {getElementById:function(id){
    if(id==='remiSched1JobWeek')return {value:'wed'};
    if(id==='remiSched1JobClock')return {value:'08:00'};
    return null;
  }};
  rpc.length = 0;
  const timed = await sandbox.remiSched1SaveTime('pay1');
  assert.strictEqual(timed.ok, true);
  assert.strictEqual(rpc[0].body.p_recurrence, 'biweekly');
  assert.strictEqual(rpc[0].body.p_interval_days, 14);
  assert.strictEqual(rpc[0].body.p_anchor_date, '2026-09-23');
  sandbox.remiSched1Cache = [Object.assign({}, PAY_JOB, {anchor_date:'2026-09-24', next_run_at:'2026-10-08T12:00:00+00:00'})];
  rpc.length = 0;
  const staleSave = await sandbox.remiSched1SaveTime('pay1');
  assert.strictEqual(staleSave.ok, true);
  assert.strictEqual(rpc[0].body.p_anchor_date, '2026-09-23');
  assert.strictEqual(rpc[0].body.p_weekday, 'wed');
  assert.strictEqual(rpc[0].body.p_local_time, '08:00');

  const card = sandbox.remiSched1JobHtml(PAY_JOB);
  assert.ok(card.indexOf('Payroll report') >= 0, card);
  assert.ok(card.indexOf(LABEL) >= 0, card);
  assert.ok(card.indexOf('Wed 10/07/2026') >= 0, card);
  assert.ok(card.indexOf('09/23/2026') >= 0, card);
  assert.ok(card.indexOf('10/08') < 0 && card.indexOf('09/24') < 0, card);
  assert.ok(card.indexOf('>On<') >= 0, card);
  assert.ok(!/hrs paid/i.test(card) && !/not paid/i.test(card));

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  assert.strictEqual(sandbox.remiPayroll1FromAsk('run payroll'), null);
  const nurse = await sandbox.remiPayroll1Rpc('admin_get_remi_payroll_report', {});
  assert.strictEqual(nurse.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse does not call Ace');
  sandbox.currentAdminRole = 'Admin';
  sandbox.sbRestRpc = async function(){return {ok:false, status:42501, error:'42501 insufficient_privilege'};};
  const denied = await sandbox.remiPayroll1Rpc('admin_get_remi_payroll_report', {});
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(denied.status, 42501);

  console.log('admin-remi-payroll1 unit ok');
  await runBrowser();
})().catch(function(err){
  console.error(err);
  process.exit(1);
});

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-payroll1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.PAYROLL1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  const errors = [];
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({role:'Admin', username:'mo@evercare.test', name:'Mo', loginAt:Date.now()}));
    });
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-payroll1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#copilotFab', {timeout:10000});
    await page.evaluate(async function(pack){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__rpc = [];
      window.__report = pack.report;
      window.__jobs = pack.jobs;
      sbRestRpc = async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{success:true, jobs:window.__jobs}};
        if(name==='admin_get_remi_payroll_report')return {ok:true, data:window.__report};
        if(name==='admin_run_remi_payroll_report')return {ok:true, data:{success:true, report:window.__report, job:window.__report.job, rail_chip:{summary:'Payroll report ready', receipt_id:'rcpt-pay-1', open_label:'Open full proof'}, receipt:{id:'rcpt-pay-1', chip_summary:'Payroll report ready'}}};
        if(name==='admin_export_remi_payroll')return {ok:true, data:{csv_text:'aide,hours\n', filename:'payroll.csv', content_base64:pack.pdf, storage_path:'org/other/pay.pdf'}};
        if(name==='admin_export_remi_payroll_csv')return {ok:true, data:{csv_text:'aide,hours\n', filename:'payroll.csv'}};
        if(name==='admin_export_remi_payroll_pdf')return {ok:true, data:{content_base64:pack.pdf, storage_path:'org/other/pay.pdf'}};
        if(name==='admin_parse_remi_payroll_range')return {ok:true, data:{success:true, start_date:'2026-09-13', end_date:'2026-09-27', start_date_display:'09/13/2026', end_date_display:'09/27/2026'}};
        if(name==='admin_set_remi_payroll_range_prefs')return {ok:true, data:{success:true}};
        return {ok:false, error:'unexpected '+name};
      };
      remiSched1Show();
      await remiSched1Load();
    }, {report:REPORT, jobs:[PAY_JOB], pdf:PDF_B64});
    const schedView = await page.evaluate(function(){
      var body = document.getElementById('copilotBody');
      var sheet = document.getElementById('copilotSheet');
      return {
        text: body.innerText,
        fullPage: !!document.getElementById('tab_remi'),
        selected: document.getElementById('copilotTabSched').getAttribute('aria-selected'),
        hidden: sheet.hidden,
        first: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(schedView.first, '2026-09-27-sched-time-tap1');
    assert.strictEqual(schedView.fullPage, false);
    assert.strictEqual(schedView.hidden, false);
    assert.strictEqual(schedView.selected, 'true');
    assert.ok(schedView.text.indexOf('Payroll report') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('Every other Wednesday') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('Wed 10/07/2026') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('09/23/2026') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('10/08') < 0 && schedView.text.indexOf('09/24') < 0, schedView.text);
    assert.ok(!/hrs paid/i.test(schedView.text) && !/not paid/i.test(schedView.text), schedView.text);
    await page.screenshot({path:path.join(shotDir, 'remi-payroll1-phone-scheduled.png')});

    await page.evaluate(async function(){
      await remiPayroll1Show();
    });
    const collapsed = await page.evaluate(function(){
      var text = document.getElementById('copilotBody').innerText;
      var open = document.querySelectorAll('.pay-aide.open').length;
      var names = window.__rpc.map(function(row){return row.name;});
      return {text:text, open:open, names:names, view:copilotView};
    });
    assert.strictEqual(collapsed.view, 'payroll');
    assert.strictEqual(collapsed.open, 0, 'aides start collapsed');
    assert.ok(collapsed.names.indexOf('admin_get_remi_payroll_report') >= 0, collapsed.names.join(','));
    assert.ok(collapsed.text.indexOf('Devon') >= 0 && collapsed.text.indexOf('Helen Park') >= 0 && collapsed.text.indexOf('36.15') >= 0, collapsed.text);
    assert.ok(collapsed.text.indexOf('236.39') >= 0, collapsed.text);
    assert.ok(collapsed.text.indexOf('Flag') >= 0, collapsed.text);
    assert.ok(collapsed.text.indexOf('covered for') >= 0, collapsed.text);
    assert.ok(!/hrs paid/i.test(collapsed.text) && !/not paid/i.test(collapsed.text), collapsed.text);
    await page.screenshot({path:path.join(shotDir, 'remi-payroll1-phone-collapsed.png')});

    await page.evaluate(function(){
      remiPayroll1Toggle('lina');
      remiPayroll1Toggle('keisha');
      var lina = document.querySelector('[data-aide="lina"]');
      if(lina)lina.scrollIntoView({block:'start'});
    });
    const expanded = await page.evaluate(function(){
      var lina = document.querySelector('[data-aide="lina"]');
      var keisha = document.querySelector('[data-aide="keisha"]');
      return {
        lina: lina ? lina.innerText : '',
        keisha: keisha ? keisha.innerText : '',
        linaOpen: lina && lina.classList.contains('open'),
        keishaOpen: keisha && keisha.classList.contains('open')
      };
    });
    assert.strictEqual(expanded.linaOpen, true);
    assert.strictEqual(expanded.keishaOpen, true);
    assert.ok(expanded.lina.indexOf('Bowlax') >= 0, expanded.lina);
    assert.ok(expanded.lina.indexOf('8:00 AM') >= 0 && expanded.lina.indexOf('4:03 PM') >= 0, expanded.lina);
    assert.ok(expanded.lina.indexOf('Flag') >= 0, expanded.lina);
    assert.ok(expanded.lina.indexOf('covered for Maria') >= 0, expanded.lina);
    assert.ok(expanded.keisha.indexOf('Nguyen') >= 0 && expanded.keisha.indexOf('covered for Jamal') >= 0, expanded.keisha);
    assert.ok(!/hrs paid|not paid/i.test(expanded.lina+' '+expanded.keisha));
    await page.screenshot({path:path.join(shotDir, 'remi-payroll1-phone-lina-keisha.png')});

    const desk = await browser.newPage();
    desk.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await desk.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await desk.setRequestInterception(true);
    desk.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await desk.goto('http://127.0.0.1:'+port+'/index.html?v=remi-payroll1', {waitUntil:'domcontentloaded', timeout:20000});
    await desk.evaluate(async function(pack){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      sbRestRpc = async function(name, body){
        if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{success:true, jobs:pack.jobs}};
        if(name==='admin_get_remi_payroll_report')return {ok:true, data:pack.report};
        return {ok:true, data:{success:true}};
      };
      await remiPayroll1Show();
    }, {report:REPORT, jobs:[PAY_JOB]});
    const deskView = await desk.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      return {
        text: document.getElementById('copilotBody').innerText,
        right: Math.round(box.right),
        width: Math.round(box.width),
        fullPage: !!document.getElementById('tab_remi'),
        view: window.innerWidth
      };
    });
    assert.strictEqual(deskView.fullPage, false);
    assert.ok(deskView.width <= 460, 'rail width '+deskView.width);
    assert.ok(deskView.right >= deskView.view - 2, 'rail sits on the right '+deskView.right);
    assert.ok(deskView.text.indexOf('Payroll report') >= 0, deskView.text);
    assert.ok(deskView.text.indexOf('36.15') >= 0, deskView.text);
    await desk.screenshot({path:path.join(shotDir, 'remi-payroll1-desktop-report.png')});
    await desk.evaluate(async function(){remiSched1Show(); await remiSched1Load();});
    const deskSched = await desk.evaluate(function(){
      return document.getElementById('copilotBody').innerText;
    });
    assert.ok(deskSched.indexOf('Every other Wednesday') >= 0, deskSched);
    assert.ok(deskSched.indexOf('Wed 10/07/2026') >= 0, deskSched);
    assert.ok(deskSched.indexOf('09/23/2026') >= 0, deskSched);
    assert.ok(deskSched.indexOf('10/08') < 0 && deskSched.indexOf('09/24') < 0, deskSched);
    await desk.screenshot({path:path.join(shotDir, 'remi-payroll1-desktop-scheduled.png')});
    assert.ok(!errors.some(function(e){return /remiPayroll|SyntaxError/.test(e);}), errors.join('\n'));
    console.log('admin-remi-payroll1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
