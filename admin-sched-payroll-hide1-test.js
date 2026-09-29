#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=sched-payroll-hide1'), 'sched-payroll-hide1 marker');
assert.ok(html.includes('?v=sched-payroll-hide1'), 'query marker');
assert.ok(html.includes('data-sched-payroll-hide1="v=sched-payroll-hide1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-29-sched-payroll-hide1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-sched-payroll-hide1">'), 'build meta');
assert.ok(html.includes('<!-- sched payroll hide 2026-09-29 v=sched-payroll-hide1 ?v=sched-payroll-hide1 admin-build 2026-09-29-sched-payroll-hide1'), 'comment');
assert.ok(html.includes("var SCHED_PAYROLL_HIDE1_MARKER='v=sched-payroll-hide1'"), 'script marker');
assert.ok(html.includes("var SCHED_PAYROLL_HIDE1_BUILD='2026-09-29-sched-payroll-hide1'"), 'script build');
assert.ok(html.includes('GHOST-SCHED-PAYROLL-HIDE1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'UI gate is not a new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'quiet Mo');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-29-sched-payroll-hide1"'), 'new meta follows the first');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-admin-sched-chat-push1">'), 'admin-sched-chat-push1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-login-land-schedule1">'), 'login-land meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-list-search-az1">'), 'list-search meta stays');
assert.ok(html.includes('v=admin-sched-chat-push1'), 'chat push marker stays');
assert.ok(html.includes('v=pages-cache-fresh1'), 'pages-cache marker stays');
assert.ok(html.includes('v=remi-notes-vis1'), 'notes vis marker stays');
assert.ok(html.includes('v=remi-payroll1'), 'payroll1 marker stays');
assert.ok(html.includes('v=remi-payroll-ins1'), 'payroll ins1 marker stays');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'pages cache build file stays');
['admin_get_remi_payroll_report','admin_run_remi_payroll_report','admin_export_remi_payroll','admin_export_remi_payroll_csv','admin_export_remi_payroll_pdf'].forEach(function(rpc){
  assert.ok(html.includes(rpc), 'admin payroll rpc stays ' + rpc);
});
assert.ok(html.includes('#copilotTabPayroll[hidden]{display:none !important;}'), 'hidden payroll tab stays off screen');

const tabAt = html.indexOf('id="copilotTabPayroll"');
const tabLine = html.slice(html.lastIndexOf('<button', tabAt), html.indexOf('>', tabAt) + 1);
assert.ok(tabLine.includes('data-layout-roles="Admin"'), 'payroll tab is Admin only');
assert.ok(tabLine.includes('data-sched-payroll-hide1="v=sched-payroll-hide1"'), 'tab carries the marker');
assert.ok(!tabLine.includes('Scheduler'), 'payroll tab does not list Scheduler');
assert.ok(tabLine.includes('onclick="remiPayrollIns1FromRail()"'), 'tab still opens the rail entry');

const navAt = html.indexOf('id="nav_payroll"');
const navLine = html.slice(html.lastIndexOf('<button', navAt), html.indexOf('>', navAt) + 1);
assert.ok(navLine.includes('data-layout-roles="Admin"'), 'More payroll row stays Admin only');
assert.ok(!navLine.includes('Scheduler'), 'More payroll row does not list Scheduler');

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

