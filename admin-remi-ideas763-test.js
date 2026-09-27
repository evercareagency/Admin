#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-ideas763'), 'remi-ideas763 marker');
assert.ok(html.includes('data-remi-ideas763="v=remi-ideas763"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-ideas763'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-ideas763">'), 'meta');
assert.ok(html.includes('<!-- remi ideas 763 2026-09-27 v=remi-ideas763 admin-build 2026-09-27-remi-ideas763'), 'comment');
assert.ok(html.includes("var REMI_IDEAS763_MARKER='v=remi-ideas763'"), 'script marker');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('GHOST-REMI-IDEAS763-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('id="remiIdeasHost"'), 'rail host');
assert.ok(html.includes('id="remiFloatHost"'), 'float host stays');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(!html.includes('admin_why_open'), 'does not use the retired why-open name');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-aide-text-chat1'), 'first admin-build is remi-ideas763');
assert.ok(html.indexOf('content="2026-09-27-remi-ideas763"') < html.indexOf('content="2026-09-27-remi-float-noshow1"'), 'float meta stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-remi-float-noshow1"') < html.indexOf('content="2026-09-27-remi-proof1"'), 'proof stays after float');
['v=remi-float-noshow1','v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=coverage-simple1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-noshow1">'), 'float meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage meta stays');
assert.ok(html.includes('Ignore remi-ideas763 and 03-why-open'), 'float marker still ignores this tip inside its own note');

const start = html.indexOf('// remi ideas763 v=remi-ideas763');
const end = html.indexOf('// end remi ideas763 v=remi-ideas763');
assert.ok(start > 0 && end > start, 'script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_get_open_shift_why'), 'why rpc');
assert.ok(src.includes('admin_list_cover_attempts'), 'attempts rpc');
assert.ok(src.includes('admin_rank_float_pool_aides'), 'float rank rpc');
assert.ok(src.includes('admin_blast_cover_request'), 'existing blast rpc');
assert.ok(src.includes('admin_dismiss_why_open'), 'dismiss rpc');
assert.ok(src.includes('admin_get_aide_preferred_language'), 'language get');
assert.ok(src.includes('admin_set_aide_preferred_language'), 'language set');
assert.ok(src.includes('admin_draft_bilingual_cover_ask'), 'bilingual draft');
assert.ok(src.includes('admin_send_bilingual_cover_in_messages'), 'send in messages');
assert.ok(src.includes('admin_get_pay_dispute_evidence'), 'pay evidence');
assert.ok(src.includes('admin_draft_pay_dispute_reply'), 'pay draft');
assert.ok(src.includes('admin_send_aide_office_message'), 'office send');
assert.ok(src.includes('sms_send.implemented=false'), 'sms mock flag');
assert.ok(src.includes('sms_send.oos=true'), 'sms out of scope');
assert.ok(src.includes('is_scheduler_office'), 'office gate');
assert.ok(src.includes('sbRestRpc'), 'office JWT via sbRestRpc');
assert.ok(src.includes('42501'), 'nurse 42501');
assert.ok(src.includes('No payroll writeback'), 'no payroll writeback');
assert.ok(!src.includes('admin_rank_backup_aides'), 'does not replace backup rank');
assert.ok(!src.includes('admin_confirm_cover_send'), 'does not replace cover confirm');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms|sms:/.test(src), 'no SMS provider');
assert.ok(!/admin_update_payroll|upsert_timesheet|payroll_write/.test(src), 'no payroll callable');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'coverage blast stays');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'coverage confirm stays');
assert.ok(simple.includes("coverRpc('rank'"), 'coverage rank stays');
assert.ok(!simple.includes('admin_get_open_shift_why'), 'why open is not inside coverage-simple1');
assert.ok(!simple.includes('admin_send_bilingual_cover_in_messages'), 'bilingual send is not inside coverage-simple1');

