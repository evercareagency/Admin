#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=aide-thread-header1'), 'aide-thread-header1 marker');
assert.ok(html.includes('?v=aide-thread-header1'), 'cache bust query');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-aide-thread-header1">'), 'admin-build meta');
assert.ok(html.includes("var AIDE_THREAD_HEADER1_MARKER='v=aide-thread-header1'"), 'script marker');
assert.ok(html.includes("var AIDE_THREAD_HEADER1_BUILD='2026-09-29-aide-thread-header1'"), 'script build');
assert.ok(html.includes('GHOST-AIDE-THREAD-HEADER1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth'), 'hard rules');
assert.ok(html.includes('data-aide-thread-header1="v=aide-thread-header1"'), 'head carries the marker');
assert.ok(html.includes('id="aidechatThreadChips"'), 'chips row');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');

['v=msg-composer-kb3','v=msg-composer-kb2','v=sched-creds1','v=care-msg-safe1','v=aides-info1','v=admin-sched-chat-push1','v=pages-cache-fresh1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('align-items:flex-start'), 'header flex aligns start');
assert.ok(html.includes('#aidechatThreadChips{display:flex;flex-wrap:wrap'), 'chips wrap');
assert.ok(html.includes('background:var(--teal-light)'), 'teal-light pills');
assert.ok(html.includes('#aidechatThreadChips[hidden],#aidechatThreadChips:empty{display:none !important;}'), 'empty chips row is not an empty shell');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/aide-thread-header1-v1.sql')), 'no SQL patch');

const paintStart = html.indexOf('function aidechatPaintThread()');
const paintEnd = html.indexOf('function aidechatWide()');
const paintFn = html.slice(paintStart, paintEnd);
assert.ok(paintFn.includes('aideThreadHeader1Clear()'), 'client path clears aide chips before the client painter');
assert.ok(paintFn.includes('remiMsgTab1PaintClientThread'), 'Clients path still uses remiMsgTab1PaintClientThread');
assert.ok(!paintFn.includes('clienthrs1dSignedLabel'), 'header does not call the signed-in label');
assert.ok(!paintFn.includes('signed in as'), 'header does not paint signed in as');
assert.ok(!paintFn.includes("role==='Admin'") && !paintFn.includes('currentAdminRole'), 'header paint is not Admin-only');

const headerStart = html.indexOf('function aideThreadHeader1Status(');
const headerEnd = html.indexOf('function aidechatPaintThread()');
const headerSrc = html.slice(headerStart, headerEnd);
assert.ok(!headerSrc.includes('sbRestRpc'), 'chips do not call a new RPC');
assert.ok(!headerSrc.includes('admin_list_aides_info'), 'chips read the cache, they do not fetch');
assert.ok(headerSrc.includes('aidesInfo1Clients'), 'chips reuse aidesInfo1Clients');

const clientsStart = html.indexOf('function aidesInfo1Clients(');
const clientsEnd = html.indexOf('function aidesInfo1Tone(');
assert.ok(clientsStart > 0 && clientsEnd > clientsStart, 'aidesInfo1Clients stays');

const chipsHost = {hidden: true, innerHTML: ''};
const sandbox = {
  aidesInfo1ByKey: {},
  document: {getElementById: function(id){return id === 'aidechatThreadChips' ? chipsHost : null;}},
  aidechatEsc: function(s){return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');}
};
vm.createContext(sandbox);
vm.runInContext(html.slice(clientsStart, clientsEnd) + '\n' + headerSrc, sandbox);

assert.strictEqual(sandbox.aideThreadHeader1Title({name: 'Keisha Williams', username: 'keisha.w'}), 'Keisha Williams');
assert.strictEqual(sandbox.aideThreadHeader1Title({name: '', username: 'keisha.w'}), 'keisha.w');
assert.strictEqual(sandbox.aideThreadHeader1Title({}), 'Aide');
assert.strictEqual(sandbox.aideThreadHeader1Meta({username: 'keisha.w', status: 'open'}), '@keisha.w · Aide · Open');
assert.strictEqual(sandbox.aideThreadHeader1Meta({username: '@keisha.w', urgent: true, status: 'open'}), '@keisha.w · Aide · Urgent');
assert.strictEqual(sandbox.aideThreadHeader1Meta({status: 'open'}), 'Aide · Open');
assert.ok(sandbox.aideThreadHeader1Meta({username: 'jaz', status: 'open'}).indexOf('signed in as') < 0);

const row = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  username: 'keisha.w',
  clients: [
    {name: 'Mae Johnson', insurance_label: 'Blue Cross'},
    {name: 'Andre Park', insurance_plan: 'passport'},
    {name: 'Mae Johnson', insurance_label: 'Blue Cross'},
    {name: 'No Plan'}
  ]
};
function copy(v){return JSON.parse(JSON.stringify(v));}
assert.deepStrictEqual(copy(sandbox.aideThreadHeader1ChipTexts(row)), [
  'Mae Johnson · Blue Cross',
  'Andre Park · Passport',
  'No Plan'
]);
assert.deepStrictEqual(copy(sandbox.aideThreadHeader1ChipTexts({clients: []})), []);
assert.deepStrictEqual(copy(sandbox.aideThreadHeader1ChipTexts({clients: ['Chen']})), ['Chen']);
assert.strictEqual(sandbox.aideThreadHeader1Plan({insurance_plan: 'caresource'}), 'CareSource');

sandbox.aidesInfo1ByKey = {
  'keisha.w': {id: row.id, username: 'keisha.w', _raw: row}
};
const found = sandbox.aideThreadHeader1InfoRow({aide_id: row.id, username: 'other'});
assert.strictEqual(found.username, 'keisha.w');
sandbox.aideThreadHeader1Paint({aide_id: row.id, username: 'keisha.w'});
assert.strictEqual(chipsHost.hidden, false);
assert.ok(chipsHost.innerHTML.includes('Mae Johnson · Blue Cross'), chipsHost.innerHTML);
assert.ok(chipsHost.innerHTML.includes('aide-thread-chip'));
sandbox.aideThreadHeader1Paint({aide_id: 'missing', username: 'nobody'});
assert.strictEqual(chipsHost.hidden, true);
assert.strictEqual(chipsHost.innerHTML, '');

sandbox.aideThreadHeader1Paint({aide_id: row.id, username: 'keisha.w'});
sandbox.aideThreadHeader1Clear();
assert.strictEqual(chipsHost.hidden, true, 'client path can hide the chips row');

const nasty = {clients: [{name: '<Mae>', insurance_label: 'CareSource'}]};
sandbox.aidesInfo1ByKey = {'x': {_raw: nasty, id: 'x', username: 'x'}};
sandbox.aideThreadHeader1Paint({aide_id: 'x', username: 'x'});
assert.ok(chipsHost.innerHTML.includes('&lt;Mae&gt;'), 'chip text is escaped');
assert.ok(chipsHost.innerHTML.indexOf('<Mae>') < 0);

console.log('admin-aide-thread-header1-test: ok');
