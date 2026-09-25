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

assert.ok(html.includes('v=covercomms1'), 'covercomms1 marker');
assert.ok(html.includes('admin-build 2026-09-25-covercomms1'), 'covercomms1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-covercomms1">'), 'covercomms1 meta');
assert.ok(html.indexOf('content="2026-09-25-covercomms1"') < html.indexOf('content="2026-09-25-cover1"'), 'covercomms1 is the current build meta');
assert.ok(html.includes('v=cover1'), 'cover1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-cover1">'), 'cover1 meta stays');
assert.ok(html.includes('v=aidadel1'), 'aidadel1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidadel1">'), 'aidadel1 meta stays');
assert.ok(html.includes('v=navedit1'), 'navedit1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-navedit1">'), 'navedit1 meta stays');
assert.ok(html.includes('v=nursecomp57'), 'nursecomp57 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-nursecomp57">'), 'nursecomp57 meta stays');
assert.ok(html.includes('v=layoutA1'), 'layoutA1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-layoutA1">'), 'layoutA1 meta stays');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('v=cover1'), 'cover1 stays on the tip');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.ok(!nav.includes('nav_coverage'), 'Coverage stays off the bottom bar');
assert.ok(nav.includes('id="nav_backups"'), 'Backup tab stays');

const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_coverage"'), 'Coverage stays under More');
assert.ok(more.includes("showTab('coverage')"), 'Coverage still opens with showTab');

const bak = admin.slice(admin.indexOf('id="tab_backups"'), admin.indexOf('id="tab_aides"'));
assert.ok(bak.includes('Phone-change draft'), 'Backup stays phone-change drafts');
assert.ok(!/Approve/i.test(bak), 'Backup has no Approve');
assert.ok(!/Decline/i.test(bak), 'Backup has no Decline');
assert.ok(!/Coverage/i.test(bak), 'Coverage desk is not on Backup');
assert.ok(!/PTO/i.test(bak), 'Backup has no PTO');

const desk = admin.slice(admin.indexOf('id="tab_coverage"'), admin.indexOf('id="tab_backups"'));
assert.ok(desk.includes('>Who can cover<'), 'section title');
assert.ok(desk.includes('>Text this aide<') && desk.includes('>Text client<'), 'text buttons');
assert.ok(desk.includes('>Client wants backup<'), 'client wants backup');
assert.ok(desk.includes('>Client refused \u00b7 resume next day<'), 'client refused label');
assert.ok(desk.includes('>Still deciding<'), 'still deciding');
assert.ok(desk.includes('id="coverCmDraft"'), 'editable email draft');
assert.ok(desk.includes('>Open in Mail<') && desk.includes('>Copy draft<') && desk.includes('>Save as my template<'), 'mail actions');
assert.ok(desk.includes('id="coverCmMail" disabled'), 'Open in Mail starts disabled');
assert.ok(desk.includes("Text client they're on the way"), 'on the way draft stub');
assert.ok(!desk.includes('Continuity') && !desk.includes('>Score'), 'desk copy drops Continuity and Score');
assert.ok(!/reset_aide_temp_password|sbAdminResetTempPassword/.test(desk), 'coverage desk does not reseal passwords');

const paint = extractFn(html, 'function coverPaintRanks(rows)');
assert.ok(paint.includes('is-selected') && paint.includes('cover-rank-check'), 'selected aide keeps a check');
assert.ok(paint.includes('coverRankLines'), 'ranks render plain lines');
assert.ok(!/Continuity|Score/.test(paint), 'rank paint does not show Continuity or Score');

const coverJs = html.slice(html.indexOf('// v=cover1 Coverage desk'), html.indexOf('// admin schedule'));
assert.ok(coverJs.includes("outcome:['admin_cover_outcome']"), 'outcome callable stays');
assert.ok(coverJs.includes("coverApplyOutcome('client_refused_resume_next_day')"), 'refused outcome value');
assert.ok(coverJs.includes("coverApplyOutcome('assigned_backup')"), 'backup outcome value');
assert.ok(coverJs.includes("coverApplyOutcome('awaiting_client')"), 'still deciding outcome value');
assert.ok(coverJs.includes("tplGet:['admin_get_cover_refuse_template']"), 'get template callable');
assert.ok(coverJs.includes("tplSave:['admin_save_cover_refuse_template']"), 'save template callable');
assert.ok(coverJs.includes("preview:['admin_preview_cover_refuse_email']"), 'preview email callable');
assert.ok(coverJs.includes('{{case_manager}}') && coverJs.includes('{{client}}') && coverJs.includes('{{date}}') && coverJs.includes('{{case_manager_email}}'), 'Ace placeholders');
assert.ok(!coverJs.includes('evercare_covercomms1_cm_template'), 'no local template key');
assert.ok(!coverJs.includes('localStorage'), 'refuse template is not stored on this phone');
assert.ok(!/reset_aide_temp_password|sbAdminResetTempPassword|auth\.updateUser/.test(coverJs), 'no Auth reseal on the coverage desk');

