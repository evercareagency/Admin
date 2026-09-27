#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-langs1'), 'remi-langs1 marker');
assert.ok(html.includes('data-remi-langs1="v=remi-langs1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-langs1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-langs1">'), 'meta');
assert.ok(html.includes('<!-- remi langs 2026-09-27 v=remi-langs1 admin-build 2026-09-27-remi-langs1'), 'comment');
assert.ok(html.includes("var REMI_LANGS1_MARKER='v=remi-langs1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-LANGS1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('id="remiLangsHost"'), 'rail host');
assert.ok(html.includes('id="remiLangsAideCard"'), 'aide settings card');
assert.ok(html.includes('id="remiLangsMsgCard"'), 'messages preview');
assert.ok(html.includes('id="remiIdeasHost"'), 'ideas host stays');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-langs1'), 'first admin-build is remi-langs1');
assert.ok(html.indexOf('content="2026-09-27-remi-langs1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc stays after cover-card-cancel1');
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-cover-unselect1"'), 'cover-unselect stays after nosvc');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll stays after cover-unselect');
assert.ok(html.indexOf('content="2026-09-27-remi-payroll1"') < html.indexOf('content="2026-09-27-client-ins1"'), 'client-ins1 stays after payroll');
assert.ok(html.indexOf('content="2026-09-27-client-ins1"') < html.indexOf('content="2026-09-27-remi-ideas763"'), 'ideas763 stays after client-ins1');
assert.ok(html.indexOf('content="2026-09-27-remi-ideas763"') < html.indexOf('content="2026-09-27-remi-float-noshow1"'), 'float stays after ideas763');
assert.ok(html.indexOf('content="2026-09-27-remi-float-noshow1"') < html.indexOf('content="2026-09-27-remi-proof1"'), 'proof stays');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'sched stays');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'rules stays');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis stays');
['v=hold-clear1','v=sched-time-tap1','v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','v=cancel-shift1','v=cover-unselect1','v=remi-payroll1','v=client-ins1','v=remi-ideas763','v=remi-float-noshow1','v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=coverage-simple1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-client-ins1">'), 'client-ins1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-ideas763">'), 'ideas763 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage meta stays');

const start = html.indexOf('// remi langs1 v=remi-langs1');
const end = html.indexOf('// end remi langs1 v=remi-langs1');
assert.ok(start > 0 && end > start, 'script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_list_aide_preferred_languages'), 'list rpc');
assert.ok(src.includes('admin_get_aide_preferred_language'), 'get rpc');
assert.ok(src.includes('admin_set_aide_preferred_language'), 'set rpc');
assert.ok(src.includes('admin_draft_bilingual_cover_ask'), 'draft rpc');
assert.ok(src.includes('drop the previous draft'), 'hard wire drops the stale draft');
assert.ok(src.includes('Never paint english_draft or source_body'), 'hard wire skips english fields');
assert.ok(src.includes("row.paint='preview_body'"), 'paint stays preview_body');
assert.ok(src.includes("row.admin_language='en'"), 'admin language stays en');
assert.ok(src.includes('admin_send_bilingual_cover_in_messages'), 'send in messages');
assert.ok(src.includes('sms_send.implemented=false'), 'sms mock flag');
assert.ok(src.includes('sms_send.oos=true'), 'sms out of scope');
assert.ok(src.includes('is_scheduler_office'), 'office gate');
assert.ok(src.includes('sbRestRpc'), 'office JWT via sbRestRpc');
assert.ok(src.includes('42501'), 'nurse 42501');
assert.ok(src.includes('22023'), 'somali 22023');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms|sms:/.test(src), 'no SMS provider');
assert.ok(!src.includes('>Somali<') && !src.includes('value="so"'), 'picker source has no Somali option');

const ideasStart = html.indexOf('// remi ideas763 v=remi-ideas763');
const ideasEnd = html.indexOf('// end remi ideas763 v=remi-ideas763');
const ideas = html.slice(ideasStart, ideasEnd);
assert.ok(ideas.includes('admin_get_open_shift_why'), 'why open stays');
assert.ok(ideas.includes('admin_dismiss_why_open'), 'why dismiss stays');
assert.ok(ideas.includes('admin_get_pay_dispute_evidence'), 'pay dispute stays');
assert.ok(ideas.includes('admin_draft_pay_dispute_reply'), 'pay draft stays');
assert.ok(ideas.includes('admin_send_aide_office_message'), 'office send stays');
assert.ok(ideas.includes('admin_draft_bilingual_cover_ask'), 'ES bilingual draft stays');
assert.ok(ideas.includes("==='es'") && /Espa/.test(ideas), 'ES label stays in ideas763');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'coverage blast stays');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'coverage confirm stays');
const floatStart = html.indexOf('// remi float noshow1 v=remi-float-noshow1');
const floatEnd = html.indexOf('// end remi float noshow1 v=remi-float-noshow1');
const floatSrc = html.slice(floatStart, floatEnd);
assert.ok(floatSrc.includes('admin_confirm_noshow_rescue'), 'noshow confirm stays');
assert.ok(!floatSrc.includes('admin_list_aide_preferred_languages'), 'langs list is not inside float');

