#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=list-az-sticky1'), 'list-az-sticky1 marker');
assert.ok(html.includes('?v=list-az-sticky1'), 'query marker');
assert.ok(html.includes('data-list-az-sticky1="v=list-az-sticky1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-28-list-az-sticky1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-list-az-sticky1">'), 'meta');
assert.ok(html.includes('<!-- list az sticky 2026-09-28 v=list-az-sticky1 ?v=list-az-sticky1 admin-build 2026-09-28-list-az-sticky1'), 'comment');
assert.ok(html.includes("var LIST_AZ_STICKY1_MARKER='v=list-az-sticky1'"), 'script marker');
assert.ok(html.includes("var LIST_AZ_STICKY1_BUILD='2026-09-28-list-az-sticky1'"), 'script build');
assert.ok(html.includes('GHOST-LIST-AZ-STICKY1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('v=list-az1'), 'keeps list-az1');
assert.ok(html.includes('v=punch-leftovers1'), 'keeps punch-leftovers1');
assert.ok(html.includes('evercare_list_order'), 'keeps the list-az1 preference');
assert.ok(html.includes('class="sched-az-chip"'), 'schedule chip stays');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-28-list-az-sticky1"'), 'sticky meta follows hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-compliance-bulk1"'), 'compliance-bulk1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-28-punch-leftovers1"') < html.indexOf('content="2026-09-28-list-az-sticky1"') || html.indexOf('content="2026-09-28-list-az-sticky1"') < html.indexOf('content="2026-09-28-punch-leftovers1"'), 'both punch and sticky metas exist');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-punch-leftovers1">'), 'punch meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-list-az1">'), 'list-az1 meta stays');

assert.ok(html.includes('id="tab_aides"') && html.includes('data-list-az-sticky1="v=list-az-sticky1"'), 'aides tab marker');
assert.ok(html.includes('id="tab_clients"') && html.includes('data-list-az-sticky1="v=list-az-sticky1"'), 'clients tab marker');
assert.ok(html.includes('FIX A3'), 'FIX A3 notes the shared chip');
assert.ok(html.includes('FIX A4: Admin default Aides rail mounts on #aideCredList when A–Z is on; Manage stays credentials-only.'), 'FIX A4 mounts the rail on the creds list');
assert.ok(html.includes('#aideCredList .az-rail') && html.includes('#aideCredsRoot .az-stage'), 'creds list shares the rail css');
assert.ok(html.includes('#aideCredList .az-scroll .aide-cred-person'), 'creds cards clear the rail');

const aidesHdr = html.slice(html.indexOf('id="tab_aides"'), html.indexOf('id="aideDesk"'));
assert.ok(aidesHdr.includes('id="aidesAzChip"'), 'Aides header has the A–Z chip');
assert.ok(aidesHdr.includes('class="sched-az-chip list-az-chip"'), 'Aides chip uses the shared tiny class');
assert.ok(aidesHdr.includes('onclick="listAz1Toggle(event)"'), 'Aides chip calls listAz1Toggle');
assert.ok(aidesHdr.includes('aria-pressed='), 'Aides chip reflects pressed state');
assert.ok(aidesHdr.includes('data-list-az1="v=list-az1"'), 'Aides chip shares the list-az1 preference');
assert.ok(aidesHdr.includes('id="aideCredManageBtn"') && aidesHdr.includes('onclick="aideCredToggleManage()"'), 'Manage stays the credentials control');
assert.ok(!aidesHdr.slice(aidesHdr.indexOf('id="aideCredManageBtn"'), aidesHdr.indexOf('id="aideCredManageBtn"') + 180).includes('listAz1Toggle'), 'Manage does not toggle list order');

const clientsHdr = html.slice(html.indexOf('id="tab_clients"'), html.indexOf('id="clientSearch"'));
assert.ok(clientsHdr.includes('id="clientsAzChip"'), 'Clients header has the A–Z chip');
assert.ok(clientsHdr.includes('class="sched-az-chip list-az-chip"'), 'Clients chip uses the shared tiny class');
assert.ok(clientsHdr.includes('onclick="listAz1Toggle(event)"'), 'Clients chip calls listAz1Toggle');
assert.ok(clientsHdr.includes('aria-pressed='), 'Clients chip reflects pressed state');
assert.ok(html.includes('#tab_aides .page-hdr .list-az-chip') && html.includes('height:16px;min-height:16px;max-height:16px'), 'desk chip stays 16px, not a fat pill');
assert.ok(html.includes('#tab_aides .az-rail') && html.includes('#tab_clients .az-rail'), 'rail css on both desks');
assert.ok(html.includes('.az-rail button.on') && html.includes('background:var(--teal)'), 'active letter is teal');
assert.ok(html.includes('padding:0 32px 16px 0'), 'scroll pad clears the rail');

const aidesPaint = html.slice(html.indexOf('async function aidesInfo1TryPaint'), html.indexOf('// end v=aides-info1'));
assert.ok(aidesPaint.includes('listAzSticky1StageHtml'), 'info cards mount the rail');
assert.ok(aidesPaint.includes("typeof listAzSticky1On==='function'&&listAzSticky1On()"), 'info cards rail follows A–Z preference');
const fallback = html.slice(html.indexOf('async function renderAides'), html.indexOf('var aideCredState'));
assert.ok(fallback.includes('listAzSticky1StageHtml'), 'fallback aide cards mount the rail');
assert.ok(fallback.includes('class="aide-row-card"'), 'fallback cards stay');
const clients = html.slice(html.indexOf('function paintClients'), html.indexOf('async function loadAidesForAssignment'));
assert.ok(clients.includes('listAzSticky1StageHtml'), 'clients mount the rail');
assert.ok(clients.includes('clientCards.join'), 'usual clients paint stays a card list');
assert.ok(clients.includes("typeof listAzSticky1On==='function'&&listAzSticky1On()"), 'clients rail follows A–Z preference');
const clientsGate = clients.indexOf("typeof listAzSticky1On==='function'&&listAzSticky1On()");
const clientsStageCall = clients.indexOf('listAzSticky1StageHtml');
const clientsUsualJoin = clients.indexOf('container.innerHTML=clientCards.join');
assert.ok(clientsGate >= 0 && clientsStageCall > clientsGate, 'Clients stage html is inside the A–Z gate');
assert.ok(clientsUsualJoin > clientsStageCall, 'usual Clients paint joins cards after the gate returns');
assert.ok(!clients.slice(clientsUsualJoin).includes('listAzSticky1StageHtml'), 'usual Clients never mounts listAzSticky1StageHtml');
const credPaint = html.slice(html.indexOf('function aideCredPaintList'), html.indexOf('function aideCredEmptyAddHtml'));
assert.ok(credPaint.includes('listAzSticky1StageHtml'), 'default Aides creds list mounts the rail');
assert.ok(credPaint.includes("typeof listAzSticky1On==='function'&&listAzSticky1On()"), 'creds rail follows A–Z preference');
assert.ok(credPaint.includes('listAzSticky1Bind(list)'), 'creds rail binds jump on the visible list');
assert.ok(credPaint.includes('listAz1Apply(rows,'), 'creds rows sort A–Z by display name');
assert.ok(credPaint.includes('emptyHtml+(stage||people)'), 'empty credential block stays above the stage');
const credUsual = credPaint.indexOf('list.innerHTML=emptyHtml+people');
assert.ok(credUsual > credPaint.indexOf('listAzSticky1StageHtml'), 'usual creds list is the flat paint');
assert.ok(!credPaint.slice(credUsual).includes('listAzSticky1StageHtml'), 'usual creds list does not mount the stage');
const repaint = html.slice(html.indexOf('function listAz1Repaint'), html.indexOf('function listAz1Toggle'));
assert.ok(repaint.includes('aideCredPaintList()'), 'toggle repaints the visible creds list');
assert.ok(repaint.includes("aideCredState.view!=='detail'"), 'detail view is left alone');

const start = html.indexOf('// list az sticky rail v=list-az-sticky1');
const end = html.indexOf('// end list az sticky rail v=list-az-sticky1');
assert.ok(start > 0 && end > start, 'sticky block');
const store = {};
const sandbox = {
  localStorage: {
    getItem: function(k){ return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function(k, v){ store[k] = String(v); }
  },
  location: { search: '?v=list-az-sticky1' },
  document: { documentElement: { setAttribute: function(k, v){ this[k] = v; } } },
  navEditIdentity: function(){ return { id: 'admin-1', email: 'mo@evercare.test' }; }
};
vm.createContext(sandbox);
const azStart = html.indexOf('// list order A–Z v=list-az1');
const azEnd = html.indexOf('// end list order A–Z v=list-az1');
vm.runInContext(html.slice(azStart, azEnd) + '\n' + html.slice(start, end), sandbox);

assert.strictEqual(sandbox.LIST_AZ_STICKY1_MARKER, 'v=list-az-sticky1');
assert.strictEqual(sandbox.listAzSticky1QueryOn(), true);
assert.strictEqual(sandbox.listAzSticky1NoteQuery(), true);
assert.strictEqual(sandbox.document.documentElement['data-list-az-sticky1'], 'v=list-az-sticky1');
sandbox.listAz1Write('usual');
assert.strictEqual(sandbox.listAzSticky1On(), false);
sandbox.listAz1Write('az');
assert.strictEqual(sandbox.listAzSticky1On(), true);

assert.strictEqual(sandbox.listAzSticky1Letter('Marcus Lee'), 'M');
assert.strictEqual(sandbox.listAzSticky1Letter('  nora'), 'N');
assert.strictEqual(sandbox.listAzSticky1Letter('Álvaro'), 'A');
assert.strictEqual(sandbox.listAzSticky1Letter(''), '#');
assert.strictEqual(sandbox.listAzSticky1Letter('3rd shift'), '#');
assert.strictEqual(sandbox.listAzSticky1Nearest(['A', 'M', 'N'], 'M'), 'M');
assert.strictEqual(sandbox.listAzSticky1Nearest(['A', 'M', 'N'], 'B'), 'M');
assert.strictEqual(sandbox.listAzSticky1Nearest(['A', 'C'], 'Z'), 'C');
assert.strictEqual(sandbox.listAzSticky1Nearest(['#'], 'A'), '#');

const people = [
  { name: 'Marcus Lee', html: '<article class="aide-info-card">Marcus Lee</article>' },
  { name: 'Maria Santos', html: '<article class="aide-info-card">Maria Santos</article>' },
  { name: 'Moe Hassan', html: '<article class="aide-info-card">Moe Hassan</article>' },
  { name: 'Nina Okonkwo', html: '<article class="aide-info-card">Nina Okonkwo</article>' }
];
const stage = sandbox.listAzSticky1StageHtml(people);
assert.ok(stage.includes('class="az-stage"'), 'stage');
assert.ok(stage.includes('class="az-rail"'), 'rail');
assert.ok(stage.includes('data-list-az-sticky1="v=list-az-sticky1"'), 'stage marker');
assert.ok((stage.match(/data-az="/g) || []).length === 26, 'A through Z buttons');
assert.ok(stage.includes('>M</button>') && stage.includes('class="on"'), 'first present letter starts on');
assert.ok(stage.indexOf('data-az-letter="M"') < stage.indexOf('Marcus Lee'), 'M section before Marcus');
assert.ok(stage.indexOf('Marcus Lee') < stage.indexOf('data-az-letter="N"'), 'N section after the M cards');
assert.ok(stage.includes('Nina Okonkwo'), 'later letter stays');
assert.strictEqual((stage.match(/class="az-sec"/g) || []).length, 2, 'one section per letter');
assert.ok(!sandbox.listAzSticky1StageHtml([]), 'empty list has no rail');

const chips = {};
sandbox.document.getElementById = function(id){
  if(!chips[id]) chips[id] = { attrs: {} };
  return { setAttribute: function(k, v){ chips[id].attrs[k] = v; } };
};
sandbox.listAz1Write('az');
sandbox.listAzSticky1SyncChips();
assert.strictEqual(chips.aidesAzChip.attrs['aria-pressed'], 'true', 'Aides chip pressed follows listAz1On');
assert.strictEqual(chips.clientsAzChip.attrs['aria-pressed'], 'true', 'Clients chip pressed follows listAz1On');
sandbox.listAz1Write('usual');
sandbox.listAzSticky1SyncChips();
assert.strictEqual(chips.aidesAzChip.attrs['aria-pressed'], 'false');
assert.strictEqual(chips.clientsAzChip.attrs['aria-pressed'], 'false');
assert.strictEqual(sandbox.listAzSticky1On(), false, 'usual still hides the rail');

const headFn = html.slice(html.indexOf('function schedClientHeadHtml'), html.indexOf('function schedPaint()'));
assert.ok(headFn.includes('class="sched-az-chip"'), 'schedule chip placement unchanged');
assert.ok(!headFn.includes('az-rail'), 'schedule header does not grow a rail');
assert.ok(html.includes('listAzSticky1SyncChips'), 'repaint syncs the desk chips');
assert.ok(html.includes("querySelector('.aide-info-card, .aide-row-card, .az-stage, .az-rail')"), 'Aides repaint drops or remounts the rail');

console.log('admin-list-az-sticky1-test ok');