const ctx = {};
vm.createContext(ctx);
[
  'function coverPick(src)',
  'function coverNameOf(v)',
  'function coverIdOf(v)',
  'function coverPickPhone(obj)',
  'function coverMapShift(row)',
  'function coverMapRank(row)',
  'function coverServiceDate(iso)',
  'function coverContinuityLine(value)',
  'function coverMilesLine(miles)',
  'function coverDistanceLine(value)',
  'function coverRankLines(row)',
  'function coverSmsHref(phone, body)',
  'function coverEmailOk(email)',
  'function coverMailHref(email, subject, body)',
  'function coverClientPhone(shift)',
  'function coverSelectedBackupPhone(shift, aide)',
  'function coverFillCmTemplate(tpl, ctx)',
  'function coverUnfillCmTemplate(text, ctx)',
  'function coverMailPayload(data)',
  'function coverTplGetBody()',
  'function coverTplSaveBody(subject, body)',
  'function coverPreviewBody(openShiftId)',
  'var COVER_CM_DEFAULT'
].forEach(function(sig){
  if(sig.indexOf('var ') === 0){
    const name = sig.slice(4);
    const at = html.indexOf(sig);
    assert.ok(at >= 0, 'missing ' + sig);
    vm.runInContext(html.slice(at, html.indexOf(';', at) + 1), ctx);
    return;
  }
  vm.runInContext(extractFn(html, sig), ctx);
});

function linesOf(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}
const lines = linesOf('coverRankLines({continuity:2, distance:1.2, score:88})');
assert.deepStrictEqual(lines, ['Worked this client 2 times', '1.2 miles away']);
assert.ok(!lines.join(' ').match(/Score|Continuity/), 'plain lines hide the raw score');
assert.deepStrictEqual(linesOf('coverRankLines({continuity:0, distance:null, score:12})'), ['Never worked this client', 'No home address on file']);
assert.deepStrictEqual(linesOf('coverRankLines({continuity:1, distance:1, score:5})'), ['Worked this client 1 time', '1 mile away']);
assert.strictEqual(vm.runInContext('coverContinuityLine(null)', ctx), '');
assert.strictEqual(vm.runInContext('coverMapRank({aide_id:"a1", name:"Cam", continuity_score:2, distance_miles:1.2, score:88, phone:"2165550199"}).phone', ctx), '2165550199');
assert.strictEqual(vm.runInContext('coverMapRank({aide_id:"a1", name:"Cam", continuity_score:2, distance_miles:1.2, score:88}).score', ctx), 88, 'score stays stored and is not recomputed');

const mapped = vm.runInContext('coverMapShift({open_shift_id:"os1", source:"aide", submitted_by_aide_id:"sub1", submitted_by_aide_username:"bea", submitted_by_aide_name:"Bea Ortiz", client_name:"Ada Cole", client_phone:"2165550142", case_manager_name:"Pat Lee", case_manager_email:"pat@example.com", regular_aide_phone:"2165550101", assigned_backup_phone:"2165550199", shift_start:"2026-09-25T16:00:00Z"})', ctx);
assert.strictEqual(mapped.phone, '2165550142');
assert.strictEqual(mapped.caseManagerName, 'Pat Lee');
assert.strictEqual(mapped.caseManagerEmail, 'pat@example.com');
assert.strictEqual(mapped.aidePhone, '2165550101');
assert.strictEqual(mapped.backupPhone, '2165550199');
assert.strictEqual(mapped.source, 'aide');
assert.strictEqual(mapped.submittedById, 'sub1');
assert.strictEqual(mapped.submittedByUsername, 'bea');
assert.strictEqual(mapped.submittedByName, 'Bea Ortiz');
assert.strictEqual(vm.runInContext('coverClientPhone({phone:"2165550142"})', ctx), '2165550142');
assert.strictEqual(vm.runInContext('coverSelectedBackupPhone({backupAideId:"b1", backupPhone:"2165550199", aideId:"a9", aidePhone:"2165550101"}, {id:"cam", phone:"2165550177"})', ctx), '2165550177');
assert.strictEqual(vm.runInContext('coverSelectedBackupPhone({backupAideId:"b1", backupPhone:"2165550199", aideId:"a9", aidePhone:"2165550101"}, {id:"b1", phone:""})', ctx), '2165550199');
assert.strictEqual(vm.runInContext('coverSelectedBackupPhone({backupAideId:"b1", backupPhone:"2165550199", aideId:"a9", aidePhone:"2165550101"}, {id:"a9", phone:""})', ctx), '2165550101');
assert.strictEqual(vm.runInContext('coverSelectedBackupPhone({backupAideId:"b1", backupPhone:"2165550199", aideId:"a9", aidePhone:"2165550101"}, {id:"other", phone:""})', ctx), '');
assert.strictEqual(vm.runInContext('coverServiceDate("2026-09-25T16:00:00Z")', ctx), 'Friday, September 25');