const AIDE = '44444444-4444-4444-8444-444444444445';
const ORDER = ['en','es','ar','sw','zh','ru','uk'];
const LABELS = ['English','Spanish','Arabic','Swahili','Chinese','Russian','Ukrainian'];
const LIST = {
  success: true,
  marker: 'remi-langs1',
  v: 'remi-langs1',
  languages: [
    {code:'uk', label:'Ukrainian'},
    {code:'so', label:'Somali'},
    {code:'en', label:'English'},
    {code:'zh', label:'Chinese'},
    {code:'ru', label:'Russian'},
    {code:'es', label:'Espa\u00f1ol'},
    {code:'sw', label:'Swahili'},
    {code:'ar', label:'Arabic'}
  ]
};
const EN = 'Hi Fatima \u2014 can you cover Bowlax Sunday 9:00 AM\u20131:00 PM? Reply Yes or No.';
const AR = '\u0645\u0631\u062d\u0628\u0627 Fatima \u2014 \u0647\u0644 \u064a\u0645\u0643\u0646\u0643 \u062a\u063a\u0637\u064a\u0629 Bowlax \u064a\u0648\u0645 \u0627\u0644\u0623\u062d\u062f \u0645\u0646 9:00 AM\u20131:00 PM\u061f \u0623\u062c\u0628 \u0628\u0646\u0639\u0645 \u0623\u0648 \u0644\u0627. \u2014 EverCare / Remi';

