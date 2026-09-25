#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta');
assert.ok(html.indexOf('content="2026-09-25-admintheme1"') < html.indexOf('content="2026-09-25-loginkb1"'), 'admintheme1 is the current build meta');
assert.ok(html.includes('<!-- admin theme 2026-09-25 v=admintheme1 admin-build 2026-09-25-admintheme1'), 'admintheme1 comment');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 probe');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-loginkb1">'), 'loginkb1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'isclear1 meta stays');
assert.ok(html.includes('v=loginkb1') && html.includes('v=isclear1') && html.includes('v=cgreset1') && html.includes('v=sched1m'), 'prior markers stay');
assert.ok(html.includes('id="mgrForgotBtn"'), 'forgot control stays for loginkb1');
assert.ok(html.includes('id="mgrLoginBtn"') && html.includes('onclick="mgrLogin()"'), 'sign in still calls mgrLogin');
assert.ok(html.includes('function loginKbClear()') && html.includes('function bindLoginKeyboard()'), 'loginkb1 keyboard script stays');
assert.ok(html.includes('class="bottom-nav"'), 'layoutA1 bottom nav keeps the teal shell');
assert.ok(html.includes('.sidebar-logo{padding:16px 16px 14px;background:var(--teal);'), 'teal nav header');
assert.ok(html.includes('.stat-card{background:white;border:1px solid var(--border);border-top:4px solid var(--teal);'), 'home stat cards');

console.log('admin-theme-test: ok');
