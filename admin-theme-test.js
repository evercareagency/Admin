#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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

assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta');
assert.ok(html.includes('<!-- admin theme 2026-09-25 v=admintheme1 admin-build 2026-09-25-admintheme1'), 'admintheme1 comment');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 probe');
assert.ok(html.includes('v=sched1m'), 'sched1m marker stays');
assert.ok(html.includes('interactive-widget=resizes-content'), 'android keyboard resizes the layout viewport');
assert.ok(html.includes('#loginScreen.login-kb-open{'), 'keyboard scrollport class');
assert.ok(html.includes('overflow-y:auto'), 'login keyboard scrollport');
assert.ok(html.includes('id="loginForgot"'), 'forgot password control');
assert.ok(html.includes('id="mgrLoginBtn"'), 'sign in button stays');
assert.ok(html.includes('id="mgr_pass"'), 'password field stays');
assert.ok(html.includes('id="mgr_role"'), 'role pick stays');
assert.ok(html.includes('id="loginForm"'), 'login form scopes the keyboard path');
assert.ok(html.includes('class="side-nav"'), 'left nav wrapper');
assert.ok(html.includes('onclick="mgrLogin()"'), 'sign in still calls mgrLogin');
assert.ok(html.includes('onclick="showAdminReset()"'), 'forgot still opens the reset modal');

const kb = html.slice(html.indexOf('function loginKbIsPhone'), html.indexOf('function bindLoginKeyboard'));
assert.ok(!kb.includes('window.scrollTo'), 'keyboard path does not use window.scrollTo');
assert.ok(kb.includes('visualViewport'), 'keyboard path reads visualViewport');
assert.ok(kb.includes('screen.scrollTop'), 'keyboard path scrolls the login screen');
assert.ok(kb.includes('loginScreen'), 'keyboard path pins the admin login screen');
assert.ok(kb.includes('mgrLoginBtn'), 'keyboard path keeps Sign In in view');
assert.ok(!kb.includes('localStorage'), 'keyboard path does not remember a username');
assert.ok(!kb.includes('mgrLogin('), 'keyboard path does not sign in');

const login = extractFn(html, 'async function mgrLogin()');
assert.ok(login.includes('evercareSbEnabled()'), 'soft path gate stays on mgrLogin');
assert.ok(login.includes("action:'admin_login'"), 'sheets login stays on the rollback');
assert.ok(!login.includes('visualViewport') && !login.includes('loginKb'), 'mgrLogin is not the keyboard handler');

const reset = extractFn(html, 'async function doAdminReset()');
assert.ok(reset.includes('sbAdminSetRolePasswordAnon'), 'reset still uses the anon role password call');
assert.ok(reset.includes("action:'admin_forgot_password'"), 'sheets reset stays on the rollback');
assert.ok(!reset.includes('loginKb'), 'reset is not the keyboard handler');

const api = new Function(
  extractFn(html, 'function loginKbIsPhone(width)') + '\n' +
  extractFn(html, 'function loginKbCovered(layoutH,vvTop,vvHeight,baseline)') + '\n' +
  extractFn(html, 'function loginKbScrollDelta(viewH,inputTop,inputBottom,btnBottom,margin)') + '\n' +
  'return {loginKbIsPhone, loginKbCovered, loginKbScrollDelta};'
)();

assert.strictEqual(api.loginKbIsPhone(390), true, 'phone portrait');
assert.strictEqual(api.loginKbIsPhone(932), true, 'phone landscape width');
assert.strictEqual(api.loginKbIsPhone(1280), false, 'desktop width stays off this path');
assert.strictEqual(api.loginKbIsPhone(0), false, 'unknown width stays off');

assert.strictEqual(api.loginKbCovered(844, 0, 844, 844), false, 'no keyboard');
assert.strictEqual(api.loginKbCovered(844, 0, 829, 844), false, 'scrollbar is not a keyboard');
assert.strictEqual(api.loginKbCovered(844, 0, 380, 844), true, 'iOS visual viewport shrinks under the keyboard');
assert.strictEqual(api.loginKbCovered(390, 0, 390, 844), true, 'Android layout shrinks under the keyboard');
assert.strictEqual(api.loginKbCovered(844, 120, 380, 844), true, 'iOS visual viewport offset still counts as covered');

assert.strictEqual(api.loginKbScrollDelta(340, 80, 128, 190, 12), 0, 'field and Sign In already above the keyboard');

const parked = api.loginKbScrollDelta(340, 400, 448, 520, 12);
assert.ok(parked > 0, 'covered Sign In scrolls up');
assert.ok(400 - parked >= 12, 'focused field stays below the top');
assert.ok(Math.abs((520 - parked) - (340 - 12)) < 1, 'Sign In sits on the bottom margin');

const lifted = api.loginKbScrollDelta(340, -30, 18, 90, 12);
assert.ok(lifted < 0, 'a field above the visual viewport scrolls back');
assert.ok(-30 - lifted >= 12, 'field top clears the margin after that scroll');

console.log('admin-theme-test: ok');