const sms = vm.runInContext('coverSmsHref("(216) 555-0199", "Hi Cam")', ctx);
assert.ok(sms.startsWith('sms:2165550199?&body='), 'sms opens Messages');
assert.ok(decodeURIComponent(sms.split('body=')[1]) === 'Hi Cam', 'sms body is prefilled');
assert.ok(vm.runInContext('coverSmsHref("", "Draft only")', ctx).startsWith('sms:?&body='), 'missing phone still opens a draft');
assert.strictEqual(vm.runInContext('coverMailHref("", "Sub", "Body")', ctx), '', 'Open Mail stays off without an email');
assert.ok(vm.runInContext('coverMailHref("pat@example.com", "No services today", "Hello")', ctx).startsWith('mailto:pat@example.com?'), 'mailto uses the case manager email');

const MO_VOICE = [
  'Hey (Case manager name)',
  '',
  'I wanted to inform you that our mutual member (Client name) will not receive services today, (Date), because her permanent aide called off. I offered a replacement caregiver, but she declined and stated that she preferred to wait for her regular aide to return. Services will resume on the next scheduled date.',
  'Please let me know if you need any additional information.',
  '',
  'Thank you,'
].join('\n');
const blank = vm.runInContext('coverFillCmTemplate(COVER_CM_DEFAULT, {})', ctx);
assert.strictEqual(blank, MO_VOICE, 'starting template is Mo\'s voice verbatim');
const filled = vm.runInContext('coverFillCmTemplate(COVER_CM_DEFAULT, {cm:"Pat Lee", client:"Ada Cole", date:"Friday, September 25"})', ctx);
assert.strictEqual(filled, MO_VOICE
  .replace('(Case manager name)', 'Pat Lee')
  .replace('(Client name)', 'Ada Cole')
  .replace('(Date)', 'Friday, September 25'), 'fills case manager, client, and service date');
const edited = filled
  .replace('I wanted to inform you', 'I am writing to tell you')
  .replace('Please let me know if you need any additional information.', 'Call me if you need anything else.');
const saved = vm.runInContext('coverUnfillCmTemplate(' + JSON.stringify(edited) + ', {cm:"Pat Lee", client:"Ada Cole", date:"Friday, September 25", email:"pat@example.com"})', ctx);
assert.strictEqual(saved, edited
  .replaceAll('Pat Lee', '{{case_manager}}')
  .replaceAll('Ada Cole', '{{client}}')
  .replaceAll('Friday, September 25', '{{date}}'), 'save keeps the edited wording and the Ace slots');
const saveBody = vm.runInContext('coverTplSaveBody(' + JSON.stringify('No services today — {{client}}') + ', ' + JSON.stringify(saved) + ')', ctx);
assert.strictEqual(saveBody.p_subject, 'No services today — {{client}}');
assert.strictEqual(saveBody.p_body, saved);
assert.deepStrictEqual(JSON.parse(JSON.stringify(vm.runInContext('coverPreviewBody("os1")', ctx))), {p_open_shift_id:'os1'});
assert.deepStrictEqual(JSON.parse(JSON.stringify(vm.runInContext('coverTplGetBody()', ctx))), {});
const preview = vm.runInContext('coverMailPayload({success:true, subject:"No services today — Ada Cole", body:' + JSON.stringify(filled) + ', case_manager_email:"pat@example.com"})', ctx);
assert.strictEqual(preview.subject, 'No services today — Ada Cole');
assert.strictEqual(preview.body, filled);
assert.strictEqual(preview.email, 'pat@example.com');
assert.strictEqual(vm.runInContext('coverMailPayload({success:false, body:"no"})', ctx), null);
assert.strictEqual(vm.runInContext('coverFillCmTemplate("Write {{case_manager_email}}", {email:"pat@example.com"})', ctx), 'Write pat@example.com');
const next = vm.runInContext('coverFillCmTemplate(' + JSON.stringify(saved) + ', {cm:"Sam Ortiz", client:"Bea Lang", date:"Monday, September 28"})', ctx);
assert.strictEqual(next, edited
  .replaceAll('Pat Lee', 'Sam Ortiz')
  .replaceAll('Ada Cole', 'Bea Lang')
  .replaceAll('Friday, September 25', 'Monday, September 28'), 'next refuse starts from the saved wording with new names and date');

console.log('admin-covercomms1-test: ok');
