#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=layoutA1'), 'layoutA1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-layoutA1">'), 'layoutA1 admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-layoutA1"') < html.indexOf('content="2026-09-25-admintheme1"'), 'layoutA1 is the current build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 marker stays');
assert.ok(html.includes('--teal:#2a7f7f') && html.includes('--navy:#1a2744'), 'teal/navy tokens stay');
assert.ok(!html.includes('navdrag1'), 'top-pill drag is not this tip');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
assert.ok(!admin.includes('sidebar-bottom'), 'admin shell has no full-width Sign Out bar');
assert.ok(admin.includes('id="adminSignOut"') && admin.includes('id="moreSignOut"'), 'Sign Out sits in the avatar menu and More account');
assert.ok(admin.includes('class="signout-row"'), 'Sign Out is a red row');
assert.ok(admin.includes('id="avatarMenu"'), 'avatar menu');
assert.ok(admin.includes('stats-slim') && admin.includes('id="tsCards"'), 'timesheets home is slim stats plus cards');
assert.ok(admin.includes('class="ts-sheet"'), 'spreadsheet remains in the DOM for list checks');

const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
let at = -1;
['nav_timesheets', 'nav_schedule', 'nav_aides', 'nav_backups', 'nav_more'].forEach(function(id){
  const i = nav.indexOf('id="' + id + '"');
  assert.ok(i > at, 'bottom nav order ' + id);
  at = i;
});
assert.ok(nav.includes('Timesheets') && nav.includes('> Schedule') && nav.includes('> Aides') && nav.includes('> Backup') && nav.includes('> More'), 'locked tab labels');
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'five bottom tabs');

const bak = admin.slice(admin.indexOf('id="tab_backups"'), admin.indexOf('id="tab_aides"'));
assert.ok(bak.includes('Phone-change draft'), 'backup tab is phone-change drafts');
assert.ok(!/Approve/i.test(bak), 'backup tab is not Approve-help');
assert.ok(!/Coverage/i.test(bak), 'coverage desk is not on Backup');
assert.ok(!bak.includes('<table'), 'backup tab is not a spreadsheet');
assert.ok(html.includes('>Open drafts<') && html.includes('>Mark saved on file<'), 'draft actions');
assert.ok(html.includes("['status','eq.draft']"), 'drafts stay status draft');
assert.ok(html.includes('{notes:notes}'), 'mark saved writes the file note');
assert.ok(!html.includes("status:'saved_on_file'") && !html.includes('status:"saved_on_file"'), 'mark saved does not invent a payroll status');

assert.ok(admin.includes('data-layout-roles="Admin Scheduler"'), 'roles still gate shell items');
assert.ok(admin.includes('id="nav_coverage"'), 'coverage desk is listed for Admin and Scheduler');
const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('id="tab_backups"'));
assert.ok(more.includes('id="nav_coverage"') && more.includes("showTab('coverage')"), 'coverage row is under More');

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

const ctx = {
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'sched',
  document: {
    getElementById: function(id){
      if(id === 'avatarMenuBtn')return ctx.btn;
      return null;
    },
    querySelectorAll: function(sel){
      assert.strictEqual(sel, '#adminScreen [data-layout-roles]');
      return ctx.els;
    }
  },
  btn: {textContent: '', setAttribute: function(k, v){this[k] = v;}},
  els: [
    item('nav_timesheets', 'Admin Scheduler'),
    item('nav_settings', 'Admin Scheduler'),
    item('nav_secret', 'Admin')
  ]
};
function item(id, roles){
  return {
    id: id,
    hidden: false,
    getAttribute: function(){return roles;},
    removeAttribute: function(){this.hidden = false;},
    setAttribute: function(name){if(name === 'hidden')this.hidden = true;}
  };
}
vm.createContext(ctx);
vm.runInContext(extractFn(html, 'function layoutA1Primary(tab)'), ctx);
vm.runInContext(extractFn(html, 'function layoutA1DraftOpen(r)'), ctx);
vm.runInContext(extractFn(html, 'function layoutA1ApplyRoles()'), ctx);
assert.strictEqual(vm.runInContext("layoutA1Primary('schedule')", ctx), 'schedule');
assert.strictEqual(vm.runInContext("layoutA1Primary('clients')", ctx), 'more');
assert.strictEqual(vm.runInContext("layoutA1Primary('settings')", ctx), 'more');
assert.strictEqual(vm.runInContext("layoutA1DraftOpen({status:'draft', notes:''})", ctx), true);
assert.strictEqual(vm.runInContext("layoutA1DraftOpen({status:'backup', notes:''})", ctx), false);
assert.strictEqual(vm.runInContext("layoutA1DraftOpen({status:'draft', notes:'Saved on file'})", ctx), false);
assert.strictEqual(vm.runInContext("layoutA1DraftOpen({status:'submitted', notes:''})", ctx), false);
vm.runInContext('layoutA1ApplyRoles()', ctx);
assert.strictEqual(ctx.els[0].hidden, false, 'Scheduler keeps Timesheets');
assert.strictEqual(ctx.els[1].hidden, false, 'Scheduler keeps Settings');
assert.strictEqual(ctx.els[2].hidden, true, 'Scheduler does not see an Admin-only item');
assert.strictEqual(ctx.btn.textContent, 'S');
ctx.currentAdminRole = 'Nurse';
ctx.els.forEach(function(el){el.hidden = false;});
vm.runInContext('layoutA1ApplyRoles()', ctx);
assert.ok(ctx.els.every(function(el){return el.hidden === true;}), 'Nurse does not get the Admin shell tabs');

console.log('admin-layout-a1-test: ok');
