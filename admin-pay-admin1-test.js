#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('PAY_ADMIN1'), 'PAY_ADMIN1 marker');
assert.ok(html.includes('v=pay-admin1'), 'pay-admin1 marker');
assert.ok(html.includes('?v=pay-admin1'), 'cache tag');
assert.ok(html.includes("var PAY_ADMIN1='PAY_ADMIN1'"), 'script marker');
assert.ok(html.includes("var PAY_ADMIN1_MARKER='v=pay-admin1'"), 'script query marker');
assert.ok(html.includes("var PAY_ADMIN1_BUILD='2026-10-08-pay-admin1'"), 'script build');
assert.ok(html.includes('<meta name="admin-build" content="2026-10-08-pay-admin1">'), 'build meta');
assert.ok(html.includes('data-pay-admin1="v=pay-admin1"'), 'pay panel marker');
assert.ok(html.includes('Payroll is Admin-only.'), 'polite payroll reply');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-10-08-pay-admin1"'), 'pay-admin1 meta follows the first');
assert.ok(!html.includes('location.search') || html.indexOf('function payAdmin1MaybeLoad') < 0 || !html.slice(html.indexOf('function payAdmin1MaybeLoad'), html.indexOf('function payAdmin1MaybeLoad') + 400).includes('?v='), 'loader does not stick a Home Screen ?v=');

const panelAt = html.indexOf('id="payReady"');
const panelTag = html.slice(html.lastIndexOf('<section', panelAt), html.indexOf('>', panelAt) + 1);
assert.ok(panelTag.includes('data-layout-roles="Admin"'), 'pay readiness panel is Admin only');
assert.ok(!panelTag.includes('Scheduler'), 'pay readiness panel does not list Scheduler');

function slice(startMark, endMark){
  const start = html.indexOf(startMark);
  const end = html.indexOf(endMark);
  assert.ok(start > 0 && end > start, startMark);
  return html.slice(start, end);
}

function el(id){
  return {
    id: id,
    hidden: false,
    innerHTML: 'stale',
    textContent: '',
    attrs: {},
    setAttribute: function(name, value){
      this.attrs[name] = value;
      if(name === 'hidden')this.hidden = true;
    },
    removeAttribute: function(name){
      delete this.attrs[name];
      if(name === 'hidden')this.hidden = false;
    }
  };
}

const payReady = el('payReady');
const payRows = el('payReadyRows');
const calls = [];
const sandbox = {
  currentAdminRole: 'Scheduler',
  console: console,
  Intl: Intl,
  Date: Date,
  URL: URL,
  Blob: Blob,
  document: {
    getElementById: function(id){
      if(id === 'payReady')return payReady;
      if(id === 'payReadyRows')return payRows;
      return null;
    }
  },
  sbRestRpc: async function(name, body){
    calls.push({name: name, body: body});
    if(name === 'admin_timesheet_pay_readiness'){
      return {ok: true, data: {success: true, week_start: '2026-09-21', week_end: '2026-09-27', ready_count: 1, held_count: 0, rows: [{timesheet_id: 'ts-1', aide_name: 'Maya Brooks', pay_status: 'ready', checklist: {submitted: true, save_day_complete: true, signature: true, office_review: 'clear'}}]}};
    }
    if(name === 'admin_get_pay_dispute_evidence'){
      return {ok: true, data: {aide_name: 'Jamal', on_date: '2026-09-25', client_name: 'Test Client Alpha', shift: {is_completed: true, is_missed: false, status_label: 'Completed'}}};
    }
    if(name === 'admin_draft_pay_dispute_reply')return {ok: true, data: {draft_reply: 'Record shows the shift.'}};
    if(name === 'admin_parse_remi_payroll_range')return {ok: true, data: {start_date: '2026-09-14', end_date: '2026-09-27', start_date_display: '09/14/2026', end_date_display: '09/27/2026'}};
    if(name === 'admin_get_remi_payroll_report' || name === 'admin_run_remi_payroll_report' || name === 'admin_export_remi_payroll' || name === 'admin_set_remi_payroll_range_prefs'){
      return {ok: true, data: {success: true, aides: []}};
    }
    return {ok: true, data: {success: true}};
  }
};
vm.createContext(sandbox);
vm.runInContext(slice('// remi payroll1 v=remi-payroll1', '// end remi payroll1 v=remi-payroll1'), sandbox);
vm.runInContext(slice('// remi ideas763 v=remi-ideas763', '// end remi ideas763 v=remi-ideas763'), sandbox);
vm.runInContext(slice('var PAYREADY_MARKER', 'function timesheetPdfAvailable'), sandbox);

