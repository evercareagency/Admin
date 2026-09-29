#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=login-land-schedule1'), 'login-land-schedule1 marker');
assert.ok(html.includes('?v=login-land-schedule1'), 'login land query marker');
assert.ok(html.includes('v=list-search-az1'), 'list-search-az1 marker');
assert.ok(html.includes('?v=list-search-az1'), 'list search query marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-login-land-schedule1">'), 'login land meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-list-search-az1">'), 'list search meta');
assert.ok(html.includes("var LOGIN_LAND_SCHEDULE1_MARKER='v=login-land-schedule1'"), 'login land script marker');
assert.ok(html.includes("var LIST_SEARCH_AZ1_MARKER='v=list-search-az1'"), 'list search script marker');
assert.ok(html.includes('GHOST-LOGIN-LAND-SCHEDULE1-CONTRACT-v1'), 'login land contract');
assert.ok(html.includes('GHOST-LIST-SEARCH-AZ1-CONTRACT-v1'), 'list search contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No SQL'), 'no SQL');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-29-login-land-schedule1"'), 'login land meta follows hide1b');
assert.ok(html.indexOf('content="2026-09-29-login-land-schedule1"') < html.indexOf('content="2026-09-29-list-search-az1"'), 'both build metas');

const navStart = html.indexOf('id="bottomNav"');
const nav = html.slice(navStart, html.indexOf('</nav>', navStart));
assert.ok(nav.includes('data-login-land-schedule1="v=login-land-schedule1"'), 'bottom nav login marker');
assert.ok(nav.includes('id="nav_schedule"') && nav.includes('class="nav-item bottom-tab active"'), 'Schedule tab is the default active bottom tab');
assert.ok(nav.indexOf('id="nav_schedule"') < nav.indexOf('bottom-tab active') || nav.includes('bottom-tab active" data-layout-roles="Admin Scheduler" onclick="showTab(\'schedule\')" id="nav_schedule"'), 'Schedule button carries active');
assert.ok(!/id="nav_timesheets"[^>]*\bactive\b/.test(nav) && !nav.slice(0, nav.indexOf('id="nav_timesheets"') + 40).includes(' active'), 'Timesheets is not the default active tab');
assert.ok(!nav.includes('id="nav_more" class') || nav.indexOf('bottom-tab active') < nav.indexOf('id="nav_more"'), 'More is not the active tab');
const timesheetsBtn = nav.slice(nav.indexOf('id="nav_timesheets"') - 180, nav.indexOf('id="nav_timesheets"'));
assert.ok(!timesheetsBtn.includes('bottom-tab active'), 'Timesheets button is not active');
const moreBtn = nav.slice(nav.indexOf('id="nav_more"') - 160, nav.indexOf('id="nav_more"'));
assert.ok(!moreBtn.includes('bottom-tab active'), 'More button is not active');

assert.ok(html.includes('class="tab-panel active" id="tab_schedule"'), 'Schedule desk is the default panel');
assert.ok(!html.includes('class="tab-panel active" id="tab_timesheets"'), 'Timesheets panel is not the default');
assert.ok(!html.includes('class="tab-panel active" id="tab_more"'), 'More panel is not the default');

assert.ok(html.includes('#adminScreen #bottomNav{bottom:var(--login-land-vv-lift,0px);padding-bottom:env(safe-area-inset-bottom,0px);}'), 'bottom nav uses visualViewport lift and safe-area inset');
assert.ok(html.includes('function loginLandSchedule1FitNav()'), 'fit uses visualViewport');
assert.ok(html.includes('window.visualViewport'), 'visualViewport listener');
assert.ok(html.includes('loginLandSchedule1VvGap'), 'gap helper');
assert.ok(html.includes('--login-land-vv-lift'), 'lift custom property');
assert.ok((html.match(/id="bottomNav"/g) || []).length === 1, 'one bottom nav');
assert.ok(!html.slice(html.indexOf('id="nurseScreen"'), html.indexOf('id="nurseScreen"') + 400).includes('id="bottomNav"'), 'Nurse screen does not own #bottomNav');

