#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-payroll-ins1'), 'remi-payroll-ins1 marker');
assert.ok(html.includes('data-remi-payroll-ins1="v=remi-payroll-ins1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-28-remi-payroll-ins1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-remi-payroll-ins1">'), 'meta');
assert.ok(html.includes('<!-- remi payroll insurance 2026-09-28 v=remi-payroll-ins1 admin-build 2026-09-28-remi-payroll-ins1'), 'comment');
assert.ok(html.includes("var REMI_PAYROLL_INS1_MARKER='v=remi-payroll-ins1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-PAYROLL-INS1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE'), 'Ace CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.indexOf('<!-- remi payroll 2026-09-27 v=remi-payroll1 admin-build 2026-09-27-remi-payroll1') < html.indexOf('<!-- remi payroll insurance 2026-09-28 v=remi-payroll-ins1'), 'ins1 comment follows remi-payroll1');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
['v=remi-payroll1','v=remi-float-hide1b','v=remi-phone-rail1','v=remi-chat-bleed1','v=client-ins1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-hide1b">'), 'float-hide1b meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-phone-rail1">'), 'phone rail meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-chat-bleed1">'), 'chat bleed meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-client-ins1">'), 'client-ins1 meta stays');
assert.ok(html.includes('id="isComplianceSelectAllBtn"') && html.includes('id="isComplianceUnselectAllBtn"'), 'Select all and Unselect all stay a pair');

const pageAt = html.indexOf('id="tab_payroll"');
const sheetAt = html.indexOf('id="copilotSheet"');
assert.ok(pageAt > 0 && sheetAt > pageAt, 'payroll own page is outside the Remi rail');
const pageTag = html.slice(pageAt - 120, pageAt + 280);
assert.ok(pageTag.includes('data-layout-roles="Admin"'), 'payroll page is Admin only');
assert.ok(pageTag.includes('data-surface="own-page"'), 'own page surface');
assert.ok(!/Scheduler/.test(pageTag), 'payroll page does not include Scheduler');
const navAt = html.indexOf('id="nav_payroll"');
const navTag = html.slice(navAt - 220, navAt + 40);
assert.ok(navTag.includes('data-layout-roles="Admin"'), 'payroll nav is Admin only');
assert.ok(!/Scheduler/.test(navTag), 'payroll nav does not include Scheduler');
assert.ok(html.includes('>All</button>') && html.includes('>CareSource</button>') && html.includes('>Passport</button>') && html.includes('>Other</button>'), 'chip labels');
assert.ok(html.includes('Own page · no Remi rail') || html.includes('Own page \u00b7 no Remi rail'), 'own page label');
assert.ok(html.includes('onclick="remiPayrollIns1FromRail()"'), 'Payroll tab opens the ins1 entry');
assert.ok(html.includes('id="remiPayrollIns1Host"'), 'page host');
assert.ok(!html.slice(sheetAt, html.indexOf('id="copilotCloseBtn"')).includes('id="tab_payroll"'), 'rail markup is not the payroll page');

const payStart = html.indexOf('// remi payroll1 v=remi-payroll1');
const payEnd = html.indexOf('// end remi payroll1 v=remi-payroll1');
const paySrc = html.slice(payStart, payEnd);
assert.ok(paySrc.includes('p_insurance_plan'), 'date body can pass p_insurance_plan');
assert.ok(paySrc.includes('remiPayroll1DateBody()'), 'get report uses the date body');
assert.ok(paySrc.includes('admin_export_remi_payroll_csv') && paySrc.includes('admin_export_remi_payroll_pdf') && paySrc.includes('admin_export_remi_payroll') && paySrc.includes('admin_run_remi_payroll_report'), 'export and run stay');

