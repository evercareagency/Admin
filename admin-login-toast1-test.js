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
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=login-toast1'), 'login-toast1 marker');
assert.ok(html.includes('data-login-toast1="v=login-toast1"'), 'login screen marker');
assert.ok(html.includes('admin-build 2026-09-27-login-toast1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-login-toast1">'), 'admin-build meta');
assert.ok(html.includes('<!-- login toast 2026-09-27 v=login-toast1 admin-build 2026-09-27-login-toast1'), 'comment');
assert.ok(html.includes("var LOGIN_TOAST1_MARKER='v=login-toast1'"), 'script marker');
assert.ok(html.includes('GHOST-LOGIN-TOAST1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE patch none'), 'callable patch none');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
assert.ok(html.includes('No SQL'), 'no SQL');
assert.ok(html.includes('No Auth reseal') && html.includes('No Quo/SMS'), 'hard rules');
assert.ok(html.includes('Session expired \\u2014 sign in again') || html.includes('Session expired — sign in again'), 'session-expired copy');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-compliance-bulk1'), 'first admin-build is msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-hold-autosave1"') < html.indexOf('content="2026-09-27-msg-dense1"'), '2026-09-27-msg-dense1 stays after hold-autosave1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-remi-langs1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after remi-langs1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
['v=aide-office-vis1','v=remi-langs1','v=hold-clear1','v=sched-time-tap1','v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','v=bcast1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const mgrLogin = extractFn(html, 'async function mgrLogin()');
assert.ok(mgrLogin.includes("'Incorrect password.'"), 'wrong password stays on the form');
assert.ok(mgrLogin.includes("errEl.style.display='block'"), 'form error still shows');
assert.ok(!mgrLogin.includes('loginToast1') && !mgrLogin.includes('Not signed in'), 'sign-in submit does not use the session toast');
assert.ok(mgrLogin.includes('sbAuthRoleLogin'), 'sign-in RPC path unchanged');
assert.ok(!/CREATE TABLE|ALTER TABLE|password rotate|mossier/i.test(extractFn(html, 'function loginToast1OnJwtFail()') + extractFn(html, 'function adminLogout()')), 'no SQL and no auth reseal in this tip');

function classList(on){
  const set = {};
  if(on)set.active = true;
  return {
    add: function(c){set[c] = true;},
    remove: function(c){delete set[c];},
    contains: function(c){return !!set[c];}
  };
}

function harness(){
  const mem = {};
  const screens = {
    loginScreen: {classList: classList(true), id: 'loginScreen'},
    adminScreen: {classList: classList(false), id: 'adminScreen'},
    nurseScreen: {classList: classList(false), id: 'nurseScreen'}
  };
  const toastStyle = {display: 'none', _css: ''};
  Object.defineProperty(toastStyle, 'cssText', {
    get: function(){return this._css;},
    set: function(v){
      this._css = String(v);
      const m = String(v).match(/(?:^|;)\s*display:\s*([^;]+)/);
      if(m)this.display = m[1].trim();
    }
  });
  const toast = {
    id: 'nciToast',
    textContent: '',
    style: toastStyle,
    parentNode: null,
    setAttribute: function(){}
  };
  const rpc = [];
  const loc = {
    search: '',
    href: 'https://evercareagency.github.io/Admin/index.html',
    pathname: '/Admin/index.html',
    hash: ''
  };
  const box = {
    screens: screens,
    toast: toast,
    rpc: rpc,
    mem: mem,
    location: loc,
    history: {
      replaceState: function(_s, _t, next){
        loc.href = 'https://evercareagency.github.io' + next;
        const q = String(next).split('?')[1] || '';
        loc.search = q ? ('?' + q.split('#')[0]) : '';
        loc.hash = String(next).indexOf('#') >= 0 ? ('#' + String(next).split('#')[1]) : '';
      }
    },
    sessionStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    document: {
      getElementById: function(id){
        if(id === 'nciToast')return toast;
        if(id === 'broadcastPreview')return box.preview;
        return screens[id] || null;
      },
      createElement: function(){return toast;},
      body: {appendChild: function(n){n.parentNode = this;}}
    },
    preview: {innerHTML: ''},
    evercareSbEnabled: function(){return true;},
    readSbSession: function(){return box.session || null;},
    session: null,
    sbRestRpc: async function(name, body){
      rpc.push({name: name, body: body});
      return box.nextRpc || {ok: false, error: 'Not signed in', status: 401};
    },
    nextRpc: null,
    showScreen: function(id){
      Object.keys(screens).forEach(function(k){screens[k].classList.remove('active');});
      if(screens[id])screens[id].classList.add('active');
    },
    logActivity: function(){},
    sbSignOut: function(){},
    sbInvalidateListCaches: function(){},
    clearSbSession: function(){box.session = null;},
    clearAdminSession: function(){},
    setNurseAlertBadge: function(){},
    currentAdminRole: 'Admin',
    URL: URL,
    setTimeout: function(){return 1;},
    clearTimeout: function(){}
  };
  const src = [
    "var LOGIN_TOAST1_MARKER='v=login-toast1';",
    "var LOGIN_TOAST1_KEY='evercare_login_toast_reason';",
    "var LOGIN_TOAST1_COPY='Session expired \\u2014 sign in again';",
    extractFn(html, 'function loginToast1ScreenActive(id)'),
    extractFn(html, 'function loginToast1IsSessionCopy(text)'),
    extractFn(html, 'function loginToast1ShouldSuppress(msg)'),
    extractFn(html, 'function loginToast1Arm(reason)'),
    extractFn(html, 'function loginToast1Clear()'),
    extractFn(html, 'function loginToast1Take()'),
    extractFn(html, 'function loginToast1Hide()'),
    extractFn(html, 'function loginToast1Show()'),
    extractFn(html, 'function loginToast1MaybeShow()'),
    extractFn(html, 'function loginToast1ResetGuards()'),
    extractFn(html, 'function loginToast1Quiet()'),
    extractFn(html, 'function loginToast1OnJwtFail()'),
    extractFn(html, 'function adminLogout()'),
    extractFn(html, 'function showTempMsg(msg,color,holdMs)'),
    extractFn(html, 'function bcastPaintPreview(msg)'),
    extractFn(html, 'function bcastActiveFromRpc(got)'),
    extractFn(html, 'function renderBroadcastPreviewLocal()'),
    extractFn(html, 'async function loadActiveBroadcast()')
  ].join('\n');
  vm.createContext(box);
  vm.runInContext(src, box);
  return box;
}

(async function(){
  const copy = 'Session expired — sign in again';

  // Cold Sign In: no session, no reason → broadcast load does not toast and does not RPC.
  {
    const box = harness();
    await box.loadActiveBroadcast();
    assert.strictEqual(box.rpc.length, 0, 'cold login does not call get_active_broadcast');
    assert.strictEqual(box.toast.textContent, '', 'cold login has no toast text');
    assert.strictEqual(box.toast.style.display, 'none', 'cold login toast stays hidden');
    box.loginToast1MaybeShow();
    assert.strictEqual(box.toast.textContent, '', 'mere !session at login mount does not toast');
  }

  // Mere "Not signed in" while already on Sign In is swallowed. Other toasts still paint.
  {
    const box = harness();
    box.showTempMsg('Not signed in', 'var(--danger)');
    assert.strictEqual(box.toast.textContent, '', 'Not signed in is hidden on the login landing');
    box.showTempMsg('Not signed in.', 'var(--danger)');
    assert.strictEqual(box.toast.textContent, '', 'Not signed in. is hidden on the login landing');
    box.showTempMsg('Saved.', 'var(--success)');
    assert.strictEqual(box.toast.textContent, 'Saved.', 'non-session toasts still show');
  }

  // Intentional logout → Sign In with no session toast.
  {
    const box = harness();
    box.showScreen('adminScreen');
    box.session = {access_token: 'office'};
    box.adminLogout();
    assert.ok(box.screens.loginScreen.classList.contains('active'), 'logout returns to Sign In');
    assert.ok(!box.screens.adminScreen.classList.contains('active'), 'logout leaves the desk');
    assert.strictEqual(box.toast.textContent, '', 'intentional logout does not toast');
    assert.strictEqual(box.session, null, 'logout clears the office session');
    await box.loadActiveBroadcast();
    assert.strictEqual(box.rpc.length, 0, 'login after logout does not refetch broadcast');
    assert.strictEqual(box.toast.textContent, '', 'login after logout stays quiet');
  }

  // Mid-app session drop: one toast, then another null auth event on Sign In does not toast again.
  {
    const box = harness();
    box.showScreen('adminScreen');
    box.adminLogout('session');
    assert.ok(box.screens.loginScreen.classList.contains('active'), 'session drop lands on Sign In');
    assert.strictEqual(box.toast.textContent, copy, 'session drop uses the clearer copy');
    assert.strictEqual(box.toast.style.display, 'block', 'session drop toast is visible');
    assert.ok(String(box.toast.style.cssText).indexOf('var(--danger)') >= 0, 'session drop toast is red');
    box.showTempMsg('Not signed in', 'var(--danger)');
    assert.strictEqual(box.toast.textContent, copy, 'a later Not signed in does not replace the one-shot toast');
    box.loginToast1OnJwtFail();
    assert.strictEqual(box.toast.textContent, copy, 'null auth while already on Sign In does not toast again');
    const before = box.toast.textContent;
    box.adminLogout('session');
    assert.strictEqual(box.toast.textContent, before, 'second drop in the same landing does not stack a toast');
  }

  // ?reason=session is a one-shot flash. Refresh without the flag stays quiet.
  {
    const box = harness();
    box.location.search = '?reason=session';
    box.location.href = 'https://evercareagency.github.io/Admin/index.html?reason=session';
    box.loginToast1MaybeShow();
    assert.strictEqual(box.toast.textContent, copy, 'query reason shows the toast once');
    assert.ok(!/[?&]reason=session(?:&|$)/.test(box.location.search), 'reason query is consumed');
    box.toast.textContent = '';
    box.toast.style.display = 'none';
    box.loginToast1ResetGuards();
    box.loginToast1MaybeShow();
    assert.strictEqual(box.toast.textContent, '', 'consumed reason does not toast on the next mount');
  }

  // sessionStorage flash is one-shot and does not survive a second login mount.
  {
    const box = harness();
    box.sessionStorage.setItem('evercare_login_toast_reason', 'session');
    box.loginToast1MaybeShow();
    assert.strictEqual(box.toast.textContent, copy, 'storage flash shows the toast once');
    assert.strictEqual(box.sessionStorage.getItem('evercare_login_toast_reason'), null, 'storage flash is consumed');
    box.toast.textContent = '';
    box.toast.style.display = 'none';
    box.loginToast1ResetGuards();
    box.loginToast1MaybeShow();
    assert.strictEqual(box.toast.textContent, '', 'empty flash does not toast');
  }

  // JWT fail while the desk is open redirects once. A repeat while already on Sign In does not.
  {
    const box = harness();
    box.showScreen('adminScreen');
    box.loginToast1OnJwtFail();
    assert.ok(box.screens.loginScreen.classList.contains('active'), 'jwt fail leaves the desk');
    assert.strictEqual(box.toast.textContent, copy, 'jwt fail toasts once');
    box.loginToast1OnJwtFail();
    assert.strictEqual(box.toast.textContent, copy, 'repeat jwt fail on Sign In stays one toast');
  }

  // Signed-in broadcast load still calls Ace. A real office error still toasts.
  {
    const box = harness();
    box.showScreen('adminScreen');
    box.session = {access_token: 'office'};
    box.nextRpc = {ok: true, data: {ok: true, success: true, data: {message: 'Storm delay'}}};
    await box.loadActiveBroadcast();
    assert.strictEqual(box.rpc.length, 1, 'signed-in preview still loads the broadcast');
    assert.strictEqual(box.rpc[0].name, 'get_active_broadcast');
    assert.ok(box.preview.innerHTML.indexOf('Storm delay') >= 0, 'preview still paints the message');
    box.rpc.length = 0;
    box.nextRpc = {ok: false, error: 'office only'};
    await box.loadActiveBroadcast();
    assert.strictEqual(box.toast.textContent, 'office only', 'in-app broadcast errors still toast');
  }

  // Missing office token while the desk is open is a session drop, not a cold Not signed in toast.
  {
    const box = harness();
    box.showScreen('adminScreen');
    box.session = null;
    await box.loadActiveBroadcast();
    assert.strictEqual(box.rpc.length, 0, 'missing token does not call the broadcast RPC');
    assert.ok(box.screens.loginScreen.classList.contains('active'), 'missing token on the desk returns to Sign In');
    assert.strictEqual(box.toast.textContent, copy, 'missing token on the desk uses the session copy');
  }

  console.log('admin-login-toast1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
