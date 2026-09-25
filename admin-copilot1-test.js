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
  throw new Error('unclosed ' + sig);
}

assert.ok(html.includes('v=eca-copilot1'), 'marker v=eca-copilot1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-eca-copilot1">'), 'admin-build eca-copilot1');
assert.ok(html.includes('v=phonezoom1'), 'phonezoom1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-phonezoom1">'), 'phonezoom1 admin-build stays');
['2026-09-25-coveraide1b','2026-09-25-covercomms1','v=coveraide1','v=cover1','v=aidadel1','v=navedit1','v=nursecomp57','v=layoutA1','v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const nurseAt = html.indexOf('id="nurseScreen"');
const fabAt = html.indexOf('id="copilotFab"');
assert.ok(fabAt > 0 && fabAt < nurseAt, 'co-pilot control sits in the Admin screen');
assert.strictEqual(html.indexOf('id="copilotFab"', nurseAt), -1, 'Nurse screen has no co-pilot');
assert.ok(html.includes('data-layout-roles="Admin Scheduler"') && html.includes('id="copilotFab"'), 'co-pilot is Admin and Scheduler');
assert.ok(html.indexOf('id="nav_coverage"') > html.indexOf('id="moreList"'), 'Coverage stays under More');
const backup = html.slice(html.indexOf('id="tab_backups"'), html.indexOf('id="tab_aides"'));
assert.ok(!/Approve|Decline|PTO/.test(backup), 'Backup tab stays drafts only');

const invented = [
  'admin_get_cover_skip_template',
  'admin_save_cover_skip_template',
  'admin_preview_cover_skip_email',
  'admin_save_client',
  'admin_set_aide_contact',
  'admin_list_copilot_radar',
  'admin_ask_copilot',
  'admin_get_copilot_quiet_hours',
  'admin_save_copilot_quiet_hours',
  'admin_list_login_fails'
];
invented.forEach(function(name){
  assert.ok(!html.includes(name), 'invented alias is gone: ' + name);
});

[
  'admin_get_cover_refuse_template',
  'admin_save_cover_refuse_template',
  'admin_preview_cover_refuse_email',
  'admin_get_cover_client_skip_template',
  'admin_save_cover_client_skip_template',
  'admin_preview_cover_client_skip_email',
  'admin_record_client_skip',
  'admin_add_client',
  'admin_add_aide',
  'admin_get_quiet_hours',
  'admin_save_quiet_hours',
  'admin_list_radar_signals',
  'admin_ack_radar_signal',
  'admin_resolve_radar_signal',
  'admin_log_copilot_choice'
].forEach(function(name){
  assert.ok(html.includes(name), 'live RPC missing: ' + name);
});

assert.ok(html.includes("skipPreview:['admin_preview_cover_client_skip_email']"), 'skip preview name');
assert.ok(html.includes('p_case_manager_name') && html.includes('p_reason_label') && html.includes('p_service_date'), 'skip preview args');
assert.ok(html.includes('p_start_local') && html.includes('p_end_local'), 'quiet hours args');
assert.ok(html.includes('CLIENT-SKIP') && html.includes('is_client_skip') && html.includes('is_client_refused_backup'), 'open shift chips');
assert.ok(html.includes('id="coverSkipBtn"') && html.includes('data-skip-reason="Personal"') && html.includes('data-skip-reason="Doctor appointment"') && html.includes('data-skip-reason="Not feeling well"') && html.includes('data-skip-reason="Other"'), 'client-skip reasons');
assert.ok(html.includes('id="coverOutboundConfirm"'), 'confirm before outbound');
assert.ok(html.includes('id="clientFirstName"') && html.includes('id="clientCmEmail"') && html.includes('id="clientPhone"'), 'add client fields');
assert.ok(html.includes('id="addAideFirstName"') && html.includes('id="addAidePhone"') && html.includes('id="addAideEmail"'), 'add aide fields');

const skipDefaultAt = html.indexOf('var COVER_CM_SKIP_DEFAULT=');
const skipDefault = html.slice(skipDefaultAt, html.indexOf(';', skipDefaultAt));
assert.ok(skipDefault.startsWith("var COVER_CM_SKIP_DEFAULT='{{greeting}}"), 'skip draft starts with {{greeting}}');
assert.ok(skipDefault.includes("member\\'s request"), 'skip draft uses the seeded apostrophe');
assert.ok(!skipDefault.includes('Hey'), 'skip draft does not prepend Hey');

const coverJs = html.slice(html.indexOf('// v=cover1 Coverage desk'), html.indexOf('// admin schedule'));
assert.ok(!coverJs.includes('localStorage'), 'coverage desk does not store a template on this phone');
assert.ok(!/reset_aide_temp_password|sbAdminResetTempPassword|auth\.updateUser/.test(coverJs), 'coverage desk does not reseal Auth');
const copilotJs = html.slice(html.indexOf('// v=eca-copilot1 Admin desk co-pilot'), html.indexOf('// Live Ace office RPCs'));
assert.ok(!/reset_aide_temp_password|auth\.updateUser|admin_create_aide/.test(copilotJs), 'co-pilot does not reseal Auth');
assert.ok(copilotJs.includes('coverage_open') && copilotJs.includes('login_fail') && copilotJs.includes('broadcast_needed'), 'radar kinds');

const ctx = {Intl:Intl, Date:Date};
vm.createContext(ctx);
[
  'function coverNyHour(now)',
  'function coverNyGreeting(now)',
  'function coverEnsureGreeting(text)',
  'function coverNyYmd(iso)',
  'function coverSkipReasonCode(label)',
  'function coverSkipReasonLabel()',
  'function coverSkipPreviewBody(shift)',
  'function sbUuid(v)',
  'function coverSkipSaveBody(subject, body)',
  'function coverRecordSkipBody(shift)',
  'function coverUuidOrNull(v)',
  'function sbOptionalText(v)',
  'function sbAddAideBody(payload)',
  'function sbClientDeskPayload(payload)',
  'function sbClientDeskBody(payload)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});
vm.runInContext('var coverSkipReason="";var coverCmFamily="skip";function coverCmContext(shift){return {cm:(shift&&shift.caseManagerName)||"", client:(shift&&shift.clientName)||"", case_manager:(shift&&shift.caseManagerName)||""};}function coverSkipOtherText(){return "";}', ctx);

assert.strictEqual(vm.runInContext('coverNyGreeting(new Date("2026-09-25T15:59:00Z"))', ctx), 'Good morning');
assert.strictEqual(vm.runInContext('coverNyGreeting(new Date("2026-09-25T16:00:00Z"))', ctx), 'Good afternoon');
assert.strictEqual(vm.runInContext('coverNyGreeting(new Date("2026-09-25T20:59:00Z"))', ctx), 'Good afternoon');
assert.strictEqual(vm.runInContext('coverNyGreeting(new Date("2026-09-25T21:00:00Z"))', ctx), 'Good evening');
assert.strictEqual(vm.runInContext('coverNyGreeting(new Date("2026-09-26T03:30:00Z"))', ctx), 'Good evening');
assert.strictEqual(vm.runInContext('coverSkipReasonCode("Personal")', ctx), 'personal');
assert.strictEqual(vm.runInContext('coverSkipReasonCode("Doctor appointment")', ctx), 'doctor');
assert.strictEqual(vm.runInContext('coverSkipReasonCode("Not feeling well")', ctx), 'not_feeling_well');
assert.strictEqual(vm.runInContext('coverSkipReasonCode("Other")', ctx), 'other');
assert.strictEqual(vm.runInContext('coverEnsureGreeting("Good morning\\n\\nBody")', ctx), 'Good morning\n\nBody');
assert.strictEqual(vm.runInContext('coverEnsureGreeting("Good afternoon\\n\\nBody")', ctx), 'Good afternoon\n\nBody');
assert.strictEqual(vm.runInContext('coverEnsureGreeting("Good evening\\n\\nBody")', ctx), 'Good evening\n\nBody');
const heyGone = vm.runInContext('coverEnsureGreeting("Hey Pat Lee\\n\\nI wanted to inform you.")', ctx);
assert.ok(!/^Hey\b/m.test(heyGone), 'Hey is not the greeting line');
assert.ok(/^Good (morning|afternoon|evening)\n\nI wanted to inform you\.$/.test(heyGone), 'a missing greeting is injected');
assert.ok(!heyGone.split('\n')[0].includes('Pat'), 'case manager name stays off the greeting line');

vm.runInContext('coverSkipReason="Doctor appointment";', ctx);
function plain(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}
const preview = plain('coverSkipPreviewBody({clientName:"Ada Cole", caseManagerName:"Pat Lee", startsAt:"2026-09-25T16:00:00Z"})');
assert.deepStrictEqual(Object.keys(preview), ['p_case_manager_name','p_client_name','p_service_date','p_reason_label']);
assert.strictEqual(preview.p_case_manager_name, 'Pat Lee');
assert.strictEqual(preview.p_client_name, 'Ada Cole');
assert.strictEqual(preview.p_service_date, '2026-09-25');
assert.strictEqual(preview.p_reason_label, 'Doctor appointment');

const skipSave = plain('coverSkipSaveBody("", "Hello")');
assert.deepStrictEqual(Object.keys(skipSave), ['p_body']);
assert.strictEqual(skipSave.p_body, 'Hello');

vm.runInContext('coverSkipReason="Other";', ctx);
const record = plain('coverRecordSkipBody({id:"not-a-uuid", clientId:"11111111-1111-4111-8111-111111111111", startsAt:"2026-09-25T16:00:00Z", endsAt:"2026-09-25T20:00:00Z", note:""})');
assert.strictEqual(record.p_reason, 'other');
assert.ok(!Object.prototype.hasOwnProperty.call(record, 'p_open_shift_id'), 'optional open shift is omitted when it is not a uuid');
assert.strictEqual(record.p_client_id, '11111111-1111-4111-8111-111111111111');

const aideBody = plain('sbAddAideBody({firstName:"Jane", lastName:"Doe", phone:"", email:"jane@example.com"})');
assert.deepStrictEqual(aideBody, {p_first_name:'Jane', p_last_name:'Doe', p_email:'jane@example.com'});
assert.ok(!Object.prototype.hasOwnProperty.call(aideBody, 'p_phone'));
assert.ok(!Object.prototype.hasOwnProperty.call(aideBody, 'p_username'));
assert.ok(!Object.prototype.hasOwnProperty.call(aideBody, 'p_temp_password'));

const clientBody = plain('sbClientDeskBody({firstName:"Ada", lastName:"Cole", address:"1 Main", caseManagerName:"Pat Lee", caseManagerEmail:"pat@example.com", phone:""})');
assert.deepStrictEqual(clientBody, {
  p_first_name:'Ada',
  p_last_name:'Cole',
  p_home_address:'1 Main',
  p_case_manager_name:'Pat Lee',
  p_case_manager_email:'pat@example.com'
});
assert.ok(!Object.prototype.hasOwnProperty.call(clientBody, 'p_phone'));
assert.ok(!Object.prototype.hasOwnProperty.call(clientBody, 'p_client_id'));
assert.strictEqual(vm.runInContext('sbClientDeskPayload({name:"Ann", address:"1 Main"}).has', ctx), false, 'plain add_client does not call admin_add_client');

console.log('admin-copilot1-test: ok');