(async function(){
assert.strictEqual(sandbox.payAdmin1IsAdmin(), false, 'Scheduler is not Admin');
assert.strictEqual(sandbox.remiPayroll1OfficeOk(), false, 'payroll office gate is Admin-only');
assert.strictEqual(sandbox.remiIdeas763OfficeOk(), true, 'Scheduler still uses the rest of Remi ideas');
assert.strictEqual(sandbox.remiIdeas763PayAdminOk(), false, 'pay-dispute card is Admin-only');

const skipped = sandbox.payAdmin1MaybeLoad();
assert.strictEqual(skipped, null, 'Scheduler skips payReadyLoad');
assert.strictEqual(payReady.hidden, true, 'Scheduler pay panel is hidden');
assert.strictEqual(payRows.innerHTML, '', 'Scheduler pay rows are cleared');
assert.strictEqual(calls.length, 0, 'skip does not call a pay RPC');

const loaded = await sandbox.payReadyLoad();
assert.strictEqual(loaded, null);
const fetched = await sandbox.payReadyFetchAce('2026-09-21');
assert.strictEqual(fetched.adminOnly, true);
assert.strictEqual(await sandbox.payReadyHold(), undefined);
assert.strictEqual(await sandbox.payReadyExport(), '');
assert.strictEqual(calls.length, 0, 'Scheduler timesheet pay RPCs stay uncalled');

const ask = sandbox.remiPayroll1FromAsk('run payroll for last week');
assert.strictEqual(ask.text, 'Payroll is Admin-only.');
assert.ok(!ask.payrollQuery, 'polite reply does not queue a payroll lookup');
sandbox.copilotChat = [{payrollQuery: 'run payroll', text: 'Checking that payroll range.', payroll: {chip: 'Payroll range', sent: false, draft: null, error: ''}}];
sandbox.copilotView = 'chat';
const looked = await sandbox.remiPayroll1Lookup(0);
assert.strictEqual(looked.adminOnly, true);
assert.strictEqual(sandbox.copilotChat[0].text, 'Payroll is Admin-only.');
assert.strictEqual(await sandbox.remiPayroll1Load().then(function(got){return got.forbidden;}), true);
assert.strictEqual((await sandbox.remiPayroll1Run()).forbidden, true);
assert.strictEqual((await sandbox.remiPayroll1Export('csv')).forbidden, true);
assert.strictEqual(calls.length, 0, 'Scheduler payroll RPCs stay uncalled');

const pay = await sandbox.remiIdeas763OpenPay({id: 'aide-1', name: 'Jamal'}, 'Why am I not getting paid?', '2026-09-25');
assert.strictEqual(pay.adminOnly, true);
assert.strictEqual(pay.status, 42501);
const sent = await sandbox.remiIdeas763PaySend();
assert.strictEqual(sent.adminOnly, true);
const direct = await sandbox.remiIdeas763Rpc('admin_get_pay_dispute_evidence', {p_aide_id: 'aide-1'});
assert.strictEqual(direct.adminOnly, true);
assert.strictEqual(calls.length, 0, 'Scheduler pay-dispute RPCs stay uncalled');
sandbox.aidechatSelectedId = 'thread-1';
sandbox.aidechatFind = function(){
  return {aide_id: 'aide-1', name: 'Jamal', id: 'thread-1', messages: [{sender: 'aide', body: 'Why am I not getting paid?'}]};
};
sandbox.remiIdeas763AfterThread();
assert.strictEqual(calls.length, 0, 'Messages pay-dispute open does not call Ace');
assert.notStrictEqual(sandbox.remiIdeas763Mode, 'pay');

sandbox.currentAdminRole = 'Nurse';
assert.strictEqual(sandbox.payAdmin1IsAdmin(), false);
assert.strictEqual(sandbox.remiPayroll1FromAsk('run payroll'), null, 'Nurse payroll ask stays closed');
assert.strictEqual((await sandbox.remiPayroll1Rpc('admin_get_remi_payroll_report', {})).forbidden, true);
assert.strictEqual((await sandbox.remiIdeas763OpenPay({id: 'aide-1', name: 'Jamal'}, 'not getting paid', '2026-09-25')).status, 42501);
assert.strictEqual(calls.length, 0, 'Nurse pay and payroll RPCs stay uncalled');
assert.strictEqual(sandbox.remiIdeas763OfficeOk(), false, 'Nurse stays out of Remi ideas');

sandbox.currentAdminRole = 'Admin';
payReady.hidden = true;
calls.length = 0;
const adminLoad = await sandbox.payReadyLoad();
assert.ok(adminLoad && adminLoad.rows && adminLoad.rows.length, 'Admin still loads pay readiness');
assert.strictEqual(calls[0].name, 'admin_timesheet_pay_readiness');
assert.strictEqual(payReady.hidden, false, 'Admin pay panel stays visible');
const adminAsk = sandbox.remiPayroll1FromAsk('run payroll');
assert.ok(adminAsk && adminAsk.payrollQuery, 'Admin payroll ask still opens the range');
assert.strictEqual(sandbox.remiPayroll1OfficeOk(), true);
assert.strictEqual(sandbox.remiIdeas763PayAdminOk(), true);
calls.length = 0;
const adminPay = await sandbox.remiIdeas763OpenPay({id: 'aide-1', name: 'Jamal'}, 'Why am I not getting paid?', '2026-09-25');
assert.strictEqual(adminPay.ok, true);
assert.ok(calls.some(function(row){return row.name === 'admin_get_pay_dispute_evidence';}));
assert.ok(calls.some(function(row){return row.name === 'admin_draft_pay_dispute_reply';}));
const evidence = sandbox.remiIdeas763PayHtml();
assert.ok(evidence.indexOf('Draft Admin reply') >= 0, 'Admin pay-dispute card still paints');

console.log('admin-pay-admin1-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
