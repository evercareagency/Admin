#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=list-az1'), 'list-az1 marker');
assert.ok(html.includes('data-list-az1="') && html.includes("setAttribute('data-list-az1', LIST_AZ1_MARKER)"), 'list-az1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-list-az1'), 'list-az1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-list-az1">'), 'list-az1 meta');
assert.ok(html.includes('<!-- list order A–Z 2026-09-27 v=list-az1 admin-build 2026-09-27-list-az1'), 'list-az1 comment');
assert.ok(html.includes("var LIST_AZ1_MARKER='v=list-az1'"), 'script marker');
assert.ok(html.includes('GHOST-LIST-AZ1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No preference RPC'), 'no preference RPC');
assert.ok(html.includes('evercare_list_order'), 'localStorage key');
assert.ok(html.includes('Not a fat pill'), 'not a fat pill');
assert.ok(html.includes('Not beside Find a client'), 'not beside Find a client');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-list-az1'), 'first admin-build is list-az1');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-compliance-bulk1"'), 'compliance-bulk1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-compliance-bulk1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after compliance-bulk1');
assert.ok(html.indexOf('content="2026-09-27-hold-autosave1"') < html.indexOf('content="2026-09-27-msg-dense1"'), 'msg-dense1 stays after hold-autosave1');
['2026-09-27-hold-autosave1','2026-09-27-msg-dense1','2026-09-27-aide-notif-search1','2026-09-27-remi-chat1','2026-09-27-hold-client1','2026-09-27-aides-info1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});

const headFn = html.slice(html.indexOf('function schedClientHeadHtml'), html.indexOf('function schedPaint()'));
assert.ok(headFn.includes('sched-client-label">Client'), 'chip sits next to Client');
assert.ok(headFn.includes('class="sched-az-chip"'), 'tiny chip class');
assert.ok(headFn.includes('aria-pressed'), 'toggle aria-pressed');
assert.ok(headFn.includes('A\\u2013Z'), 'chip label is A–Z');
assert.ok(!headFn.includes('Find a client'), 'chip builder is not the search field');
assert.ok(html.includes('.sched-az-chip{') && html.includes('height:16px'), 'chip stays a tiny 16px control');
assert.ok(!html.includes('admin_get_ui_pref') && !html.includes('admin_set_ui_pref'), 'no preference RPC');

const searchAt = html.indexOf('id="schedSearch"');
const searchNear = html.slice(Math.max(0, searchAt - 400), searchAt + 200);
assert.ok(!searchNear.includes('sched-az-chip'), 'chip is not beside Find a client');
assert.ok((html.match(/schedClientHeadHtml\(\)/g) || []).length >= 2, 'week header uses the chip on both paints');
['coverPaintList','aidechatSorted','paintTimesheets','paintBackupRequests','aidesInfo1TryPaint','paintClients','schedBuildRows'].forEach(function(name){
  assert.ok(html.includes(name), name + ' stays');
});
assert.ok(html.includes('listAz1Apply(rows,'), 'schedule rows sort');
assert.ok(html.includes('listAz1Apply(clients,'), 'slot clients sort');
assert.ok(html.includes('listAz1Apply(open,'), 'declines / open shifts sort');
assert.ok(html.includes('listAz1Apply(recs,'), 'timesheets and backup sort');
assert.ok(html.includes('listAz1Apply(users,'), 'aides info cards sort');
assert.ok(html.includes('listAz1Apply(list,'), 'clients sort');

const start = html.indexOf('// list order A–Z v=list-az1');
const end = html.indexOf('// end list order A–Z v=list-az1');
assert.ok(start > 0 && end > start, 'list-az1 block');
const store = {};
const sandbox = {
  localStorage: {
    getItem: function(k){ return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function(k, v){ store[k] = String(v); }
  },
  location: { search: '?v=list-az1' },
  document: { documentElement: { setAttribute: function(k, v){ this[k] = v; } } },
  navEditIdentity: function(){ return { id: 'admin-1', email: 'mo@evercare.test' }; }
};
vm.createContext(sandbox);
vm.runInContext(html.slice(start, end) + '\n' + html.slice(html.indexOf('function schedClientHeadHtml'), html.indexOf('function schedPaint()')), sandbox);

assert.strictEqual(sandbox.LIST_AZ1_MARKER, 'v=list-az1');
assert.strictEqual(sandbox.listAz1Read(), 'usual');
assert.strictEqual(sandbox.listAz1On(), false);
assert.strictEqual(sandbox.listAz1StorageKey(), 'evercare_list_order:admin-1|mo@evercare.test');
sandbox.listAz1Write('az');
assert.deepStrictEqual(JSON.parse(store['evercare_list_order:admin-1|mo@evercare.test']), { v: 1, mode: 'az' });
assert.strictEqual(sandbox.listAz1On(), true);
sandbox.listAz1Write('nope');
assert.strictEqual(sandbox.listAz1Read(), 'usual');
sandbox.listAz1Write('az');

const people = [
  { name: 'Zoe Adams', id: '3' },
  { name: 'ada cole', id: '2' },
  { name: 'Ada Cole', id: '1' },
  { name: 'Maria Lopez', id: '9' }
];
sandbox.listAz1Write('usual');
const usual = people.slice();
assert.strictEqual(sandbox.listAz1Apply(usual, [function(r){ return r.name; }]), usual);
sandbox.listAz1Write('az');
const sorted = sandbox.listAz1Apply(people, [
  function(r){ return r.name; },
  function(r){ return r.id; }
]);
assert.deepStrictEqual(Array.from(sorted, function(r){ return r.id; }), ['1', '2', '9', '3']);
assert.deepStrictEqual(people.map(function(r){ return r.id; }), ['3', '2', '1', '9'], 'source order stays for usual');

const aides = [
  { name: 'Zoe', username: 'zoe', id: 'z' },
  { name: 'Zoe', username: 'amy', id: 'a' },
  { name: 'Ada', username: 'ada', id: 'd' }
];
const aideOrder = Array.from(sandbox.listAz1Apply(aides, [
  function(u){ return u.name; },
  function(u){ return u.username; },
  function(u){ return u.id; }
]), function(u){ return u.username; });
assert.deepStrictEqual(aideOrder, ['ada', 'amy', 'zoe']);

const sheets = [
  { empName: 'Zoe', clientName: 'Bea', weekStart: '2026-09-14', id: '1' },
  { empName: 'Ada', clientName: 'Zoe', weekStart: '2026-09-21', id: '2' },
  { empName: 'Ada', clientName: 'Bea', weekStart: '2026-09-28', id: '3' },
  { empName: 'Ada', clientName: 'Bea', weekStart: '2026-09-07', id: '4' }
];
const sheetOrder = Array.from(sandbox.listAz1Apply(sheets, [
  function(r){ return r.empName || r.username; },
  function(r){ return r.clientName; },
  function(r){ return r.weekStart; },
  function(r){ return r.id; }
]), function(r){ return r.id; });
assert.deepStrictEqual(sheetOrder, ['4', '3', '2', '1']);

const shifts = [
  { clientName: 'Client', aideName: 'Zoe', id: 's2' },
  { clientName: 'Bowlax Abib', aideName: 'Moe', id: 's1' },
  { clientName: '', aideName: 'Ada', id: 's3' }
];
const shiftOrder = Array.from(sandbox.listAz1Apply(shifts, [
  function(s){
    var name = String(s.clientName || '').trim();
    if (!name || name === 'Client') return s.aideName || '';
    return name;
  },
  function(s){ return s.id; }
]), function(s){ return s.id; });
assert.deepStrictEqual(shiftOrder, ['s3', 's1', 's2']);

const headOff = (function(){ sandbox.listAz1Write('usual'); return sandbox.schedClientHeadHtml(); })();
assert.ok(headOff.indexOf('aria-pressed="false"') > headOff.indexOf('Client'), 'off chip follows Client');
assert.ok(headOff.includes('class="sched-az-chip"'));
sandbox.listAz1Write('az');
const headOn = sandbox.schedClientHeadHtml();
assert.ok(headOn.includes('aria-pressed="true"'));
assert.strictEqual(sandbox.listAz1QueryOn(), true);
assert.strictEqual(sandbox.listAz1NoteQuery(), true);
assert.strictEqual(sandbox.document.documentElement['data-list-az1'], 'v=list-az1');

const threads = [
  { name: 'Zoe', id: '2', urgent: true, last_at: '2026-09-27T12:00:00Z' },
  { name: 'Ada', username: 'ada', id: '1', urgent: false, last_at: '2026-09-01T12:00:00Z' }
];
sandbox.aidechatThreads = threads;
sandbox.aidechatIsOpen = function(){ return true; };
sandbox.aidechatWantEscalateOnly = function(){ return false; };
const aidechatSrc = html.slice(html.indexOf('function aidechatSorted'), html.indexOf('function aidechatReadSession'));
vm.runInContext(aidechatSrc, sandbox);
const azThreads = Array.from(sandbox.aidechatSorted(), function(t){ return t.name; });
assert.deepStrictEqual(azThreads, ['Ada', 'Zoe']);
sandbox.listAz1Write('usual');
const usualThreads = Array.from(sandbox.aidechatSorted(), function(t){ return t.name; });
assert.deepStrictEqual(usualThreads, ['Zoe', 'Ada'], 'usual keeps urgent then recency');

console.log('admin-list-az1-test ok');