const homeFn = html.slice(html.indexOf('function openPortalHome'), html.indexOf('function enforceAdminSessionTimeout'));
const nurseBranch = homeFn.slice(homeFn.indexOf("if(role==='Nurse')"), homeFn.indexOf('}else{'));
assert.ok(nurseBranch.includes("showNurseTab('compliance')"), 'Nurse still opens compliance');
assert.ok(!nurseBranch.includes('loginLandSchedule1Apply'), 'Nurse home does not take the Schedule land');
assert.ok(homeFn.includes('loginLandSchedule1Apply(fresh)'), 'Admin and Scheduler apply the Schedule land');
assert.ok(html.includes("showScreen('nurseScreen')"), 'Nurse screen stays');

const aidesHdr = html.slice(html.indexOf('id="tab_aides"'), html.indexOf('id="aideDesk"'));
assert.ok(aidesHdr.includes('<h1>Aides</h1>'), 'Aides title stays the title');
assert.ok(aidesHdr.includes('class="list-search-az1-row"'), 'Aides search is its own row');
assert.ok(aidesHdr.indexOf('<h1>Aides</h1>') < aidesHdr.indexOf('id="aidesListSearch"'), 'Aides search sits under the title');
assert.ok(aidesHdr.includes('id="aidesListSearch"'), 'Aides search is in the header');
assert.ok(aidesHdr.includes('placeholder="Find an aide..."'), 'Aides placeholder matches the shot');
assert.ok(aidesHdr.includes('id="aidesAzChip"'), 'Aides A–Z chip stays');
assert.ok(aidesHdr.indexOf('id="aidesListSearch"') < aidesHdr.indexOf('id="aidesAzChip"'), 'Aides search sits beside the A–Z chip');
assert.ok(aidesHdr.includes('data-layout-roles="Admin Scheduler"'), 'Aides search is Admin and Scheduler');
assert.ok(aidesHdr.includes('oninput="listSearchAz1OnAides()"'), 'Aides search filters the list');
assert.ok(aidesHdr.includes('class="sched-az-chip list-az-chip"'), 'Aides chip class stays');
assert.ok(!aidesHdr.includes('data-layout-roles="Admin"'), 'Aides search is not Admin-only');

const clientsHdr = html.slice(html.indexOf('id="tab_clients"'), html.indexOf('id="clientSearch"'));
assert.ok(clientsHdr.includes('<h1>Clients</h1>'), 'Clients title stays the title');
assert.ok(clientsHdr.includes('class="list-search-az1-row"'), 'Clients search is its own row');
assert.ok(clientsHdr.includes('id="clientsListSearch"'), 'Clients search is in the header');
assert.ok(clientsHdr.includes('placeholder="Find a client..."'), 'Clients placeholder matches the shot');
assert.ok(clientsHdr.includes('id="clientsAzChip"'), 'Clients A–Z chip stays');
assert.ok(clientsHdr.indexOf('id="clientsListSearch"') < clientsHdr.indexOf('id="clientsAzChip"'), 'Clients search sits beside the A–Z chip');
assert.ok(clientsHdr.includes('data-layout-roles="Admin Scheduler"'), 'Clients search is Admin and Scheduler');
assert.ok(clientsHdr.includes('oninput="listSearchAz1OnClients()"'), 'Clients search filters the list');
assert.ok(html.includes('id="clientSearch"'), 'existing client search id stays');
assert.ok(html.includes('height:16px;min-height:16px;max-height:16px'), 'page-hdr A–Z chip rule stays 16px');
assert.ok(html.includes('#tab_aides .list-search-az1-row .list-az-chip') && html.includes('height:44px;min-height:44px'), 'search-row chip matches the field');
assert.ok(html.includes('evercare_list_order'), 'A–Z preference stays');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start > 0, sig);
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

