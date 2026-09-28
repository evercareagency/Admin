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
assert.ok(html.includes('function listAz1SchedRows(clients)'), 'slot clients go through listAz1SchedRows');
assert.ok(html.includes('function listAz1ReorderSchedDom()'), 'schedule DOM reorder');
assert.ok(html.includes("if(typeof listAz1On==='function'&&listAz1On())return rows;"), 'aide office sort yields to A–Z');
assert.ok(html.includes('function listAz1TimesheetRows(recs)'), 'timesheets go through listAz1TimesheetRows');
assert.ok(html.includes('recs=listAz1TimesheetRows(recs)'), 'timesheet paint sorts by painted aide name');
assert.ok(html.includes("if(tab==='timesheets')") && html.includes('paintTimesheets()'), 'timesheets repaint when the tab opens with the sticky pref');

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
sandbox.listAz1Write('usual');
assert.strictEqual(sandbox.listAz1TimesheetRows(sheets), sheets, 'usual timesheets stay today’s order');
sandbox.listAz1Write('az');
assert.deepStrictEqual(Array.from(sandbox.listAz1TimesheetRows(sheets), function(r){ return r.id; }), ['4', '3', '2', '1'], 'timesheet helper keeps aide then client then week');

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

const probeClients = [
  { id: 'q', name: 'QaHold Clientgc3oi' },
  { id: 'p', name: 'ProbeHold HC1kgaxcu' },
  { id: 'c', name: 'CoverCard mukk61tk' },
  { id: 'b', name: 'Bowlax Abib' }
];
sandbox.listAz1Write('usual');
assert.strictEqual(sandbox.listAz1SchedRows(probeClients), probeClients, 'usual schedule rows stay the server array');
sandbox.listAz1Write('az');
assert.deepStrictEqual(Array.from(sandbox.listAz1SchedRows(probeClients), function(c){ return c.name; }), [
  'Bowlax Abib',
  'CoverCard mukk61tk',
  'ProbeHold HC1kgaxcu',
  'QaHold Clientgc3oi'
], 'A–Z reorders schedule client rows');
assert.deepStrictEqual(probeClients.map(function(c){ return c.id; }), ['q', 'p', 'c', 'b'], 'usual source order is untouched');