function runSlice(){
  const sandbox = {
    currentAdminRole: 'Admin',
    currentAdminUsername: 'mo@evercare.test',
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
  assert.strictEqual(sandbox.REMI_LANGS1_MARKER, 'v=remi-langs1');
  assert.strictEqual(sandbox.REMI_LANGS1_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.remiLangs1SmsSend().implemented, false);
  assert.strictEqual(sandbox.remiLangs1SmsSend().oos, true);
  assert.strictEqual(sandbox.remiLangs1Mdy('2026-09-27'), '09/27/2026');
  assert.strictEqual(sandbox.remiLangs1Canonical(''), 'en');
  assert.strictEqual(sandbox.remiLangs1Canonical('Espa\u00f1ol'), 'es');
  assert.strictEqual(sandbox.remiLangs1Canonical('zh-Hans'), 'zh');
  assert.strictEqual(sandbox.remiLangs1Canonical('ar-SA'), 'ar');
  assert.strictEqual(sandbox.remiLangs1Canonical('somali'), null);
  assert.strictEqual(sandbox.remiLangs1Canonical('so'), null);
  assert.strictEqual(sandbox.remiLangs1Label('es'), 'Spanish');
  assert.strictEqual(sandbox.remiLangs1ReadLang({}), 'en');
  assert.strictEqual(sandbox.remiLangs1ReadLang({preferred_language:''}), 'en');
  assert.strictEqual(sandbox.remiLangs1ReadLang({preferred_language:'ar'}), 'ar');
  const langs = sandbox.remiLangs1LanguagesFrom(LIST);
  assert.strictEqual(langs.map(function(row){return row.code;}).join(','), ORDER.join(','));
  assert.strictEqual(langs.map(function(row){return row.label;}).join(','), LABELS.join(','));
  assert.ok(!langs.some(function(row){return row.code==='so'||row.label==='Somali';}));
  sandbox.remiLangs1Languages = langs;
  sandbox.remiLangs1Lang = 'ar';
  const options = sandbox.remiLangs1OptionsHtml('ar');
  var cursor = -1;
  LABELS.forEach(function(label){
    var at = options.indexOf('>'+label+'<');
    assert.ok(at > cursor, label);
    cursor = at;
  });
  assert.ok(options.indexOf('Somali') < 0, options);
  assert.ok(options.indexOf('value="so"') < 0, options);
  assert.ok(options.indexOf('selected') >= 0 && options.indexOf('value="ar" selected') >= 0, options);

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body||{}});
    if(name==='admin_list_aide_preferred_languages')return {ok:true, data:LIST};
    if(name==='admin_get_aide_preferred_language')return {ok:true, data:{preferred_language: body && body.p_aide_id ? 'ar' : '', phone:'+1 (216) 555-0142', marker:'remi-langs1'}};
    if(name==='admin_set_aide_preferred_language')return {ok:true, data:{preferred_language: body.p_language, marker:'remi-langs1'}};
    if(name==='admin_draft_bilingual_cover_ask'){
      return {ok:true, data:{
        success:true,
        marker:'remi-langs1',
        admin_language:'en',
        target_language: body.p_target_lang,
        language_label:'Arabic',
        english_draft: body.p_english_body || EN,
        translated_body: body.p_target_lang==='ar' ? AR : 'Hola Fatima',
        preview_body: body.p_target_lang==='ar' ? AR : 'Hola Fatima',
        sms_send:{implemented:true, oos:false}
      }};
    }
    if(name==='admin_send_bilingual_cover_in_messages')return {ok:true, data:{success:true, sms_sent:false}};
    return {ok:false, error:'unexpected '+name};
  };

  const opened = await sandbox.remiLangs1ShowPicker({id:AIDE, name:'Fatima Hassan'});
  assert.strictEqual(opened.ok, true);
  assert.strictEqual(opened.language, 'ar');
  assert.strictEqual(rpc[0].name, 'admin_list_aide_preferred_languages');
  assert.strictEqual(rpc[1].name, 'admin_get_aide_preferred_language');
  assert.strictEqual(rpc[1].body.p_aide_id, AIDE);
  const picker = sandbox.remiLangs1PickerHtml();
  assert.ok(picker.indexOf('Preferred language') >= 0, picker);
  assert.ok(picker.indexOf('Arabic') >= 0, picker);
  assert.ok(picker.indexOf('value="ar" selected') >= 0, picker);
  assert.ok(picker.indexOf('value="so"') < 0, picker);
  assert.ok(picker.indexOf('>Somali<') < 0, picker);
  assert.ok(picker.indexOf('No Somali') >= 0, picker);
  assert.ok(picker.indexOf('chrome stays English') >= 0, picker);

  rpc.length = 0;
  const rejected = await sandbox.remiLangs1Set('so');
  const rejectedName = await sandbox.remiLangs1Set('somali');
  const rejectedFr = await sandbox.remiLangs1Set('fr');
  assert.strictEqual(rejected.status, 22023);
  assert.strictEqual(rejectedName.status, 22023);
  assert.strictEqual(rejectedFr.status, 22023);
  assert.strictEqual(rpc.length, 0, 'rejected languages are not sent');

  rpc.length = 0;
  const setAr = await sandbox.remiLangs1Set('Arabic');
  assert.strictEqual(setAr.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_set_aide_preferred_language');
  assert.strictEqual(rpc[0].body.p_language, 'ar');
  assert.strictEqual(rpc[0].body.p_aide_id, AIDE);

  rpc.length = 0;
  const drafted = await sandbox.remiLangs1ShowDraft({id:AIDE, name:'Fatima Hassan'}, EN, '55555555-5555-4555-8555-555555555555');
  assert.strictEqual(drafted.ok, true);
  const draftCall = rpc.filter(function(row){return row.name==='admin_draft_bilingual_cover_ask';})[0];
  assert.ok(draftCall);
  assert.strictEqual(draftCall.body.p_target_lang, 'ar');
  assert.strictEqual(draftCall.body.p_aide_id, AIDE);
  assert.ok(draftCall.body.p_english_body.indexOf('Fatima') >= 0);
  assert.strictEqual(sandbox.remiLangs1DraftRow.sms_send.implemented, false);
  assert.strictEqual(sandbox.remiLangs1DraftRow.sms_send.oos, true);
  assert.strictEqual(sandbox.remiLangs1DraftRow.admin_language, 'en');
  const card = sandbox.remiLangs1DraftHtml();
  assert.ok(card.indexOf('Cover ask') >= 0, card);
  assert.ok(card.indexOf('Arabic') >= 0, card);
  assert.ok(card.indexOf('is-rtl') >= 0, card);
  assert.ok(card.indexOf(AR) >= 0, card);
  assert.ok(card.indexOf('Send in Messages') >= 0, card);
  assert.ok(card.indexOf('Send SMS') >= 0, card);
  assert.ok(card.indexOf('data-sms-oos="true"') >= 0, card);
  assert.ok(card.indexOf('English source') < 0, card);
  assert.ok(card.indexOf(EN) < 0, 'arabic cover ask does not paint the english draft');
  assert.ok(card.indexOf('source_body') < 0, card);
  assert.ok(card.indexOf('data-paint="preview_body"') >= 0, card);
  assert.ok(card.indexOf('Admin UI stays English') >= 0, card);
  const msg = sandbox.remiLangs1MsgHtml();
  assert.ok(msg.indexOf('Messages') >= 0, msg);
  assert.ok(msg.indexOf(AR) >= 0, msg);
  assert.ok(msg.indexOf('preview') >= 0, msg);
  assert.ok(msg.indexOf('not SMS') >= 0, msg);
  assert.ok(msg.indexOf('English') >= 0, msg);
  assert.ok(msg.indexOf(EN) < 0, 'messages does not paint the english draft');
  assert.ok(msg.indexOf(AR) >= 0, msg);

  rpc.length = 0;
  const sms = sandbox.remiLangs1SendSms();
  assert.strictEqual(sms.sent, false);
  assert.strictEqual(sms.sms_sent, false);
  assert.strictEqual(sms.sms_send.implemented, false);
  assert.strictEqual(sms.sms_send.oos, true);
  assert.strictEqual(rpc.length, 0, 'Send SMS does not call a provider');
  const sent = await sandbox.remiLangs1SendInMessages();
  assert.strictEqual(sent.ok, true);
  assert.strictEqual(sent.sms_sent, false);
  assert.strictEqual(rpc.length, 1);
  assert.strictEqual(rpc[0].name, 'admin_send_bilingual_cover_in_messages');
  assert.strictEqual(rpc[0].body.p_body, AR);
  assert.strictEqual(rpc[0].body.p_target_lang, 'ar');
  assert.strictEqual(rpc[0].body.p_aide_id, AIDE);
  assert.ok(!rpc.some(function(row){return /sms|quo|twilio/i.test(row.name);}));

  const ES = 'Hola Langs1Fatima \u2014 \u00bfpuedes cubrir Bowlax el domingo de 9\u20131? Responde S\u00ed o No. \u2014 EverCare / Remi';
  const EN_FATIMA = 'Hi Langs1Fatima \u2014 can you cover Bowlax Sunday 9\u20131? Reply Yes or No.';
  sandbox.remiLangs1Aide = {id:AIDE, name:'Langs1Fatima', client_name:'Bowlax', window_label:'Sunday 9\u20131'};
  sandbox.remiLangs1English = EN_FATIMA;
  sandbox.remiLangs1Lang = 'en';
  sandbox.remiLangs1Mode = 'draft';
  const stale = {
    target_language:'en',
    preview_body: EN_FATIMA,
    translated_body: EN_FATIMA,
    ui_body: EN_FATIMA,
    english_draft: EN_FATIMA,
    source_body: EN_FATIMA,
    admin_language:'en',
    paint:'preview_body'
  };
  sandbox.remiLangs1DraftRow = stale;
  rpc.length = 0;
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body||{}});
    if(name==='admin_set_aide_preferred_language')return {ok:true, data:{preferred_language:body.p_language, marker:'remi-langs1'}};
    if(name==='admin_draft_bilingual_cover_ask'){
      return {ok:true, data:{
        success:true,
        marker:'remi-langs1',
        v:'remi-langs1',
        admin_language:'es',
        paint:'english_draft',
        target_language:'es',
        english_draft: body.p_english_body || EN_FATIMA,
        source_body: body.p_english_body || EN_FATIMA,
        translated_body: EN_FATIMA + ' \u2014 EverCare / Remi',
        ui_body: ES,
        preview_body: ES,
        sms_send:{implemented:true, oos:false}
      }};
    }
    if(name==='admin_send_bilingual_cover_in_messages')return {ok:true, data:{success:true, sms_sent:false}};
    return {ok:false, error:'unexpected '+name};
  };
  const setEs = await sandbox.remiLangs1Set('es');
  assert.strictEqual(setEs.ok, true);
  assert.ok(rpc.some(function(row){return row.name==='admin_set_aide_preferred_language' && row.body.p_language==='es';}));
  const esDraft = rpc.filter(function(row){return row.name==='admin_draft_bilingual_cover_ask';});
  assert.strictEqual(esDraft.length, 1, 'set re-calls draft once');
  assert.strictEqual(esDraft[0].body.p_target_lang, 'es');
  assert.notStrictEqual(sandbox.remiLangs1DraftRow, stale, 'previous draft is dropped');
  assert.strictEqual(sandbox.remiLangs1DraftRow.admin_language, 'en');
  assert.strictEqual(sandbox.remiLangs1DraftRow.paint, 'preview_body');
  assert.strictEqual(sandbox.remiLangs1CoverText(sandbox.remiLangs1DraftRow), ES);
  const esCard = sandbox.remiLangs1DraftHtml();
  const esMsg = sandbox.remiLangs1MsgHtml();
  assert.ok(esCard.indexOf(ES) >= 0, esCard);
  assert.ok(esMsg.indexOf(ES) >= 0, esMsg);
  assert.ok(esCard.indexOf('Reply Yes or No') < 0, esCard);
  assert.ok(esMsg.indexOf('Reply Yes or No') < 0, esMsg);
  assert.ok(esCard.indexOf('english_draft') < 0 && esCard.indexOf('source_body') < 0, esCard);
  assert.ok(esCard.indexOf('English source') < 0, esCard);
  rpc.length = 0;
  const sentEs = await sandbox.remiLangs1SendInMessages();
  assert.strictEqual(sentEs.ok, true);
  assert.strictEqual(sentEs.sms_sent, false);
  assert.strictEqual(rpc[0].name, 'admin_send_bilingual_cover_in_messages');
  assert.strictEqual(rpc[0].body.p_body, ES);
  assert.strictEqual(rpc[0].body.p_target_lang, 'es');
  sandbox.remiLangs1DraftRow = {
    target_language:'es',
    preview_body:'',
    translated_body:'',
    ui_body: ES,
    english_draft: EN_FATIMA,
    source_body: EN_FATIMA
  };
  assert.strictEqual(sandbox.remiLangs1CoverText(), ES, 'empty preview and translated use ui_body, not english_draft');
  sandbox.remiLangs1DraftRow = {
    target_language:'ar',
    preview_body: AR,
    translated_body: EN_FATIMA,
    english_draft: EN_FATIMA,
    source_body: EN_FATIMA
  };
  assert.strictEqual(sandbox.remiLangs1CoverText(), AR, 'arabic preview stays arabic');

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nursePick = await sandbox.remiLangs1ShowPicker({id:AIDE, name:'Fatima Hassan'});
  const nurseSet = await sandbox.remiLangs1Set('ar');
  const nurseDraft = await sandbox.remiLangs1ShowDraft({id:AIDE, name:'Fatima Hassan'}, EN);
  const nurseMsg = await sandbox.remiLangs1SendInMessages();
  assert.strictEqual(nursePick.status, 42501);
  assert.strictEqual(nurseSet.status, 42501);
  assert.strictEqual(nurseDraft.status, 42501);
  assert.strictEqual(nurseMsg.status, 42501);
  assert.strictEqual(rpc.length, 0, 'nurse is not sent to Ace');
  assert.strictEqual(sandbox.remiLangs1Paint(), '');

  sandbox.currentAdminRole = 'Admin';
  sandbox.sbRestRpc = async function(){
    return {ok:false, status:42501, error:'42501 is_scheduler_office'};
  };
  const denied = await sandbox.remiLangs1Rpc('admin_list_aide_preferred_languages', {});
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(denied.status, 42501);

  const bothSrc = ideas + '\n' + src;
  const live = {
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
  vm.createContext(live);
  vm.runInContext(bothSrc, live);
  const liveRpc = [];
  live.sbRestRpc = async function(name, body){
    liveRpc.push({name:name, body:body||{}});
    if(name==='admin_get_aide_preferred_language')return {ok:true, data:{preferred_language:'es'}};
    if(name==='admin_set_aide_preferred_language')return {ok:true, data:{preferred_language:body.p_language}};
    if(name==='admin_draft_bilingual_cover_ask')return {ok:true, data:{
      success:true, admin_language:'en', target_language:body.p_target_lang,
      english_draft:body.p_english_body, translated_body:'Hola Maria', preview_body:'Hola Maria',
      sms_send:{implemented:true, oos:false}
    }};
    if(name==='admin_get_open_shift_why')return {ok:true, data:{success:true, client_name:'Bowlax', window_label:'Sun 9:00 AM\u20131:00 PM', open_shift_id:body.p_open_shift_id}};
    if(name==='admin_list_cover_attempts')return {ok:true, data:{attempts:[{when_label:'Sat 4:18 PM', who_label:'Blasted by Remi', status:'no', detail:'Devon said no'}]}};
    if(name==='admin_get_pay_dispute_evidence')return {ok:true, data:{success:true, aide_name:'Jamal', on_date:'2026-09-25', client_name:'Bowlax', shift:{scheduled_label:'8:00\u20134:00', clock_in:'07:58', clock_out:'16:03', status_label:'Completed', is_missed:false, is_completed:true}, signature:{present:true, label:'Client signature on file'}}};
    if(name==='admin_draft_pay_dispute_reply')return {ok:true, data:{draft_reply:'Jamal \u2014 the record shows Bowlax 09/25/2026.'}};
    if(name==='admin_send_aide_office_message')return {ok:true, data:{success:true}};
    return {ok:true, data:{success:true}};
  };
  const es = await live.remiIdeas763OpenBilingual({id:AIDE, name:'Maria'}, 'Hi Maria \u2014 can you cover Bowlax Sunday 9\u20131? Reply Yes or No.');
  assert.strictEqual(es.ok, true);
  assert.ok(liveRpc.some(function(row){return row.name==='admin_draft_bilingual_cover_ask' && row.body.p_target_lang==='es';}));
  assert.strictEqual(live.remiLangs1Mode, 'draft');
  assert.ok(live.remiLangs1DraftHtml().indexOf('Hola Maria') >= 0);
  assert.ok(live.remiLangs1DraftHtml().indexOf('Spanish') >= 0);
  assert.ok(live.remiLangs1DraftHtml().indexOf('Reply Yes or No') < 0, 'langs rail does not paint the english draft');
  assert.strictEqual(live.remiLangs1DraftRow.sms_send.oos, true);
  const somali = await live.remiIdeas763SetLang('somali');
  assert.strictEqual(somali.status, 22023);
  assert.ok(!liveRpc.some(function(row){return row.name==='admin_set_aide_preferred_language' && row.body.p_language==='so';}));
  liveRpc.length = 0;
  const why = await live.remiIdeas763OpenWhy('55555555-5555-4555-8555-555555555555');
  assert.strictEqual(why.ok, true);
  const whyCard = live.remiIdeas763WhyHtml();
  assert.ok(whyCard.indexOf('Why open') >= 0, whyCard);
  assert.ok(whyCard.indexOf('Bowlax') >= 0, whyCard);
  assert.ok(whyCard.indexOf('Sat 4:18 PM') >= 0, whyCard);
  const pay = await live.remiIdeas763OpenPay({id:AIDE, name:'Jamal'}, 'Why am I not getting paid?', '2026-09-25');
  assert.strictEqual(pay.ok, true);
  const payCard = live.remiIdeas763PayHtml();
  assert.ok(payCard.indexOf('09/25/2026') >= 0, payCard);
  assert.ok(payCard.indexOf('No payroll change') >= 0, payCard);
  const paySent = await live.remiIdeas763PaySend();
  assert.strictEqual(paySent.ok, true);
  assert.ok(liveRpc.some(function(row){return row.name==='admin_send_aide_office_message';}));

  console.log('admin-remi-langs1 unit ok');
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
    console.log('admin-remi-langs1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.LANGS1_SHOTS || '/opt/cursor/artifacts';
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
  const ES_PREVIEW = 'Hola Langs1Fatima \u2014 \u00bfpuedes cubrir Bowlax el domingo de 9\u20131? Responde S\u00ed o No. \u2014 EverCare / Remi';
  const pack = {aide:AIDE, list:LIST, en:EN, ar:AR, es:ES_PREVIEW};
  try{
    async function boot(page){
      page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
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
      await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-langs1', {waitUntil:'domcontentloaded', timeout:20000});
      await page.waitForSelector('#copilotFab', {timeout:10000});
      await page.evaluate(async function(pack){
        currentAdminRole = 'Admin';
        currentAdminUsername = 'mo@evercare.test';
        if(typeof showScreen === 'function')showScreen('adminScreen');
        window.__rpc = [];
        sbRestRpc = async function(name, body){
          window.__rpc.push({name:name, body:body||{}});
          if(name==='admin_list_aide_preferred_languages')return {ok:true, data:pack.list};
          if(name==='admin_get_aide_preferred_language')return {ok:true, data:{preferred_language:'ar', phone:'+1 (216) 555-0142', marker:'remi-langs1'}};
          if(name==='admin_set_aide_preferred_language')return {ok:true, data:{preferred_language:body.p_language, marker:'remi-langs1'}};
          if(name==='admin_draft_bilingual_cover_ask'){
            var preview = body.p_target_lang==='ar' ? pack.ar : (body.p_target_lang==='es' ? pack.es : (body.p_english_body || 'Hi'));
            return {ok:true, data:{
              success:true, marker:'remi-langs1', admin_language:'en', target_language:body.p_target_lang,
              paint:'preview_body',
              english_draft:body.p_english_body, source_body:body.p_english_body,
              translated_body: body.p_target_lang==='es' ? (body.p_english_body || '') : preview,
              ui_body: preview,
              preview_body: preview,
              sms_send:{implemented:true, oos:false}
            }};
          }
          if(name==='admin_send_bilingual_cover_in_messages')return {ok:true, data:{success:true, sms_sent:false}};
          return {ok:true, data:{success:true}};
        };
        document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
        document.getElementById('tab_aides').classList.add('active');
        await remiLangs1ShowPicker({id:pack.aide, name:'Fatima Hassan', phone:'+1 (216) 555-0142'});
      }, pack);
    }
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await boot(page);
    const phonePick = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var select = document.getElementById('remiLangsRailSelect');
      var labels = select ? Array.prototype.map.call(select.options, function(opt){return opt.textContent;}) : [];
      var values = select ? Array.prototype.map.call(select.options, function(opt){return opt.value;}) : [];
      return {
        text: document.getElementById('remiLangsHost').innerText,
        hidden: sheet.hidden,
        fullPage: !!document.getElementById('tab_remi'),
        first: document.querySelector('meta[name="admin-build"]').content,
        labels: labels,
        values: values,
        selected: select && select.value,
        top: Math.round(box.top),
        width: Math.round(box.width)
      };
    });
    assert.strictEqual(phonePick.first, '2026-09-27-remi-langs1');
    assert.strictEqual(phonePick.fullPage, false);
    assert.strictEqual(phonePick.hidden, false);
    assert.deepStrictEqual(phonePick.labels, LABELS);
    assert.deepStrictEqual(phonePick.values, ORDER);
    assert.strictEqual(phonePick.selected, 'ar');
    assert.ok(phonePick.text.indexOf('Arabic') >= 0, phonePick.text);
    assert.ok(phonePick.values.indexOf('so') < 0, phonePick.values.join(','));
    assert.ok(phonePick.text.indexOf('No Somali') >= 0, phonePick.text);
    assert.ok(phonePick.text.indexOf('English') >= 0, phonePick.text);
    assert.ok(phonePick.width >= 360, 'phone sheet width '+phonePick.width);
    await page.screenshot({path:path.join(shotDir, 'remi-langs1-phone-picker.png')});

    await page.evaluate(async function(pack){
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
      var tab = document.getElementById('tab_aidechat');
      tab.classList.add('active');
      tab.removeAttribute('hidden');
      await remiLangs1ShowDraft({id:pack.aide, name:'Fatima Hassan', client_name:'Bowlax', window_label:'Sunday 9:00 AM\u20131:00 PM'}, pack.en);
    }, pack);
    const phoneDraft = await page.evaluate(function(ar){
      var host = document.getElementById('remiLangsHost');
      var body = host.querySelector('.remi-langs-body');
      var sms = host.querySelector('[data-langs-act="sms"]');
      return {
        text: host.innerText,
        rtl: body && body.classList.contains('is-rtl'),
        dir: body ? getComputedStyle(body).direction : '',
        oos: sms && sms.getAttribute('data-sms-oos'),
        hasAr: host.innerText.indexOf(ar) >= 0
      };
    }, AR);
    assert.strictEqual(phoneDraft.rtl, true);
    assert.strictEqual(phoneDraft.dir, 'rtl');
    assert.strictEqual(phoneDraft.oos, 'true');
    assert.strictEqual(phoneDraft.hasAr, true);
    assert.ok(phoneDraft.text.indexOf('Send in Messages') >= 0, phoneDraft.text);
    assert.ok(phoneDraft.text.indexOf('Send SMS') >= 0, phoneDraft.text);
    assert.ok(phoneDraft.text.indexOf('English source') < 0, phoneDraft.text);
    assert.ok(phoneDraft.text.indexOf('Reply Yes or No') < 0, phoneDraft.text);
    assert.ok(phoneDraft.text.indexOf('Admin UI stays English') >= 0, phoneDraft.text);
    await page.screenshot({path:path.join(shotDir, 'remi-langs1-phone-arabic.png')});
    const beforeSms = await page.evaluate(function(){return window.__rpc.length;});
    await page.click('#remiLangsHost [data-langs-act="sms"]');
    const afterSms = await page.evaluate(function(){
      return {
        n: window.__rpc.length,
        ack: document.getElementById('remiLangsHost').innerText.indexOf('out of scope') >= 0
      };
    });
    assert.strictEqual(afterSms.n, beforeSms, 'Send SMS click does not call Ace');
    assert.strictEqual(afterSms.ack, true);
    await page.click('#remiLangsHost [data-langs-act="messages"]');
    const sent = await page.evaluate(function(){
      var row = window.__rpc.filter(function(item){return item.name==='admin_send_bilingual_cover_in_messages';}).pop();
      return row && row.body;
    });
    assert.ok(sent);
    assert.strictEqual(sent.p_target_lang, 'ar');
    assert.ok(sent.p_body.indexOf('Fatima') >= 0);

    await page.evaluate(async function(){
      remiLangs1Aide.name = 'Langs1Fatima';
      remiLangs1English = 'Hi Langs1Fatima \u2014 can you cover Bowlax Sunday 9\u20131? Reply Yes or No.';
      window.__rpc = [];
      await remiLangs1Set('es');
    });
    const phoneEs = await page.evaluate(function(es){
      var host = document.getElementById('remiLangsHost');
      var msg = document.getElementById('remiLangsMsgCard');
      return {
        rail: host ? host.innerText : '',
        msg: msg ? msg.innerText : '',
        calls: window.__rpc.map(function(row){return row.name;}),
        selected: (document.getElementById('remiLangsRailSelect')||{}).value || ''
      };
    }, ES_PREVIEW);
    assert.strictEqual(phoneEs.selected, 'es');
    assert.ok(phoneEs.calls.indexOf('admin_set_aide_preferred_language') >= 0, phoneEs.calls.join(','));
    assert.ok(phoneEs.calls.indexOf('admin_draft_bilingual_cover_ask') >= 0, phoneEs.calls.join(','));
    assert.ok(phoneEs.rail.indexOf(ES_PREVIEW) >= 0, phoneEs.rail);
    assert.ok(phoneEs.msg.indexOf(ES_PREVIEW) >= 0, phoneEs.msg);
    assert.ok(phoneEs.rail.indexOf('Reply Yes or No') < 0, phoneEs.rail);
    assert.ok(phoneEs.msg.indexOf('Reply Yes or No') < 0, phoneEs.msg);
    await page.screenshot({path:path.join(shotDir, 'remi-langs1-phone-spanish.png')});

    const desk = await browser.newPage();
    await desk.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await boot(desk);
    const deskPick = await desk.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var pageSelect = document.getElementById('remiLangsSelect');
      var labels = pageSelect ? Array.prototype.map.call(pageSelect.options, function(opt){return opt.textContent;}) : [];
      return {
        text: document.getElementById('remiLangsAideCard').innerText,
        rail: document.getElementById('remiLangsHost').innerText,
        labels: labels,
        selected: pageSelect && pageSelect.value,
        cardHidden: document.getElementById('remiLangsAideCard').hidden,
        right: Math.round(box.right),
        width: Math.round(box.width),
        view: window.innerWidth,
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(deskPick.fullPage, false);
    assert.strictEqual(deskPick.cardHidden, false);
    assert.deepStrictEqual(deskPick.labels, LABELS);
    assert.strictEqual(deskPick.selected, 'ar');
    assert.ok(deskPick.text.indexOf('Aide settings') >= 0, deskPick.text);
    assert.ok(deskPick.text.indexOf('Fatima Hassan') >= 0, deskPick.text);
    assert.ok(deskPick.text.indexOf('No Somali') >= 0, deskPick.text);
    assert.ok(deskPick.labels.indexOf('Somali') < 0, deskPick.labels.join(','));
    assert.ok(deskPick.rail.indexOf('Arabic') >= 0, deskPick.rail);
    assert.ok(deskPick.width <= 460, 'rail width '+deskPick.width);
    assert.ok(deskPick.right >= deskPick.view - 2, 'rail sits on the right '+deskPick.right);
    await desk.screenshot({path:path.join(shotDir, 'remi-langs1-desktop-picker.png')});

    await desk.evaluate(async function(pack){
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
      var tab = document.getElementById('tab_aidechat');
      tab.classList.add('active');
      tab.removeAttribute('hidden');
      await remiLangs1ShowDraft({id:pack.aide, name:'Fatima Hassan', client_name:'Bowlax', window_label:'Sunday 9:00 AM\u20131:00 PM'}, pack.en);
    }, pack);
    const deskDraft = await desk.evaluate(function(ar){
      var msg = document.getElementById('remiLangsMsgCard');
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      return {
        msg: msg.innerText,
        rail: document.getElementById('remiLangsHost').innerText,
        hidden: msg.hidden,
        rtl: !!document.querySelector('#remiLangsHost .remi-langs-body.is-rtl'),
        right: Math.round(box.right),
        width: Math.round(box.width),
        view: window.innerWidth,
        hasAr: msg.innerText.indexOf(ar) >= 0
      };
    }, AR);
    assert.strictEqual(deskDraft.hidden, false);
    assert.strictEqual(deskDraft.rtl, true);
    assert.strictEqual(deskDraft.hasAr, true);
    assert.ok(deskDraft.msg.indexOf('Messages') >= 0, deskDraft.msg);
    assert.ok(deskDraft.msg.indexOf('preview') >= 0, deskDraft.msg);
    assert.ok(deskDraft.rail.indexOf('Send in Messages') >= 0, deskDraft.rail);
    assert.ok(deskDraft.rail.indexOf('Send SMS') >= 0, deskDraft.rail);
    assert.ok(deskDraft.rail.indexOf('English source') < 0, deskDraft.rail);
    assert.ok(deskDraft.rail.indexOf('Reply Yes or No') < 0, deskDraft.rail);
    assert.ok(deskDraft.width <= 460, 'rail width '+deskDraft.width);
    assert.ok(deskDraft.right >= deskDraft.view - 2, 'rail sits on the right');
    await desk.screenshot({path:path.join(shotDir, 'remi-langs1-desktop-arabic.png')});
    await desk.evaluate(async function(){
      remiLangs1Aide.name = 'Langs1Fatima';
      remiLangs1English = 'Hi Langs1Fatima \u2014 can you cover Bowlax Sunday 9\u20131? Reply Yes or No.';
      window.__rpc = [];
      await remiLangs1Set('es');
    });
    const deskEs = await desk.evaluate(function(es){
      var host = document.getElementById('remiLangsHost');
      var msg = document.getElementById('remiLangsMsgCard');
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      return {
        rail: host ? host.innerText : '',
        msg: msg ? msg.innerText : '',
        selected: (document.getElementById('remiLangsSelect')||{}).value || '',
        calls: window.__rpc.map(function(row){return row.name;}),
        right: Math.round(box.right),
        width: Math.round(box.width),
        view: window.innerWidth,
        fullPage: !!document.getElementById('tab_remi')
      };
    }, ES_PREVIEW);
    assert.strictEqual(deskEs.fullPage, false);
    assert.strictEqual(deskEs.selected, 'es');
    assert.ok(deskEs.calls.indexOf('admin_set_aide_preferred_language') >= 0, deskEs.calls.join(','));
    assert.ok(deskEs.calls.indexOf('admin_draft_bilingual_cover_ask') >= 0, deskEs.calls.join(','));
    assert.ok(deskEs.rail.indexOf(ES_PREVIEW) >= 0, deskEs.rail);
    assert.ok(deskEs.msg.indexOf(ES_PREVIEW) >= 0, deskEs.msg);
    assert.ok(deskEs.rail.indexOf('Reply Yes or No') < 0, deskEs.rail);
    assert.ok(deskEs.msg.indexOf('Reply Yes or No') < 0, deskEs.msg);
    assert.ok(deskEs.width <= 460, 'rail width '+deskEs.width);
    assert.ok(deskEs.right >= deskEs.view - 2, 'rail sits on the right');
    await desk.screenshot({path:path.join(shotDir, 'remi-langs1-desktop-spanish.png')});
    assert.ok(!errors.some(function(e){return /remiLangs|SyntaxError/.test(e);}), errors.join('\n'));
    console.log('admin-remi-langs1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