const floatStart = html.indexOf('// remi float noshow1 v=remi-float-noshow1');
const floatEnd = html.indexOf('// end remi float noshow1 v=remi-float-noshow1');
const floatSrc = html.slice(floatStart, floatEnd);
assert.ok(floatSrc.includes('admin_rank_float_pool_aides'), 'float rank stays');
assert.ok(floatSrc.includes('admin_list_due_noshow_rescues'), 'noshow list stays');
assert.ok(floatSrc.includes('admin_confirm_noshow_rescue'), 'noshow confirm stays');
assert.ok(!floatSrc.includes('admin_get_open_shift_why'), 'why open is not inside float-noshow1');
assert.ok(!floatSrc.includes('admin_dismiss_why_open'), 'why dismiss is not inside float-noshow1');

const SHIFT = '55555555-5555-4555-8555-555555555555';
const AIDE = '44444444-4444-4444-8444-444444444445';
const DEVON = '44444444-4444-4444-8444-444444444441';
const WHY = {
  success: true,
  ok: true,
  marker: 'remi-ideas763',
  v: 'remi-ideas763',
  open_shift_id: SHIFT,
  client_name: 'Bowlax',
  window_label: 'Sun 9:00 AM\u20131:00 PM',
  attempts: []
};
const ATTEMPTS = {
  success: true,
  attempts: [
    {when_label: 'Sat 4:18 PM', who_label: 'Blasted by Remi \u00b7 8 aides', status: 'no', detail: 'Devon, Lina, Sara all said no \u00b7 others silent past window'},
    {when_label: 'Sat 7:02 PM', who_label: 'Blasted by Moe \u00b7 float pool 5', status: 'ghost', detail: 'Jamal opened blast \u00b7 no reply'},
    {when_label: 'Sun 7:40 AM', who_label: 'Blasted by Remi \u00b7 Aisha yes', status: 'dropped', detail: 'Aisha said yes then dropped at 8:55 \u00b7 hole reopened'}
  ]
};
const RANK = {
  success: true,
  open_shift_id: SHIFT,
  assigned_aide_id: AIDE,
  float_pool: [
    {rank: 1, aide_id: DEVON, name: 'Devon', is_float: true, same_day_yes_30d: 8}
  ],
  rest: [
    {rank: 2, aide_id: AIDE, name: 'Maria', is_float: false}
  ]
};
const DRAFT = {
  success: true,
  marker: 'remi-ideas763',
  admin_language: 'en',
  target_language: 'es',
  language_label: 'Espa\u00f1ol',
  english_draft: 'Hi Maria \u2014 can you cover Bowlax Sunday 9\u20131? Reply Yes or No.',
  translated_body: 'Hola Maria \u2014 \u00bfpuedes cubrir Bowlax el domingo de 9:00 a 1:00? Responde S\u00ed o No. \u2014 EverCare / Remi',
  preview_body: 'Hola Maria \u2014 \u00bfpuedes cubrir Bowlax el domingo de 9:00 a 1:00? Responde S\u00ed o No. \u2014 EverCare / Remi',
  sms_send: {implemented: true, oos: false}
};
const PAY = {
  success: true,
  marker: 'remi-ideas763',
  aide_name: 'Jamal',
  on_date: '2026-09-25',
  client_name: 'Bowlax',
  shift: {
    scheduled_label: '8:00\u20134:00',
    clock_in: '07:58',
    clock_out: '16:03',
    status_label: 'Completed \u00b7 no Missed',
    is_missed: false,
    is_completed: true
  },
  signature: {present: true, client_sig: true, label: 'Client signature on file', captured_label: 'Captured 4:02 PM'},
  draft_reply: ''
};