const tabs = ['schedule', 'more', 'timesheets', 'aides', 'clients', 'coverage', 'aidechat'];
const shown = [];
const sandbox = {
  LOGIN_LAND_SCHEDULE1_MARKER: 'v=login-land-schedule1',
  LIST_SEARCH_AZ1_MARKER: 'v=list-search-az1',
  currentAdminRole: 'Admin',
  location: {hash: '', search: '?v=login-land-schedule1&v=list-search-az1'},
  document: {
    documentElement: {
      style: {setProperty: function(k, v){this[k] = v;}},
      setAttribute: function(k, v){this[k] = v;}
    },
    getElementById: function(id){
      if(id === 'bottomNav')return sandbox.nav;
      if(id === 'aidesListSearch')return sandbox.aideSearch;
      if(id === 'clientsListSearch')return sandbox.clientSearch;
      if(String(id).indexOf('tab_') === 0){
        const name = id.slice(4);
        return tabs.indexOf(name) >= 0 ? {id: id} : null;
      }
      return null;
    },
    querySelector: function(sel){
      if(sel === '#adminScreen .tab-panel.active')return {id: 'tab_' + sandbox.active};
      return null;
    }
  },
  window: {
    innerHeight: 800,
    visualViewport: {height: 700, offsetTop: 0, addEventListener: function(){}},
    addEventListener: function(){}
  },
  loginKbFixedFollowsLayout: function(){return true;},
  layoutA1HashTab: function(){
    const raw = String(sandbox.location.hash || '').replace(/^#/, '').split('?')[0].split('&')[0].trim().toLowerCase();
    if(!raw)return '';
    return sandbox.document.getElementById('tab_' + raw) ? raw : '';
  },
  showTab: function(tab){shown.push(tab); sandbox.active = tab;},
  loadAdminSchedule: function(){shown.push('load-schedule');},
  nav: {style: {}},
  aideSearch: {value: ''},
  clientSearch: {value: ''},
  active: 'schedule'
};
vm.createContext(sandbox);
const blockStart = html.indexOf('function loginLandSchedule1RoleOk');
const blockEnd = html.indexOf('try{loginLandSchedule1Note();listSearchAz1Note();}');
assert.ok(blockStart > 0 && blockEnd > blockStart, 'land and search block');
vm.runInContext(html.slice(blockStart, blockEnd), sandbox);

assert.strictEqual(sandbox.loginLandSchedule1RoleOk('Admin'), true);
assert.strictEqual(sandbox.loginLandSchedule1RoleOk('Scheduler'), true);
assert.strictEqual(sandbox.loginLandSchedule1RoleOk('Nurse'), false);
assert.strictEqual(sandbox.loginLandSchedule1Deep('#schedule?client_id=abc&on_date=2026-09-29', ''), true);
assert.strictEqual(sandbox.loginLandSchedule1Deep('#aides?aide_id=uuid', ''), true);
assert.strictEqual(sandbox.loginLandSchedule1Deep('#more', ''), false);

sandbox.location.hash = '#more';
sandbox.currentAdminRole = 'Admin';
assert.strictEqual(sandbox.loginLandSchedule1Should(true, 'Admin'), true, 'fresh Admin sign-in leaves More');
assert.strictEqual(sandbox.loginLandSchedule1Should(true, 'Scheduler'), true, 'fresh Scheduler sign-in leaves More');
assert.strictEqual(sandbox.loginLandSchedule1Should(false, 'Admin'), true, 'a #more reload is not the home');
assert.strictEqual(sandbox.loginLandSchedule1Should(true, 'Nurse'), false, 'Nurse does not take Schedule land');

sandbox.location.hash = '';
assert.strictEqual(sandbox.loginLandSchedule1Should(false, 'Scheduler'), true, 'empty hash opens Schedule');
sandbox.location.hash = '#aides';
assert.strictEqual(sandbox.loginLandSchedule1Should(false, 'Scheduler'), false, 'reload of Aides stays');
assert.strictEqual(sandbox.loginLandSchedule1Should(true, 'Admin'), true, 'fresh login still prefers Schedule');
sandbox.location.hash = '#schedule?client_id=1&on_date=2026-09-29';
assert.strictEqual(sandbox.loginLandSchedule1Should(true, 'Scheduler'), false, 'schedule deep link stays');

shown.length = 0;
sandbox.location.hash = '#more';
sandbox.currentAdminRole = 'Scheduler';
sandbox.active = 'more';
assert.strictEqual(sandbox.loginLandSchedule1Apply(true), true);
assert.deepStrictEqual(shown, ['schedule'], 'Scheduler fresh login shows Schedule');
assert.strictEqual(sandbox.document.documentElement['data-login-land-schedule1'], 'v=login-land-schedule1');

sandbox.location.hash = '#clients';
shown.length = 0;
sandbox.loginLandSchedule1Apply._loaded = 0;
assert.strictEqual(sandbox.loginLandSchedule1Apply(false), false, 'Clients hash is kept');
assert.deepStrictEqual(shown, [], 'kept desk does not showTab schedule');

assert.strictEqual(sandbox.loginLandSchedule1VvGap({height: 700, offsetTop: 0}, 800), 100, 'visual viewport gap lifts the bar');
assert.strictEqual(sandbox.loginLandSchedule1VvGap({height: 800, offsetTop: 0}, 800), 0, 'no gap when the viewports match');
assert.strictEqual(sandbox.loginLandSchedule1VvGap({height: 640, offsetTop: 50}, 800), 110, 'top chrome plus bottom chrome');
assert.strictEqual(sandbox.loginLandSchedule1FitNav(), 100);
assert.strictEqual(sandbox.document.documentElement.style['--login-land-vv-lift'], '100px');
assert.strictEqual(sandbox.nav.style.bottom, '100px');
sandbox.window.visualViewport = null;
assert.strictEqual(sandbox.loginLandSchedule1FitNav(), 0, 'no visualViewport still leaves env(safe-area) to CSS');
assert.strictEqual(sandbox.nav.style.bottom, '');

const people = [
  {name: 'Zoe Adams', username: 'zoe', phone: '2165550102', id: '3'},
  {name: 'Ada Cole', username: 'ada', phone: '2165550100', id: '1'},
  {name: 'Jasmine Reed', username: 'jasmine', phone: '2165550199', id: 'j'},
  {name: 'Maria Lopez', username: 'maria', phone: '2165550101', id: '9'}
];
const az = people.slice().sort(function(a, b){
  return String(a.name).localeCompare(String(b.name)) || String(a.id).localeCompare(String(b.id));
});
const hit = sandbox.listSearchAz1FilterRows(az, function(u){
  return [u.name, u.username, u.phone];
}, 'ad');
function plain(list, pick){
  return Array.from(list, function(row){return String(pick(row));});
}
assert.deepStrictEqual(plain(hit, function(u){return u.name;}), ['Ada Cole', 'Zoe Adams'], 'A-Z order stays while search narrows');
const jasmine = sandbox.listSearchAz1FilterRows(az, function(u){
  return [u.name, u.username, u.phone];
}, 'jasmine');
assert.deepStrictEqual(plain(jasmine, function(u){return u.username;}), ['jasmine'], 'Scheduler Aides search finds Jasmine');
const usual = people.slice();
const usualHit = sandbox.listSearchAz1FilterRows(usual, function(u){return [u.name, u.username, u.phone];}, 'a');
assert.deepStrictEqual(plain(usualHit, function(u){return u.id;}), ['3', '1', 'j', '9'], 'usual order stays when A-Z is off');
assert.deepStrictEqual(people.map(function(u){return u.id;}), ['3', '1', 'j', '9'], 'source order is not rewritten');

const clients = [
  {name: 'Zoe Client', phone: '2165550102', id: 'z'},
  {name: 'Ada Client', phone: '2165550100', id: 'a'},
  {name: 'Maria Client', phone: '2165550101', id: 'm'}
];
const clientAz = clients.slice().sort(function(a, b){return String(a.name).localeCompare(String(b.name));});
const clientHit = sandbox.listSearchAz1FilterRows(clientAz, function(c){return [c.name, c.phone];}, '2165550100');
assert.deepStrictEqual(plain(clientHit, function(c){return c.id;}), ['a']);
const clientNames = sandbox.listSearchAz1FilterRows(clientAz, function(c){return [c.name, c.phone];}, 'client');
assert.deepStrictEqual(plain(clientNames, function(c){return c.name;}), ['Ada Client', 'Maria Client', 'Zoe Client'], 'Clients stay A–Z under search');

sandbox.aideSearch.value = '  Jasmine ';
assert.strictEqual(sandbox.listSearchAz1Query('aidesListSearch'), 'jasmine');
sandbox.clientSearch.value = 'Ada';
assert.strictEqual(sandbox.listSearchAz1ClientQuery(), 'ada');
assert.strictEqual(sandbox.listSearchAz1Note(), true);
assert.strictEqual(sandbox.document.documentElement['data-list-search-az1'], 'v=list-search-az1');

console.log('admin-login-land-list-search-test: ok');