function makeEl(id, opts){
  opts = opts || {};
  return {
    id: id,
    hidden: !!opts.hidden,
    innerHTML: opts.innerHTML || '',
    textContent: opts.textContent || '',
    attrs: Object.assign({}, opts.attrs || {}),
    classList: {
      _list: (opts.classes || []).slice(),
      contains: function(name){return this._list.indexOf(name) >= 0;},
      add: function(name){if(this._list.indexOf(name) < 0)this._list.push(name);},
      remove: function(name){this._list = this._list.filter(function(item){return item !== name;});}
    },
    setAttribute: function(name, value){
      this.attrs[name] = value;
      if(name === 'hidden')this.hidden = true;
    },
    removeAttribute: function(name){
      delete this.attrs[name];
      if(name === 'hidden')this.hidden = false;
    },
    getAttribute: function(name){
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    querySelector: function(sel){
      if(this.innerHTML && /pay-report|remiPayroll1/.test(String(sel)) && this.innerHTML.indexOf('pay-report') >= 0){
        return {id:'remiPayroll1'};
      }
      return null;
    }
  };
}

const tab = makeEl('copilotTabPayroll', {attrs:{'data-layout-roles':'Admin'}});
const sheet = makeEl('copilotSheet', {attrs:{'data-layout-roles':'Admin Scheduler'}, classes:['is-payroll']});
const host = makeEl('copilotBody', {innerHTML:'<div id="remiPayroll1" class="pay-report"><h3>Payroll report</h3><div class="lbl">Paid shifts</div><button>Run</button><button>CSV</button><button>PDF</button><button>Both</button></div>'});
const timesheets = makeEl('tab_timesheets', {attrs:{'data-layout-roles':'Admin Scheduler'}, classes:['tab-panel','active']});
const avatar = makeEl('avatarMenuBtn');
const els = {
  copilotTabPayroll: tab,
  copilotSheet: sheet,
  copilotBody: host,
  tab_timesheets: timesheets,
  avatarMenuBtn: avatar
};
const sandbox = {
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'jaz@evercare.test',
  copilotView: 'payroll',
  console: console,
  document: {
    getElementById: function(id){return els[id] || null;},
    querySelectorAll: function(sel){
      assert.strictEqual(sel, '#adminScreen [data-layout-roles]');
      return [tab, sheet, timesheets];
    },
    querySelector: function(sel){
      assert.strictEqual(sel, '#adminScreen .tab-panel.active');
      return timesheets.classList.contains('active') ? timesheets : null;
    }
  }
};
vm.createContext(sandbox);

const hideStart = html.indexOf('// sched payroll hide1 v=sched-payroll-hide1');
const hideEnd = html.indexOf('// end sched payroll hide1 v=sched-payroll-hide1');
assert.ok(hideStart > 0 && hideEnd > hideStart, 'hide script block');
vm.runInContext(html.slice(hideStart, hideEnd), sandbox);
assert.strictEqual(sandbox.SCHED_PAYROLL_HIDE1_MARKER, 'v=sched-payroll-hide1');
assert.strictEqual(sandbox.schedPayrollHide1UiOk(), false, 'Scheduler is not the payroll UI');

sandbox.schedPayrollHide1Apply();
assert.strictEqual(tab.hidden, true, 'Scheduler payroll tab is hidden');
assert.strictEqual(host.innerHTML, '', 'Scheduler payroll panel is cleared');
assert.strictEqual(sandbox.copilotView, 'radar', 'Scheduler leaves the payroll view');
assert.ok(!sheet.classList.contains('is-payroll'), 'payroll sheet class drops');

sandbox.currentAdminRole = 'Admin';
sandbox.currentAdminUsername = 'mo@evercare.test';
sandbox.schedPayrollHide1Apply();
assert.strictEqual(tab.hidden, false, 'Admin payroll tab stays available');
assert.strictEqual(sandbox.schedPayrollHide1UiOk(), true);

sandbox.currentAdminRole = 'Nurse';
sandbox.copilotView = 'payroll';
host.innerHTML = '<div id="remiPayroll1" class="pay-report">Payroll report</div>';
sandbox.schedPayrollHide1Apply();
assert.strictEqual(tab.hidden, true, 'Nurse payroll tab stays hidden');
assert.strictEqual(host.innerHTML, '', 'Nurse payroll panel stays cleared');

const payStart = html.indexOf('// remi payroll1 v=remi-payroll1');
const payEnd = html.indexOf('// end remi payroll1 v=remi-payroll1');
vm.runInContext(html.slice(payStart, payEnd), sandbox);
assert.strictEqual(sandbox.remiPayroll1OfficeOk.call({}), false, 'Nurse stays OOS for payroll RPC');
sandbox.currentAdminRole = 'Scheduler';
assert.strictEqual(sandbox.remiPayroll1OfficeOk(), true, 'Scheduler RPC gate is unchanged');
assert.strictEqual(sandbox.remiPayroll1FromAsk('run payroll'), null, 'Scheduler ask does not open payroll');
host.innerHTML = '<div class="pay-report" id="remiPayroll1">Payroll report</div>';
sandbox.copilotView = 'payroll';
tab.hidden = false;
const schedShow = sandbox.remiPayroll1Show();
assert.strictEqual(schedShow.hidden, true);
assert.strictEqual(schedShow.forbidden, true);
assert.strictEqual(tab.hidden, true, 'Show hides the Scheduler tab');
assert.strictEqual(host.innerHTML, '', 'Show does not leave the Scheduler panel');
assert.ok(host.innerHTML.indexOf('Paid shifts') < 0);
assert.ok(host.innerHTML.indexOf('Run') < 0);

sandbox.currentAdminRole = 'Admin';
sandbox.copilotView = 'radar';
host.innerHTML = '';
tab.hidden = true;
sandbox.remiPayroll1Report = {
  stats:{aides:2, paid_shifts:4, paid_hours:36.2, covers:1, flags:0},
  aides:[],
  start_date_display:'09/14/2026',
  end_date_display:'09/27/2026',
  job:{anchor_date:'2026-09-23', schedule_label:'Every other Wednesday'}
};
const adminShow = awaitPromise(sandbox.remiPayroll1Show());
assert.strictEqual(adminShow.hidden, undefined);
assert.strictEqual(sandbox.copilotView, 'payroll');
assert.ok(host.innerHTML.indexOf('Payroll report') >= 0, host.innerHTML.slice(0, 240));
assert.ok(host.innerHTML.indexOf('Paid shifts') >= 0, host.innerHTML);
assert.ok(host.innerHTML.indexOf('Paid hours') >= 0, host.innerHTML);
assert.ok(host.innerHTML.indexOf('>Run<') >= 0, host.innerHTML);
assert.ok(host.innerHTML.indexOf('>CSV<') >= 0, host.innerHTML);
assert.ok(host.innerHTML.indexOf('>PDF<') >= 0, host.innerHTML);
assert.ok(host.innerHTML.indexOf('>Both<') >= 0, host.innerHTML);
assert.strictEqual(tab.hidden, true, 'Show does not itself unhide; role apply does');
sandbox.schedPayrollHide1Apply();
assert.strictEqual(tab.hidden, false, 'Admin role apply shows the payroll tab');

const schedStart = html.indexOf('// remi sched1 v=remi-sched1');
const schedEnd = html.indexOf('// end remi sched1 v=remi-sched1');
assert.ok(schedStart > 0 && schedEnd > schedStart, 'sched script block');
vm.runInContext(html.slice(schedStart, schedEnd), sandbox);
const PAY_JOB = {
  id:'pay1', title:'Payroll report', kind:'payroll_report', job_key:'payroll_report', is_on:true, weekday:'wed', local_time:'08:00',
  recurrence:'biweekly', interval_days:14, anchor_date:'2026-09-23', sort_order:5,
  schedule_label:'Every other Wednesday \u00B7 8:00 AM ET \u00B7 payroll report in Remi rail',
  next_run_at:'2026-10-07T12:00:00+00:00'
};
const HOURS_JOB = {
  id:'miss1', title:'Missing hours report', kind:'missing_hours_report', job_key:'missing_hours_report', is_on:true, weekday:'mon', local_time:'09:00',
  sort_order:10, schedule_label:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail'
};
sandbox.remiSched1Cache = [PAY_JOB, HOURS_JOB];
sandbox.currentAdminRole = 'Scheduler';
const schedList = sandbox.remiSched1ListHtml();
assert.ok(schedList.indexOf('Missing hours report') >= 0, 'Scheduler keeps other scheduled jobs');
assert.ok(schedList.indexOf('Payroll report') < 0, schedList);
assert.ok(schedList.indexOf('Open report') < 0, schedList);
assert.ok(schedList.indexOf('>Run<') < 0, schedList);
assert.ok(schedList.indexOf('Anchor pay day') < 0, schedList);
assert.ok(schedList.indexOf('09/23/2026') < 0, schedList);
assert.ok(schedList.indexOf('payroll report in Remi rail') < 0, schedList);
assert.strictEqual(sandbox.remiSched1JobHtml(PAY_JOB), '', 'Scheduler payroll job card is not painted');
assert.strictEqual(sandbox.remiPayroll1JobExtra(PAY_JOB), '', 'Scheduler payroll job extra is empty');
const titleOnly = Object.assign({}, PAY_JOB, {kind:'', job_key:'', title:'Weekly payroll'});
assert.strictEqual(sandbox.remiSched1JobHtml(titleOnly), '', 'Scheduler title-only payroll card is not painted');

sandbox.currentAdminRole = 'Admin';
const adminCard = sandbox.remiSched1JobHtml(PAY_JOB);
const adminList = sandbox.remiSched1ListHtml();
assert.ok(adminCard.indexOf('Payroll report') >= 0, adminCard);
assert.ok(adminCard.indexOf('Open report') >= 0, adminCard);
assert.ok(adminCard.indexOf('>Run<') >= 0, adminCard);
assert.ok(adminCard.indexOf('Anchor pay day') >= 0, adminCard);
assert.ok(adminCard.indexOf('09/23/2026') >= 0, adminCard);
assert.ok(adminList.indexOf('Missing hours report') >= 0, adminList);
assert.ok(adminList.indexOf('Payroll report') >= 0, adminList);
assert.ok(sandbox.remiPayroll1JobExtra(PAY_JOB).indexOf('Open report') >= 0, 'Admin job extra stays');

sandbox.currentAdminRole = 'Nurse';
assert.strictEqual(sandbox.remiSched1JobHtml(PAY_JOB), '', 'Nurse payroll job card stays out');
assert.ok(sandbox.remiSched1JobHtml(HOURS_JOB).indexOf('Missing hours report') >= 0, 'Nurse hours card is unchanged');

sandbox.currentAdminRole = '';
assert.strictEqual(sandbox.schedPayrollHide1UiOk(), true, 'empty role still paints');
assert.ok(sandbox.remiSched1JobHtml(PAY_JOB).indexOf('Payroll report') >= 0, 'empty role still paints the payroll card');

const fromRail = extractFn(html, 'function remiPayrollIns1FromRail()');
vm.runInContext(fromRail, sandbox);
sandbox.currentAdminRole = 'Scheduler';
sandbox.railShows = 0;
sandbox.remiPayroll1Show = function(){sandbox.railShows++; return {ok:true};};
const rail = sandbox.remiPayrollIns1FromRail();
assert.strictEqual(sandbox.railShows, 0, 'Scheduler rail entry does not open payroll');
assert.strictEqual(rail.forbidden, true);
assert.strictEqual(rail.hidden, true);

vm.runInContext(extractFn(html, 'function layoutA1ApplyRoles()'), sandbox);
sandbox.showTab = function(name){sandbox.homeTab = name;};
sandbox.currentAdminRole = 'Scheduler';
tab.hidden = false;
vm.runInContext('layoutA1ApplyRoles()', sandbox);
assert.strictEqual(tab.hidden, true, 'layout role gate hides the Scheduler payroll tab');
assert.strictEqual(timesheets.hidden, false, 'Scheduler keeps the shared desks');
sandbox.currentAdminRole = 'Admin';
vm.runInContext('layoutA1ApplyRoles()', sandbox);
assert.strictEqual(tab.hidden, false, 'layout role gate keeps the Admin payroll tab');

const notesStart = html.indexOf('// remi notes vis1 v=remi-notes-vis1');
const notesEnd = html.indexOf('// end remi notes vis1 v=remi-notes-vis1');
const notesBox = {currentAdminRole:'Scheduler', currentAdminUsername:'jaz@evercare.test', copilotView:'notes', console:console};
vm.createContext(notesBox);
vm.runInContext(html.slice(notesStart, notesEnd), notesBox);
notesBox.remiNotesVis1ResetTab();
const schedNotes = notesBox.remiNotesVis1Html();
assert.ok(/id="remiNotesVisSched"[^>]*\shidden/.test(schedNotes), 'Mo notes Scheduler tab stays hidden');
assert.strictEqual(notesBox.remiNotesVis1Hint(), 'Admin My notes never appear here.');
assert.strictEqual(notesBox.remiNotesVis1IsAdmin(), false);
notesBox.currentAdminRole = 'Admin';
notesBox.remiNotesVis1ResetTab();
const adminNotes = notesBox.remiNotesVis1Html();
assert.ok(adminNotes.indexOf('>My notes<') >= 0 && adminNotes.indexOf('>Scheduler notes<') >= 0, 'Admin still has both note tabs');

function awaitPromise(value){
  return value && typeof value.then === 'function' ? value : Promise.resolve(value);
}

awaitPromise(adminShow).then(function(){
  console.log('admin-sched-payroll-hide1 unit ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