const start = html.indexOf('// remi payroll ins1 v=remi-payroll-ins1');
const end = html.indexOf('// end remi payroll ins1 v=remi-payroll-ins1');
assert.ok(start > payEnd && end > start, 'ins1 script block follows payroll1');
const src = html.slice(start, end);
['admin_list_remi_payroll_insurance_chips','admin_get_remi_payroll_report','p_insurance_plan','CareSource','Passport','Other','#6B2D8B','#E6B800','#6b7a90'].forEach(function(bit){
  assert.ok(src.includes(bit), bit);
});
assert.ok(/not inside #copilotSheet/i.test(src), 'own page is not the rail');
assert.ok(src.includes('OWN PAGE'), 'own page claim');
assert.ok(src.includes('remiPayrollIns1Host'), 'paints into the page host');
assert.ok(!src.includes('copilotBody.innerHTML'), 'does not paint the desktop report into the Remi rail');
assert.ok(!/desktop report stays in the Remi rail/i.test(src), 'no Remi-rail-as-report claim');
assert.ok(src.includes('\\u2190 All insurers'), 'clear path back to All insurers');
assert.ok(src.includes('Open full report'), 'open full report');
assert.ok(src.includes("role.toLowerCase()==='admin'"), 'Admin-only gate');
assert.ok(src.includes('function remiPayrollIns1ApplyRoleGate'), 'Scheduler role gate');
assert.ok(!/\bQuo\b|twilio|send_sms|mossier|reset_aide_temp_password|admin_set_role_password/.test(src), 'no Auth reseal and no Quo/SMS');
assert.ok(src.includes('is_scheduler_office') === false, 'ins1 gate is not the scheduler office check');
assert.ok(html.includes('#tab_payroll[hidden]{display:none !important;}'), 'hidden payroll page cannot stay on screen');
assert.ok(html.includes('#nav_payroll[hidden],#remiPayrollIns1TimesheetsOpen[hidden]{display:none !important;}'), 'hidden payroll entry points stay hidden');
assert.ok(html.includes("el.classList.remove('active')"), 'forbidden tab panels lose .active');
assert.ok(html.includes("showTab('timesheets')"), 'a forbidden active desk returns home');

const DOT = '\u00B7';
const REPORT = {
  success:true,
  marker:'remi-payroll-ins1',
  v:'remi-payroll-ins1',
  start_date:'2026-09-14',
  end_date:'2026-09-27',
  start_date_display:'09/14/2026',
  end_date_display:'09/27/2026',
  insurance_plan:'all',
  insurance_label:'All',
  insurance_color:null,
  insurers_in_range:[
    {key:'all', label:'All', color:null, count:3},
    {key:'caresource', label:'CareSource', color:'#6B2D8B', count:1},
    {key:'passport', label:'Passport', color:'#E6B800', count:1},
    {key:'other', label:'Other', color:'#6b7a90', count:1}
  ],
  stats:{aides:3, paid_shifts:3, paid_hours:72.30, covers:0, flags:0},
  aides:[
    {aide_id:'devon', aide_name:'Devon', permanent_client_name:'Helen Park', summary_line:'Devon '+DOT+' Helen Park '+DOT+' 36.20', paid_hours:36.20, insurance_plan:'caresource', insurance_label:'CareSource', insurance_color:'#6B2D8B', insurance_bucket:'caresource', regulars:[], covers:[], flags:[]},
    {aide_id:'maria', aide_name:'Maria', permanent_client_name:'Rivera', summary_line:'Maria '+DOT+' Rivera '+DOT+' 24.00', paid_hours:24.00, insurance_plan:'passport', insurance_label:'Passport', insurance_color:'#E6B800', insurance_bucket:'passport', regulars:[], covers:[], flags:[]},
    {aide_id:'lina', aide_name:'Lina', permanent_client_name:'Bowlax', summary_line:'Lina '+DOT+' Bowlax '+DOT+' 12.10', paid_hours:12.10, insurance_plan:null, insurance_label:'Other', insurance_color:'#6b7a90', insurance_bucket:'other', regulars:[], covers:[], flags:[]}
  ]
};
const CARE = {
  success:true,
  marker:'remi-payroll-ins1',
  v:'remi-payroll-ins1',
  start_date:'2026-09-14',
  end_date:'2026-09-27',
  start_date_display:'09/14/2026',
  end_date_display:'09/27/2026',
  insurance_plan:'caresource',
  insurance_label:'CareSource',
  insurance_color:'#6B2D8B',
  insurers_in_range:REPORT.insurers_in_range,
  stats:{aides:1, paid_hours:36.20, covers:0, flags:0},
  aides:[REPORT.aides[0]]
};

function runSlice(){
  const sandbox = {
    currentAdminRole:'Admin',
    copilotView:'payroll',
    console:console,
    remiPayrollIns1_shown:null
  };
  vm.createContext(sandbox);
  vm.runInContext(paySrc + '\n' + src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_PAYROLL_INS1_MARKER, 'v=remi-payroll-ins1');
  assert.strictEqual(sandbox.remiPayrollIns1Plan, 'all');
  assert.strictEqual(sandbox.remiPayrollIns1AdminOk(), true);
  sandbox.remiPayroll1Start = '2026-09-14';
  sandbox.remiPayroll1End = '2026-09-27';
  let body = sandbox.remiPayroll1DateBody();
  assert.strictEqual(body.p_start_date, '2026-09-14');
  assert.strictEqual(body.p_end_date, '2026-09-27');
  assert.ok(!Object.prototype.hasOwnProperty.call(body, 'p_insurance_plan'), 'all omits p_insurance_plan');

  sandbox.remiPayrollIns1Plan = 'caresource';
  body = sandbox.remiPayroll1DateBody();
  assert.strictEqual(body.p_insurance_plan, 'caresource');
  sandbox.remiPayrollIns1Plan = 'passport';
  assert.strictEqual(sandbox.remiPayroll1DateBody().p_insurance_plan, 'passport');
  sandbox.remiPayrollIns1Plan = 'other';
  assert.strictEqual(sandbox.remiPayroll1DateBody().p_insurance_plan, 'other');
  sandbox.remiPayrollIns1Plan = '';
  assert.ok(!sandbox.remiPayroll1DateBody().p_insurance_plan, 'blank is All');

  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiPayrollIns1Plan = 'caresource';
  assert.strictEqual(sandbox.remiPayrollIns1AdminOk(), false);
  assert.ok(!sandbox.remiPayroll1DateBody().p_insurance_plan, 'Scheduler does not send the filter');
  assert.strictEqual(sandbox.remiPayrollIns1FromAsk('CareSource payroll'), null);
  assert.strictEqual(sandbox.remiPayrollIns1SheetExtra(), '');
  const schedDenied = await sandbox.remiPayrollIns1SetPlan('passport');
  assert.strictEqual(schedDenied.forbidden, true);

  sandbox.currentAdminRole = 'Nurse';
  assert.strictEqual(sandbox.remiPayrollIns1AdminOk(), false);
  assert.strictEqual(sandbox.remiPayrollIns1OpenBtn(), '');

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiPayrollIns1Plan = 'all';
  sandbox.remiPayroll1Report = REPORT;
  sandbox.remiPayrollIns1Chips = null;
  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body || {}});
    if(name === 'admin_list_remi_payroll_insurance_chips'){
      return {ok:true, data:{chips:[
        {key:'all', label:'All', color:null},
        {key:'caresource', label:'CareSource', color:'#6B2D8B'},
        {key:'passport', label:'Passport', color:'#E6B800'},
        {key:'other', label:'Other', color:'#6b7a90'}
      ]}};
    }
    if(name === 'admin_get_remi_payroll_report'){
      return {ok:true, data:body && body.p_insurance_plan === 'caresource' ? CARE : REPORT};
    }
    if(name === 'admin_export_remi_payroll_csv' || name === 'admin_export_remi_payroll_pdf' || name === 'admin_export_remi_payroll' || name === 'admin_run_remi_payroll_report'){
      return {ok:true, data:{success:true, csv_text:'aide,insurance_plan\n', filename:'payroll.csv', content_base64:'', report:REPORT}};
    }
    return {ok:false, error:'unexpected ' + name};
  };
  sandbox.downloadBlob = function(){};
  sandbox.Blob = function(){};
  const ask = sandbox.remiPayroll1FromAsk('CareSource payroll');
  assert.strictEqual(ask.ins1Plan, 'caresource');
  assert.ok(!ask.payrollQuery, 'insurer ask does not start a range confirm');
  assert.strictEqual(sandbox.remiPayroll1FromAsk('last 2 weeks').payrollQuery, 'last 2 weeks');

  const chips = await sandbox.remiPayrollIns1LoadChips();
  assert.strictEqual(chips.map(function(chip){return chip.label;}).join('|'), 'All|CareSource|Passport|Other');
  assert.strictEqual(rpc[0].name, 'admin_list_remi_payroll_insurance_chips');
  sandbox.remiPayrollIns1Plan = 'caresource';
  const filtered = sandbox.remiPayrollIns1FilterHtml('page');
  assert.ok(filtered.indexOf('All') >= 0 && filtered.indexOf('CareSource') >= 0 && filtered.indexOf('Passport') >= 0 && filtered.indexOf('Other') >= 0, filtered);
  assert.ok(filtered.indexOf('\u2190 All insurers') >= 0, 'clear path when filtered');
  assert.ok(filtered.indexOf('#6B2D8B') >= 0, filtered);
  assert.ok(filtered.indexOf('data-surface') < 0);
  const page = sandbox.remiPayrollIns1PageHtml();
  assert.ok(page.indexOf('data-surface="own-page"') >= 0, page.slice(0, 180));
  assert.ok(page.indexOf('Timesheets \u00B7 CareSource') >= 0, page);
  assert.ok(page.indexOf('Devon '+DOT+' Helen Park '+DOT+' 36.20') >= 0, page);
  assert.ok(page.indexOf('#6B2D8B') >= 0, 'CareSource color on the card');
  assert.ok(!/hrs paid/i.test(page), page);
  assert.ok(page.indexOf('id="copilotSheet"') < 0 && page.indexOf('copilotBody') < 0, 'page html is not a rail');

  sandbox.remiPayrollIns1Chips = null;
  sandbox.remiPayrollIns1ChipsLoading = false;
  sandbox.sbRestRpc = async function(){return {ok:false, status:500, error:'down'};};
  const fallback = await sandbox.remiPayrollIns1LoadChips();
  assert.strictEqual(fallback.map(function(chip){return chip.key;}).join('|'), 'all|caresource|passport|other');

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiPayrollIns1Plan = 'other';
  sandbox.remiPayroll1Report = null;
  sandbox.remiPayrollIns1PageOn = function(){return false;};
  rpc.length = 0;
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body || {}});
    if(name === 'admin_export_remi_payroll_csv')return {ok:true, data:{csv_text:'x', filename:'payroll.csv'}};
    if(name === 'admin_export_remi_payroll_pdf')return {ok:true, data:{}};
    if(name === 'admin_export_remi_payroll')return {ok:true, data:{csv_text:'x', filename:'both.csv'}};
    if(name === 'admin_run_remi_payroll_report')return {ok:true, data:{success:true, report:REPORT, job:{next_run_at:'2026-10-07T12:00:00+00:00', anchor_date:'2026-09-23'}}};
    if(name === 'admin_get_remi_payroll_report')return {ok:true, data:REPORT};
    return {ok:false, error:'unexpected ' + name};
  };
  sandbox.remiPayroll1Paint = function(){};
  const csv = await sandbox.remiPayroll1Export('csv');
  assert.strictEqual(csv.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_export_remi_payroll_csv');
  assert.strictEqual(rpc[0].body.p_insurance_plan, 'other');
  rpc.length = 0;
  const pdf = await sandbox.remiPayroll1Export('pdf');
  assert.strictEqual(pdf.ok, true);
  assert.strictEqual(rpc[0].body.p_insurance_plan, 'other');
  rpc.length = 0;
  const both = await sandbox.remiPayroll1Export('both');
  assert.strictEqual(both.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_export_remi_payroll');
  assert.strictEqual(rpc[0].body.p_insurance_plan, 'other');
  rpc.length = 0;
  const ran = await sandbox.remiPayroll1Run();
  assert.strictEqual(ran.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_run_remi_payroll_report');
  assert.strictEqual(rpc[0].body.p_insurance_plan, 'other');

  runRoleHandoff();
  console.log('admin-remi-payroll-ins1 unit ok');
  await runBrowser();
})().catch(function(err){
  console.error(err);
  process.exit(1);
});

function extractFn(srcText, sig){
  const start = srcText.indexOf(sig);
  assert.ok(start > 0, sig);
  let i = srcText.indexOf('{', start);
  let depth = 0;
  for(; i < srcText.length; i++){
    if(srcText[i] === '{')depth++;
    else if(srcText[i] === '}'){
      depth--;
      if(depth === 0)return srcText.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + sig);
}

function roleNode(id, opts){
  opts = opts || {};
  const node = {
    id:id,
    className:opts.className || '',
    hidden:!!opts.hidden,
    parentNode:opts.parent || null,
    children:opts.children || [],
    attrs:Object.assign({}, opts.attrs || {}),
    innerHTML:opts.innerHTML || ''
  };
  node.classList = {
    contains:function(name){return (' ' + node.className + ' ').indexOf(' ' + name + ' ') >= 0;},
    add:function(name){if(!node.classList.contains(name))node.className = (node.className + ' ' + name).trim();},
    remove:function(name){node.className = (' ' + node.className + ' ').replace(' ' + name + ' ', ' ').trim();}
  };
  node.getAttribute = function(name){return Object.prototype.hasOwnProperty.call(node.attrs, name) ? node.attrs[name] : null;};
  node.setAttribute = function(name, value){
    node.attrs[name] = String(value);
    if(name === 'hidden')node.hidden = true;
  };
  node.removeAttribute = function(name){
    delete node.attrs[name];
    if(name === 'hidden')node.hidden = false;
  };
  node.querySelectorAll = function(sel){
    const found = [];
    node.children.forEach(function walk(child){
      if(sel.split(',').some(function(part){
        part = part.trim();
        if(part.charAt(0) === '#')return child.id === part.slice(1);
        if(part.charAt(0) === '.')return child.classList && child.classList.contains(part.slice(1));
        return false;
      }))found.push(child);
      (child.children || []).forEach(walk);
    });
    return found;
  };
  node.removeChild = function(child){
    node.children = node.children.filter(function(item){return item !== child;});
    if(child)child.parentNode = null;
  };
  node.children.forEach(function(child){child.parentNode = node;});
  return node;
}

function runRoleHandoff(){
  const box = runSlice();
  const timesheets = roleNode('tab_timesheets', {className:'tab-panel active'});
  const schedule = roleNode('tab_schedule', {className:'tab-panel'});
  const payroll = roleNode('tab_payroll', {className:'tab-panel', hidden:true, attrs:{'data-layout-roles':'Admin'}});
  const host = roleNode('remiPayrollIns1Host', {innerHTML:'<div class="ins1-chips"><button class="ins1-chip">All</button><button class="ins1-chip">CareSource</button><button class="ins1-chip">Passport</button><button class="ins1-chip">Other</button></div>'});
  const sheetChip = roleNode('chip', {className:'ins1-chips'});
  const sheetClear = roleNode('remiPayrollIns1Clear', {className:'ins1-clear'});
  const sheetOpen = roleNode('remiPayrollIns1OpenFull', {className:'alt'});
  const sheet = roleNode('copilotSheet', {attrs:{'data-layout-roles':'Admin Scheduler'}, children:[sheetChip, sheetClear, sheetOpen]});
  const navPayroll = roleNode('nav_payroll', {attrs:{'data-layout-roles':'Admin'}});
  const openBtn = roleNode('remiPayrollIns1TimesheetsOpen', {attrs:{'data-layout-roles':'Admin'}});
  const navTimesheets = roleNode('nav_timesheets', {attrs:{'data-layout-roles':'Admin Scheduler'}});
  const navSecret = roleNode('nav_secret', {attrs:{'data-layout-roles':'Admin'}});
  const panels = [timesheets, schedule, payroll];
  const els = [navTimesheets, navSecret, navPayroll, openBtn, payroll, sheet];
  box.showTabCalls = [];
  box.showTab = function(tab){
    box.showTabCalls.push(tab);
    panels.forEach(function(panel){
      const on = panel.id === 'tab_' + tab;
      panel.classList.remove('active');
      if(on){
        panel.classList.add('active');
        panel.removeAttribute('hidden');
      }else panel.setAttribute('hidden', '');
    });
  };
  box.document = {
    getElementById:function(id){
      if(id === 'avatarMenuBtn')return box.btn;
      return [timesheets, schedule, payroll, host, sheet, navPayroll, openBtn, navTimesheets, navSecret].filter(function(node){return node.id === id;})[0] || null;
    },
    querySelectorAll:function(sel){
      assert.strictEqual(sel, '#adminScreen [data-layout-roles]');
      return els;
    },
    querySelector:function(sel){
      assert.strictEqual(sel, '#adminScreen .tab-panel.active');
      return panels.filter(function(panel){return panel.classList.contains('tab-panel') && panel.classList.contains('active');})[0] || null;
    }
  };
  box.btn = {textContent:'', setAttribute:function(name, value){this[name] = value;}};
  vm.runInContext(extractFn(html, 'function layoutA1ApplyRoles()'), box);

  box.currentAdminRole = 'Admin';
  schedule.classList.add('active');
  timesheets.classList.remove('active');
  box.showTabCalls = [];
  vm.runInContext('layoutA1ApplyRoles()', box);
  assert.ok(schedule.classList.contains('active'), 'Admin stays on Schedule');
  assert.strictEqual(box.showTabCalls.length, 0, 'Admin on an open desk is not sent home');
  assert.ok(host.innerHTML.indexOf('CareSource') >= 0, 'Admin gate does not clear the payroll host');

  timesheets.classList.remove('active');
  schedule.classList.remove('active');
  payroll.classList.add('active');
  payroll.removeAttribute('hidden');
  host.innerHTML = '<div class="ins1-chips"><button class="ins1-chip">All</button><button class="ins1-chip">CareSource</button><button class="ins1-chip">Passport</button><button class="ins1-chip">Other</button></div>';
  box.currentAdminRole = 'Scheduler';
  box.currentAdminUsername = 'Jasmine';
  box.showTabCalls = [];
  vm.runInContext('layoutA1ApplyRoles()', box);
  assert.strictEqual(payroll.hidden, true, 'Scheduler payroll page is hidden');
  assert.ok(!payroll.classList.contains('active'), 'Scheduler payroll page is not active');
  assert.strictEqual(host.innerHTML, '', 'Scheduler host has no insurance chips');
  assert.ok(!/CareSource|Passport|Other/.test(host.innerHTML));
  assert.ok(timesheets.classList.contains('active'), 'Scheduler home is Timesheets');
  assert.ok(box.showTabCalls.indexOf('timesheets') >= 0, box.showTabCalls.join(','));
  assert.strictEqual(navPayroll.hidden, true, 'Scheduler payroll nav stays hidden');
  assert.strictEqual(openBtn.hidden, true, 'Scheduler timesheets payroll button stays hidden');
  assert.strictEqual(navTimesheets.hidden, false, 'Scheduler keeps Timesheets');
  assert.strictEqual(sheet.querySelectorAll('.ins1-chips,.ins1-clear,#remiPayrollIns1OpenFull').length, 0, 'Scheduler sheet loses Admin chip UI');
  box.railShows = 0;
  box.pageOpens = 0;
  box.remiPayroll1Show = function(){box.railShows++; return {ok:true};};
  box.remiPayrollIns1OpenPage = function(){box.pageOpens++; return {ok:true};};
  const fromRail = box.remiPayrollIns1FromRail();
  assert.strictEqual(box.pageOpens, 0, 'Scheduler rail does not open the own page');
  assert.strictEqual(box.railShows, 0, 'Scheduler rail does not open remi-payroll1');
  assert.strictEqual(fromRail.forbidden, true);
  assert.strictEqual(fromRail.hidden, true);

  payroll.classList.add('active');
  payroll.removeAttribute('hidden');
  host.innerHTML = '<button class="ins1-chip">CareSource</button>';
  box.currentAdminRole = 'Nurse';
  box.showTabCalls = [];
  vm.runInContext('layoutA1ApplyRoles()', box);
  assert.strictEqual(payroll.hidden, true);
  assert.ok(!payroll.classList.contains('active'));
  assert.strictEqual(host.innerHTML, '');
  assert.ok(timesheets.classList.contains('active'));
}

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
    console.log('admin-remi-payroll-ins1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.INS1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403); res.end(); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
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
  function watch(page){
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
  }
  async function boot(page, role, width, height){
    await page.setViewport({width:width, height:height, isMobile:width < 500, hasTouch:width < 500, deviceScaleFactor:1});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-payroll-ins1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#tab_payroll', {timeout:10000});
    await page.evaluate(function(pack){
      currentAdminRole = pack.role;
      currentAdminUsername = pack.role === 'Admin' ? 'Mo' : 'Jaz';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      window.__rpc = [];
      sbRestRpc = async function(name, body){
        window.__rpc.push({name:name, body:body || {}});
        if(name === 'admin_list_remi_payroll_insurance_chips'){
          return {ok:true, data:{chips:pack.chips}};
        }
        if(name === 'admin_get_remi_payroll_report'){
          var plan = body && body.p_insurance_plan;
          return {ok:true, data:plan === 'caresource' ? pack.care : pack.report};
        }
        if(name === 'admin_export_remi_payroll_csv' || name === 'admin_run_remi_payroll_report' || name === 'admin_export_remi_payroll' || name === 'admin_export_remi_payroll_pdf'){
          return {ok:true, data:{success:true, csv_text:'aide\n', filename:'payroll.csv', report:pack.report}};
        }
        return {ok:true, data:{success:true}};
      };
    }, {role:role, report:REPORT, care:CARE, chips:[
      {key:'all', label:'All', color:null},
      {key:'caresource', label:'CareSource', color:'#6B2D8B'},
      {key:'passport', label:'Passport', color:'#E6B800'},
      {key:'other', label:'Other', color:'#6b7a90'}
    ]});
  }
  try{
    const phone = await browser.newPage();
    watch(phone);
    await boot(phone, 'Admin', 390, 844);
    await phone.evaluate(async function(){
      await remiPayrollIns1FromRail();
    });
    const phoneAll = await phone.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var page = document.getElementById('tab_payroll');
      return {
        text: document.getElementById('copilotBody').innerText,
        hidden: sheet.hidden,
        pageOn: page.classList.contains('active'),
        chips: document.querySelectorAll('#copilotSheet .ins1-chip').length,
        names: window.__rpc.map(function(row){return row.name;})
      };
    });
    assert.strictEqual(phoneAll.hidden, false, 'phone report stays in the Remi sheet');
    assert.strictEqual(phoneAll.pageOn, false, 'phone default payroll is not the desktop page');
    assert.strictEqual(phoneAll.chips, 4, 'phone paints four chips');
    assert.ok(phoneAll.text.indexOf('All') >= 0 && phoneAll.text.indexOf('CareSource') >= 0 && phoneAll.text.indexOf('Passport') >= 0 && phoneAll.text.indexOf('Other') >= 0, phoneAll.text);
    assert.ok(phoneAll.text.indexOf('Devon') >= 0 && phoneAll.text.indexOf('36.20') >= 0, phoneAll.text);
    assert.ok(phoneAll.names.indexOf('admin_list_remi_payroll_insurance_chips') >= 0, phoneAll.names.join(','));
    assert.ok(phoneAll.names.indexOf('admin_get_remi_payroll_report') >= 0, phoneAll.names.join(','));
    await phone.screenshot({path:path.join(shotDir, 'remi-payroll-ins1-phone-all.png')});
    await phone.evaluate(async function(){
      window.__rpc = [];
      await remiPayrollIns1SetPlan('caresource');
    });
    const phoneCare = await phone.evaluate(function(){
      var text = document.getElementById('copilotBody').innerText;
      var get = window.__rpc.filter(function(row){return row.name === 'admin_get_remi_payroll_report';}).pop();
      return {text:text, plan:get && get.body && get.body.p_insurance_plan, maria:text.indexOf('Maria')};
    });
    assert.strictEqual(phoneCare.plan, 'caresource');
    assert.ok(phoneCare.text.indexOf('All insurers') >= 0, phoneCare.text);
    assert.ok(phoneCare.text.indexOf('Devon') >= 0, phoneCare.text);
    assert.ok(phoneCare.maria < 0, 'filtered phone list drops other aides');
    await phone.screenshot({path:path.join(shotDir, 'remi-payroll-ins1-phone-caresource.png')});
    const phoneGate = await phone.evaluate(function(){
      var before = document.querySelectorAll('#copilotSheet .ins1-chip').length;
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'Jasmine';
      layoutA1ApplyRoles();
      return {
        before:before,
        chips:document.querySelectorAll('#copilotSheet .ins1-chip, #copilotSheet .ins1-clear, #copilotSheet .ins1-scope, #copilotSheet .ins1-filter').length,
        open:document.getElementById('remiPayrollIns1OpenFull'),
        pageOn:document.getElementById('tab_payroll').classList.contains('active')
      };
    });
    assert.ok(phoneGate.before >= 4, 'phone had Admin chips before the role switch');
    assert.strictEqual(phoneGate.chips, 0, 'Scheduler phone sheet has no insurance chips');
    assert.strictEqual(phoneGate.open, null, 'Scheduler phone sheet has no Open full report button');
    assert.strictEqual(phoneGate.pageOn, false, 'Scheduler phone does not keep the payroll page');

    const desk = await browser.newPage();
    watch(desk);
    await boot(desk, 'Admin', 1280, 800);
    await desk.evaluate(async function(){
      window.__rpc = [];
      await remiPayrollIns1FromRail();
    });
    const deskAll = await desk.evaluate(function(){
      var page = document.getElementById('tab_payroll');
      var sheet = document.getElementById('copilotSheet');
      var host = document.getElementById('remiPayrollIns1Host');
      return {
        on: page.classList.contains('active'),
        roles: page.getAttribute('data-layout-roles'),
        inRail: !!(page.closest && page.closest('#copilotSheet')),
        sheetHidden: sheet.hidden,
        text: page.innerText,
        hostInSheet: !!(host.closest && host.closest('#copilotSheet'))
      };
    });
    assert.strictEqual(deskAll.on, true);
    assert.strictEqual(deskAll.roles, 'Admin');
    assert.strictEqual(deskAll.inRail, false);
    assert.strictEqual(deskAll.hostInSheet, false);
    assert.strictEqual(deskAll.sheetHidden, true, 'desktop report is not left in the Remi rail');
    assert.ok(deskAll.text.indexOf('Own page') >= 0, deskAll.text);
    assert.ok(deskAll.text.indexOf('Payroll report') >= 0, deskAll.text);
    assert.ok(deskAll.text.indexOf('CareSource') >= 0 && deskAll.text.indexOf('Passport') >= 0 && deskAll.text.indexOf('Other') >= 0, deskAll.text);
    assert.ok(deskAll.text.indexOf('36.20') >= 0, deskAll.text);
    await desk.screenshot({path:path.join(shotDir, 'remi-payroll-ins1-desktop-all.png'), fullPage:true});
    await desk.evaluate(async function(){
      window.__rpc = [];
      await remiPayrollIns1SetPlan('passport');
    });
    const deskPass = await desk.evaluate(function(){
      var get = window.__rpc.filter(function(row){return row.name === 'admin_get_remi_payroll_report';}).pop();
      var csv = null;
      return {plan:get && get.body.p_insurance_plan, text:document.getElementById('tab_payroll').innerText, csv:csv};
    });
    assert.strictEqual(deskPass.plan, 'passport');
    assert.ok(deskPass.text.indexOf('All insurers') >= 0, deskPass.text);
    assert.ok(deskPass.text.indexOf('Maria') >= 0, deskPass.text);
    await desk.evaluate(async function(){
      window.__rpc = [];
      remiPayrollIns1Plan = 'caresource';
      await remiPayroll1Export('csv');
      await remiPayroll1Run();
    });
    const wired = await desk.evaluate(function(){
      return window.__rpc.filter(function(row){
        return row.name === 'admin_export_remi_payroll_csv' || row.name === 'admin_run_remi_payroll_report';
      }).map(function(row){return {name:row.name, plan:row.body && row.body.p_insurance_plan};});
    });
    assert.strictEqual(wired[0].name, 'admin_export_remi_payroll_csv');
    assert.strictEqual(wired[0].plan, 'caresource');
    assert.strictEqual(wired[1].name, 'admin_run_remi_payroll_report');
    assert.strictEqual(wired[1].plan, 'caresource');
    await desk.screenshot({path:path.join(shotDir, 'remi-payroll-ins1-desktop-passport.png'), fullPage:true});

    const sched = await browser.newPage();
    watch(sched);
    await boot(sched, 'Scheduler', 1280, 800);
    const schedView = await sched.evaluate(async function(){
      var nav = document.getElementById('nav_payroll');
      var open = document.getElementById('remiPayrollIns1TimesheetsOpen');
      showTab('payroll');
      await remiPayroll1Show();
      var page = document.getElementById('tab_payroll');
      return {
        navHidden: !!(nav && nav.hidden),
        openHidden: !!(open && open.hidden),
        navRoles: nav ? nav.getAttribute('data-layout-roles') : '',
        pageOn: page.classList.contains('active'),
        chips: document.querySelectorAll('#copilotSheet .ins1-chip').length,
        sheetText: document.getElementById('copilotBody').innerText,
        tabHidden: !!(document.getElementById('copilotTabPayroll') && document.getElementById('copilotTabPayroll').hidden)
      };
    });
    assert.strictEqual(schedView.navHidden, true, 'Scheduler does not see the payroll page nav');
    assert.strictEqual(schedView.openHidden, true, 'Scheduler does not see the timesheets payroll link');
    assert.strictEqual(schedView.navRoles, 'Admin');
    assert.strictEqual(schedView.pageOn, false, 'Scheduler showTab payroll does not open the page');
    assert.strictEqual(schedView.chips, 0, 'Scheduler rail has no insurance chips');
    assert.strictEqual(schedView.tabHidden, true, 'Scheduler Remi Payroll tab stays hidden');
    assert.ok(schedView.sheetText.indexOf('Payroll report') < 0, schedView.sheetText);
    assert.ok(schedView.sheetText.indexOf('Paid shifts') < 0, schedView.sheetText);
    assert.ok(schedView.sheetText.indexOf('36.20') < 0, schedView.sheetText);

    const handoff = await browser.newPage();
    watch(handoff);
    await boot(handoff, 'Admin', 1280, 800);
    await handoff.evaluate(async function(){
      showTab('payroll');
      if(remiPayrollIns1Shown && remiPayrollIns1Shown.then)await remiPayrollIns1Shown;
    });
    const beforeLeave = await handoff.evaluate(function(){
      var page = document.getElementById('tab_payroll');
      return {on:page.classList.contains('active'), text:page.innerText};
    });
    assert.strictEqual(beforeLeave.on, true, 'Admin has the payroll own page open');
    assert.ok(beforeLeave.text.indexOf('CareSource') >= 0 && beforeLeave.text.indexOf('Passport') >= 0 && beforeLeave.text.indexOf('Other') >= 0, beforeLeave.text);
    const afterLeave = await handoff.evaluate(function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'Jasmine';
      layoutA1ApplyRoles();
      var page = document.getElementById('tab_payroll');
      var host = document.getElementById('remiPayrollIns1Host');
      var active = document.querySelector('#adminScreen .tab-panel.active');
      var nav = document.getElementById('nav_payroll');
      var open = document.getElementById('remiPayrollIns1TimesheetsOpen');
      return {
        hidden:!!(page && page.hidden),
        active:!!(page && page.classList.contains('active')),
        display:page ? getComputedStyle(page).display : '',
        hostText:host ? host.innerText : 'missing',
        hostChips:host ? host.querySelectorAll('.ins1-chip, .ins1-chips').length : -1,
        activeId:active ? active.id : '',
        navHidden:!!(nav && nav.hidden),
        openHidden:!!(open && open.hidden),
        navDisplay:nav ? getComputedStyle(nav).display : '',
        openDisplay:open ? getComputedStyle(open).display : ''
      };
    });
    assert.strictEqual(afterLeave.hidden, true, 'Scheduler payroll page is hidden');
    assert.strictEqual(afterLeave.active, false, 'Scheduler payroll page is not active');
    assert.strictEqual(afterLeave.display, 'none', 'hidden payroll page is not displayed');
    assert.strictEqual(afterLeave.hostChips, 0, 'Scheduler host has no insurance chips');
    assert.ok(!/CareSource|Passport|\bOther\b/.test(afterLeave.hostText), afterLeave.hostText);
    assert.strictEqual(afterLeave.activeId, 'tab_timesheets', afterLeave.activeId);
    assert.strictEqual(afterLeave.navHidden, true, 'Scheduler payroll nav stays hidden');
    assert.strictEqual(afterLeave.openHidden, true, 'Scheduler timesheets payroll button stays hidden');
    assert.strictEqual(afterLeave.navDisplay, 'none');
    assert.strictEqual(afterLeave.openDisplay, 'none');
    await handoff.screenshot({path:path.join(shotDir, 'remi-payroll-ins1-scheduler-after-admin.png'), fullPage:true});
    const belt = await handoff.evaluate(function(){
      var page = document.getElementById('tab_payroll');
      page.classList.add('active');
      page.setAttribute('hidden', '');
      return getComputedStyle(page).display;
    });
    assert.strictEqual(belt, 'none', 'CSS keeps a hidden payroll page off screen even if .active remains');
    const railAfter = await handoff.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      layoutA1ApplyRoles();
      await remiPayrollIns1FromRail();
      var page = document.getElementById('tab_payroll');
      var body = document.getElementById('copilotBody');
      return {
        pageOn:!!(page && page.classList.contains('active')),
        pageDisplay:page ? getComputedStyle(page).display : '',
        chips:document.querySelectorAll('#copilotSheet .ins1-chip').length,
        text:body ? body.innerText : '',
        tabHidden:!!(document.getElementById('copilotTabPayroll') && document.getElementById('copilotTabPayroll').hidden)
      };
    });
    assert.strictEqual(railAfter.pageOn, false, 'Scheduler Remi payroll does not open the own page');
    assert.strictEqual(railAfter.pageDisplay, 'none');
    assert.strictEqual(railAfter.chips, 0, 'Scheduler Remi payroll has no insurance chips');
    assert.strictEqual(railAfter.tabHidden, true, 'Scheduler Remi Payroll tab stays hidden');
    assert.ok(railAfter.text.indexOf('Payroll report') < 0, railAfter.text);

    assert.ok(!errors.some(function(line){return /SyntaxError|remiPayrollIns1/.test(line);}), errors.join('\n'));
    console.log('admin-remi-payroll-ins1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