function runSlice(){
  const sandbox = {
    currentAdminRole: 'Admin',
    console: console,
    Intl: Intl,
    Date: Date,
    JSON: JSON,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    isFinite: isFinite
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_IDEAS763_MARKER, 'v=remi-ideas763');
  assert.strictEqual(sandbox.REMI_IDEAS763_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.remiIdeas763SmsSend().implemented, false);
  assert.strictEqual(sandbox.remiIdeas763SmsSend().oos, true);
  assert.strictEqual(sandbox.remiIdeas763Mdy('2026-09-25'), '09/25/2026');
  assert.ok(sandbox.remiIdeas763DateLine('2026-09-25').indexOf('09/25/2026') >= 0);
  assert.strictEqual(sandbox.remiIdeas763PayDate('I worked Thursday. Why am I not getting paid?', new Date('2026-09-27T16:00:00Z')), '2026-09-24');
  assert.strictEqual(sandbox.remiIdeas763PayDate('Thu Sep 25 Bowlax', new Date('2026-09-27T16:00:00Z')), '2026-09-25');
  assert.ok(sandbox.remiIdeas763LooksLikePay('Why am I not getting paid?'));
  assert.ok(!sandbox.remiIdeas763LooksLikePay('Can you cover Bowlax Sunday?'));
  assert.strictEqual(sandbox.remiIdeas763NormLang('Espa\u00f1ol'), 'es');
  assert.strictEqual(sandbox.remiIdeas763LangLabel('es'), 'Espa\u00f1ol');
  const whyBody = sandbox.remiIdeas763WhyBody(SHIFT, 3);
  assert.strictEqual(whyBody.p_open_shift_id, SHIFT);
  assert.strictEqual(whyBody.p_limit, 3);
  assert.strictEqual(JSON.stringify(sandbox.remiIdeas763DismissBody(SHIFT)), JSON.stringify({p_open_shift_id: SHIFT}));
  assert.strictEqual(sandbox.remiIdeas763LangSetBody(AIDE, 'es').p_language, 'es');
  const ids = sandbox.remiIdeas763FloatIds(RANK);
  assert.strictEqual(ids.length, 1);
  assert.strictEqual(ids[0], DEVON);
  const blastBody = sandbox.remiIdeas763BlastBody(SHIFT, ids);
  assert.strictEqual(blastBody.p_open_shift_id, SHIFT);
  assert.strictEqual(blastBody.p_address_mode, 'area');
  assert.ok(blastBody.p_aide_ids.indexOf(DEVON) >= 0);
  assert.ok(blastBody.p_aide_ids.indexOf(AIDE) < 0);

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'admin_get_open_shift_why')return {ok: true, data: WHY};
    if(name === 'admin_list_cover_attempts')return {ok: true, data: ATTEMPTS};
    if(name === 'admin_rank_float_pool_aides')return {ok: true, data: RANK};
    if(name === 'admin_blast_cover_request')return {ok: true, data: {success: true, blast_count: (body.p_aide_ids || []).length, assigned: false}};
    if(name === 'admin_dismiss_why_open')return {ok: true, data: {success: true, dismissed: true}};
    if(name === 'admin_get_aide_preferred_language')return {ok: true, data: {preferred_language: 'es', phone: '+1 (216) 555-0142'}};
    if(name === 'admin_set_aide_preferred_language')return {ok: true, data: {preferred_language: body.p_language}};
    if(name === 'admin_draft_bilingual_cover_ask')return {ok: true, data: Object.assign({}, DRAFT, {sms_send: {implemented: true, oos: false}})};
    if(name === 'admin_send_bilingual_cover_in_messages')return {ok: true, data: {success: true, sms_sent: false}};
    if(name === 'admin_get_pay_dispute_evidence')return {ok: true, data: PAY};
    if(name === 'admin_draft_pay_dispute_reply')return {ok: true, data: {draft_reply: 'Jamal \u2014 you are right. Record shows Bowlax 09/25/2026. No Missed flag.'}};
    if(name === 'admin_send_aide_office_message')return {ok: true, data: {success: true}};
    return {ok: false, error: 'unexpected ' + name};
  };

  const opened = await sandbox.remiIdeas763OpenWhy(SHIFT);
  assert.strictEqual(opened.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_get_open_shift_why');
  assert.strictEqual(rpc[0].body.p_open_shift_id, SHIFT);
  assert.strictEqual(rpc[1].name, 'admin_list_cover_attempts');
  assert.strictEqual(rpc[1].body.p_limit, 3);
  const card = sandbox.remiIdeas763WhyHtml();
  assert.ok(card.indexOf('Why open') >= 0, card);
  assert.ok(card.indexOf('Bowlax') >= 0, card);
  assert.ok(card.indexOf('Sat 4:18 PM') >= 0, card);
  assert.ok(card.indexOf('Blasted by Remi') >= 0, card);
  assert.ok(card.indexOf('>No<') >= 0, card);
  assert.ok(card.indexOf('>Ghost<') >= 0, card);
  assert.ok(card.indexOf('>Dropped<') >= 0, card);
  assert.ok(card.indexOf('Devon, Lina, Sara') >= 0, card);
  assert.ok(card.indexOf('Blast float pool') >= 0, card);
  assert.ok(card.indexOf('>Dismiss<') >= 0, card);
  assert.ok(card.indexOf('when_label') < 0);

  rpc.length = 0;
  const blasted = await sandbox.remiIdeas763BlastFloat(SHIFT);
  assert.strictEqual(blasted.ok, true);
  const names = rpc.map(function(row){return row.name;});
  assert.ok(names.indexOf('admin_rank_float_pool_aides') === 0, names.join(','));
  assert.ok(names.indexOf('admin_blast_cover_request') === 1, names.join(','));
  const blast = rpc[1];
  assert.strictEqual(blast.body.p_open_shift_id, SHIFT);
  assert.ok(blast.body.p_aide_ids.indexOf(DEVON) >= 0);
  assert.ok(blast.body.p_aide_ids.indexOf(AIDE) < 0, 'assigned aide is not blasted');
  assert.ok(names.indexOf('admin_rank_backup_aides') < 0);
  assert.ok(names.indexOf('admin_confirm_cover_send') < 0);

  rpc.length = 0;
  const dismissed = await sandbox.remiIdeas763Dismiss(SHIFT);
  assert.strictEqual(dismissed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_dismiss_why_open');
  assert.strictEqual(rpc.length, 1, 'dismiss does not blast');
  const after = sandbox.remiIdeas763WhyHtml();
  assert.ok(after.indexOf('Sat 4:18 PM') >= 0, 'history stays');
  assert.ok(after.indexOf('Dismissed. Coverage history stays') >= 0, after);
  assert.ok(after.indexOf('Blast float pool') < 0, 'dismissed card drops the blast button');

  rpc.length = 0;
  const bilingual = await sandbox.remiIdeas763OpenBilingual({id: AIDE, name: 'Maria'}, 'Hi Maria \u2014 can you cover Bowlax Sunday 9\u20131? Reply Yes or No.');
  assert.strictEqual(bilingual.ok, true);
  assert.ok(rpc.some(function(row){return row.name === 'admin_get_aide_preferred_language';}));
  assert.ok(rpc.some(function(row){return row.name === 'admin_draft_bilingual_cover_ask';}));
  const ask = sandbox.remiIdeas763BilingualHtml();
  assert.ok(ask.indexOf('Espa\u00f1ol') >= 0, ask);
  assert.ok(ask.indexOf('Hola Maria') >= 0, ask);
  assert.ok(ask.indexOf('Your English draft') >= 0, ask);
  assert.ok(ask.indexOf('Send in Messages') >= 0, ask);
  assert.ok(ask.indexOf('Send SMS') >= 0, ask);
  assert.ok(ask.indexOf('data-sms-oos="true"') >= 0, ask);
  assert.strictEqual(sandbox.remiIdeas763Draft.sms_send.implemented, false);
  assert.strictEqual(sandbox.remiIdeas763Draft.sms_send.oos, true);
  rpc.length = 0;
  const sms = sandbox.remiIdeas763SendSms();
  assert.strictEqual(sms.sent, false);
  assert.strictEqual(sms.sms_sent, false);
  assert.strictEqual(sms.sms_send.implemented, false);
  assert.strictEqual(rpc.length, 0, 'Send SMS does not call a provider');
  const sent = await sandbox.remiIdeas763SendInMessages();
  assert.strictEqual(sent.ok, true);
  assert.strictEqual(sent.sms_sent, false);
  assert.strictEqual(rpc.length, 1);
  assert.strictEqual(rpc[0].name, 'admin_send_bilingual_cover_in_messages');
  assert.ok(rpc[0].body.p_body.indexOf('Hola Maria') === 0);
  assert.strictEqual(rpc[0].body.p_aide_id, AIDE);
  assert.ok(!rpc.some(function(row){return /sms|quo|twilio/i.test(row.name);}));

  rpc.length = 0;
  const flipped = await sandbox.remiIdeas763SetLang('en');
  assert.strictEqual(flipped.ok, true);
  const setCall = rpc.filter(function(row){return row.name === 'admin_set_aide_preferred_language';})[0];
  assert.ok(setCall);
  assert.strictEqual(setCall.body.p_language, 'en');
  assert.strictEqual(setCall.body.p_aide_id, AIDE);

  rpc.length = 0;
  const pay = await sandbox.remiIdeas763OpenPay({id: '44444444-4444-4444-8444-444444444444', name: 'Jamal', thread_id: 'thread-jamal'}, 'I worked Thursday. Why am I not getting paid?', '2026-09-25');
  assert.strictEqual(pay.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_get_pay_dispute_evidence');
  assert.strictEqual(rpc[0].body.p_on_date, '2026-09-25');
  assert.strictEqual(rpc[1].name, 'admin_draft_pay_dispute_reply');
  const evidence = sandbox.remiIdeas763PayHtml();
  assert.ok(evidence.indexOf('09/25/2026') >= 0, evidence);
  assert.ok(evidence.indexOf('Bowlax') >= 0, evidence);
  assert.ok(evidence.indexOf('8:00') >= 0, evidence);
  assert.ok(evidence.indexOf('7:58 AM') >= 0, evidence);
  assert.ok(evidence.indexOf('4:03 PM') >= 0, evidence);
  assert.ok(evidence.indexOf('Completed') >= 0, evidence);
  assert.ok(evidence.indexOf('Client signature on file') >= 0, evidence);
  assert.ok(evidence.indexOf('Draft Admin reply') >= 0, evidence);
  assert.ok(evidence.indexOf('No payroll change') >= 0, evidence);
  assert.ok(!/20\d{2}-\d{2}-\d{2}/.test(evidence), evidence);
  rpc.length = 0;
  const paySent = await sandbox.remiIdeas763PaySend();
  assert.strictEqual(paySent.ok, true);
  assert.strictEqual(rpc.length, 1);
  assert.strictEqual(rpc[0].name, 'admin_send_aide_office_message');
  assert.ok(rpc[0].body.p_body.indexOf('Jamal') >= 0);
  assert.strictEqual(rpc[0].body.p_aide_id, '44444444-4444-4444-8444-444444444444');
  assert.ok(!rpc.some(function(row){return /payroll|timesheet/i.test(row.name);}));

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurseWhy = await sandbox.remiIdeas763OpenWhy(SHIFT);
  const nurseBlast = await sandbox.remiIdeas763BlastFloat(SHIFT);
  const nursePay = await sandbox.remiIdeas763OpenPay({id: AIDE, name: 'Jamal'}, 'not getting paid', '2026-09-25');
  const nurseMsg = await sandbox.remiIdeas763SendInMessages();
  assert.strictEqual(nurseWhy.status, 42501);
  assert.strictEqual(nurseBlast.status, 42501);
  assert.strictEqual(nursePay.status, 42501);
  assert.strictEqual(nurseMsg.status, 42501);
  assert.strictEqual(rpc.length, 0, 'nurse is not sent to Ace');
  assert.strictEqual(sandbox.remiIdeas763Paint(), '');

  sandbox.currentAdminRole = 'Admin';
  rpc.length = 0;
  sandbox.sbRestRpc = async function(){
    return {ok: false, status: 42501, error: '42501 is_scheduler_office'};
  };
  const denied = await sandbox.remiIdeas763Rpc('admin_get_open_shift_why', {p_open_shift_id: SHIFT});
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(denied.status, 42501);

  console.log('admin-remi-ideas763-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