function fakeSchedRow(id, name, usual){
  return {
    attrs: { id: 'sched-row-' + id, 'data-sched-name': name, 'data-list-usual': String(usual) },
    getAttribute: function(k){ return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    querySelector: function(){ return null; }
  };
}
const schedBody = {
  children: [
    fakeSchedRow('q', 'QaHold Clientgc3oi', 0),
    fakeSchedRow('p', 'ProbeHold HC1kgaxcu', 1),
    fakeSchedRow('c', 'CoverCard mukk61tk', 2),
    fakeSchedRow('b', 'Bowlax Abib', 3)
  ],
  querySelectorAll: function(){
    return this.children.filter(function(node){ return String(node.attrs.id || '').indexOf('sched-row-') === 0; });
  },
  appendChild: function(node){
    var at = this.children.indexOf(node);
    if(at >= 0) this.children.splice(at, 1);
    this.children.push(node);
  }
};
sandbox.document.getElementById = function(id){ return id === 'schedBody' ? schedBody : null; };
sandbox.listAz1Write('az');
sandbox.listAz1ReorderSchedDom();
assert.deepStrictEqual(schedBody.children.map(function(node){ return node.attrs['data-sched-name']; }), [
  'Bowlax Abib',
  'CoverCard mukk61tk',
  'ProbeHold HC1kgaxcu',
  'QaHold Clientgc3oi'
], 'schedule DOM rows move A–Z');
sandbox.listAz1Write('usual');
sandbox.listAz1ReorderSchedDom();
assert.deepStrictEqual(schedBody.children.map(function(node){ return node.attrs.id; }), [
  'sched-row-q',
  'sched-row-p',
  'sched-row-c',
  'sched-row-b'
], 'schedule DOM rows restore usual order');

const officeSort = html.slice(html.indexOf('function aideOfficeVis1Sort'), html.indexOf('function aideOfficeVis1Node'));
vm.runInContext(officeSort, sandbox);
sandbox.aidechatThreads = [
  { name: 'Langs1Fatima', id: 'fat', has_unread: true, unread: 5, urgent: false, last_at: '2026-09-27T20:00:00Z', last_message_at: '2026-09-27T20:00:00Z' },
  { name: 'moe', id: 'moe', has_unread: false, unread: 0, urgent: true, last_at: '2026-09-27T18:00:00Z', last_message_at: '2026-09-27T18:00:00Z' },
  { name: 'QA Probe', id: 'qa', has_unread: true, unread: 1, urgent: false, last_at: '2026-09-27T12:00:00Z', last_message_at: '2026-09-27T12:00:00Z' },
  { name: 'Fh1Devon', id: 'dev', has_unread: false, unread: 0, urgent: false, last_at: '2026-09-01T12:00:00Z', last_message_at: '2026-09-01T12:00:00Z' },
  { name: 'Lina', id: 'lina', has_unread: true, unread: 2, urgent: false, last_at: '2026-09-27T01:00:00Z', last_message_at: '2026-09-27T01:00:00Z' },
  { name: 'Probe Throwaway AOV1', id: 'aov', has_unread: false, unread: 0, urgent: false, last_at: '2026-09-26T12:00:00Z', last_message_at: '2026-09-26T12:00:00Z' }
];
sandbox.prevSort = sandbox.aidechatSorted;
const wrapAt = html.indexOf('var wrappedSort=function(){');
const wrapEnd = html.indexOf('wrappedSort.__aideOffice');
vm.runInContext(html.slice(wrapAt, wrapEnd) + '\nthis.wrappedSort=wrappedSort;', sandbox);
sandbox.listAz1Write('az');
assert.deepStrictEqual(Array.from(sandbox.wrappedSort(), function(t){ return t.name; }), [
  'Fh1Devon',
  'Langs1Fatima',
  'Lina',
  'moe',
  'Probe Throwaway AOV1',
  'QA Probe'
], 'messages inbox is global A–Z when the office wrapper is installed');
sandbox.listAz1Write('usual');
assert.deepStrictEqual(Array.from(sandbox.wrappedSort(), function(t){ return t.name; }), [
  'Langs1Fatima',
  'Lina',
  'QA Probe',
  'moe',
  'Probe Throwaway AOV1',
  'Fh1Devon'
], 'usual messages stay unread then urgent then recency');

const tsScramble = [
  { id: 'w2', empName: 'Whitfield', clientName: 'Andre', weekStart: '2026-09-21' },
  { id: 'w1', empName: 'Whitfield', clientName: 'Andre', weekStart: '2026-09-14' },
  { id: 'b', empName: 'Bowlax', clientName: 'Cover', weekStart: '2026-09-07' },
  { id: 'h', empName: 'Helen Park', clientName: 'Devon', weekStart: '2026-09-28' }
];
sandbox.listAz1Write('usual');
assert.strictEqual(sandbox.listAz1TimesheetRows(tsScramble), tsScramble, 'usual timesheet rows stay the scrambled server order');
sandbox.listAz1Write('az');
assert.deepStrictEqual(Array.from(sandbox.listAz1TimesheetRows(tsScramble), function(r){ return r.id; }), [
  'b', 'h', 'w1', 'w2'
], 'timesheets A–Z by painted aide name, then client, then week');
assert.deepStrictEqual(tsScramble.map(function(r){ return r.id; }), ['w2', 'w1', 'b', 'h'], 'usual timesheet source order is untouched');

function fakeTsCard(id, name, usual){
  return {
    attrs: { 'data-list-az-name': name, 'data-list-usual': String(usual), id: id },
    getAttribute: function(k){ return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    querySelector: function(){ return null; }
  };
}
const tsCards = {
  children: [
    fakeTsCard('w2', 'Whitfield', 0),
    fakeTsCard('w1', 'Whitfield', 1),
    fakeTsCard('b', 'Bowlax', 2),
    fakeTsCard('h', 'Helen Park', 3)
  ],
  querySelectorAll: function(){ return this.children.slice(); },
  appendChild: function(node){
    var at = this.children.indexOf(node);
    if(at >= 0) this.children.splice(at, 1);
    this.children.push(node);
  }
};
const prevGet = sandbox.document.getElementById;
sandbox.document.getElementById = function(id){
  if(id === 'tsCards') return tsCards;
  if(id === 'tsBody') return { querySelectorAll: function(){ return []; }, appendChild: function(){} };
  if(typeof prevGet === 'function') return prevGet(id);
  return null;
};
sandbox.listAz1Write('az');
sandbox.listAz1ReorderTimesheetDom();
assert.deepStrictEqual(tsCards.children.map(function(node){ return node.attrs['data-list-az-name']; }), [
  'Bowlax',
  'Helen Park',
  'Whitfield',
  'Whitfield'
], 'timesheet cards move A–Z by painted aide name');
sandbox.listAz1Write('usual');
sandbox.listAz1ReorderTimesheetDom();
assert.deepStrictEqual(tsCards.children.map(function(node){ return node.attrs.id; }), [
  'w2', 'w1', 'b', 'h'
], 'timesheet cards restore usual order');

console.log('admin-list-az1-test ok');
