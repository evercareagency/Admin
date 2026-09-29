#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=msg-composer-kb2'), 'msg-composer-kb2 marker');
assert.ok(html.includes('?v=msg-composer-kb2'), 'cache bust query');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-kb2">'), 'admin-build meta');
assert.ok(html.includes("var MSG_COMPOSER_KB2_MARKER='v=msg-composer-kb2'"), 'script marker');
assert.ok(html.includes("var MSG_COMPOSER_KB2_BUILD='2026-09-29-msg-composer-kb2'"), 'script build');
assert.ok(html.includes('GHOST-MSG-COMPOSER-KB2-CONTRACT-v1'), 'contract');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth'), 'hard rules');
assert.ok(html.includes('data-msg-composer-kb2="v=msg-composer-kb2"'), 'composer carries the marker');

['v=login-land-schedule1','v=list-search-az1','v=pages-cache-fresh1','v=care-msg-safe1','v=loginkb1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-login-land-schedule1">'), 'login-land meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-list-search-az1">'), 'list-search meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-care-msg-safe1">'), 'care-msg meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-pages-cache-fresh1"') < html.indexOf('content="2026-09-29-msg-composer-kb2"'), 'kb2 meta follows pages-cache-fresh1');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/msg-composer-kb2-v1.sql')), 'no SQL patch');

assert.ok(html.includes('html.aidechat-kb #adminScreen #bottomNav,\nhtml.remi-ask-kb #adminScreen #bottomNav{display:none !important;bottom:auto !important;}'), 'tab bar stays display none while the keyboard class is on');
assert.ok(html.includes('--login-land-vv-lift:0px !important'), 'login-land lift cannot pad the page during keyboard mode');
assert.ok(html.includes('html.aidechat-kb #aidechatComposer{position:fixed'), 'only the composer is fixed');
assert.ok(html.includes('html.aidechat-kb #aidechatThreadView{position:static'), 'thread stays in normal flow');

const pinStart = html.indexOf('function careMsgSafe1PinAide()');
const pinEnd = html.indexOf('function careMsgSafe1FitComposer()');
const pinFn = html.slice(pinStart, pinEnd);
assert.ok(pinStart > 0 && pinFn.length > 40, 'pin helper stays');
assert.ok(!pinFn.includes('gap<80') && !pinFn.includes('gap>=80'), 'aide pin does not wait for a keyboard gap');
assert.ok(pinFn.includes("classList.add('aidechat-kb')"), 'focus adds aidechat-kb immediately');
assert.ok(pinFn.includes('loginLandSchedule1FitNav'), 'pin clears the login-land lift while the keyboard class is on');
assert.ok(pinFn.includes('loginKbFixedFollowsLayout'), 'composer uses the loginkb1 fixed-origin check');
assert.ok(pinFn.includes("form.style.position='fixed'"), 'composer is position fixed');
assert.ok(!pinFn.includes("thread.style.position='fixed'"), 'thread is not position fixed');
assert.ok(pinFn.includes("getElementById('msgDensePanel')") && pinFn.includes("getElementById('aidechatMessages')"), 'panel and message list shorten above the composer');
assert.ok(html.includes("(window.innerWidth||0)<=899"), 'desktop widths at 900px and up do not tuck');
assert.ok(html.includes('setTimeout(careMsgSafe1PinAide, 80)') && html.includes('setTimeout(careMsgSafe1PinAide, 320)'), 'pin re-runs at 80ms and 320ms');
assert.ok(html.includes("vv.addEventListener('resize', function(){careMsgSafe1PinAide();"), 'visualViewport resize re-pins');
assert.ok(html.includes("vv.addEventListener('scroll', function(){careMsgSafe1PinAide();"), 'visualViewport scroll re-pins');

const askFn = html.slice(html.indexOf('function copilotChatViewport()'), html.indexOf('function copilotChatBindViewport()'));
assert.ok(askFn.includes('gap>=80'), 'Remi Ask still waits for gap>=80');
assert.ok(askFn.includes("classList.add('remi-ask-kb')"), 'Remi Ask still sets remi-ask-kb');
assert.ok(askFn.includes('loginLandSchedule1FitNav'), 'Remi Ask keyboard mode also skips the login-land lift');

const leaveFn = html.slice(html.indexOf('function moreHide1Leave'), html.indexOf('function remiChatBleed1On'));
assert.ok(leaveFn.includes('careMsgSafe1ClearAidePin'), 'leaving Messages clears the pin');
assert.ok(leaveFn.includes('aidechatReply') && leaveFn.includes('.blur()'), 'leaving Messages blurs the reply');
const clearFn = html.slice(html.indexOf('function careMsgSafe1ClearAidePin()'), html.indexOf('function careMsgSafe1HoldDesk()'));
assert.ok(clearFn.includes("classList.remove('aidechat-kb')"), 'blur clears aidechat-kb');
assert.ok(clearFn.includes('loginLandSchedule1FitNav'), 'leaving keyboard mode lets the Schedule bar lift return');

const fitFn = html.slice(html.indexOf('function loginLandSchedule1FitNav()'), html.indexOf('function loginLandSchedule1BindNav()'));
assert.ok(fitFn.indexOf('loginLandSchedule1KbOn()') < fitFn.indexOf('loginLandSchedule1VvGap'), 'keyboard class is checked before the Safari lift is applied');
assert.ok(fitFn.includes('loginLandSchedule1ClearLift()'), 'keyboard mode clears the lift');

function ClassList(){this._ = {};}
ClassList.prototype.contains = function(name){return !!this._[name];};
ClassList.prototype.add = function(name){this._[name] = true;};
ClassList.prototype.remove = function(name){delete this._[name];};

const root = {
  style: {setProperty: function(k, v){this[k] = v;}},
  classList: new ClassList(),
  setAttribute: function(){}
};
const sandbox = {
  document: {
    documentElement: root,
    body: {classList: new ClassList()},
    getElementById: function(id){
      if(id === 'bottomNav')return sandbox.nav;
      return null;
    }
  },
  window: {
    innerHeight: 800,
    visualViewport: {height: 500, offsetTop: 0},
    addEventListener: function(){}
  },
  loginKbFixedFollowsLayout: function(){return true;},
  nav: {style: {bottom: '240px'}}
};
vm.createContext(sandbox);
const blockStart = html.indexOf('function loginLandSchedule1KbOn');
const blockEnd = html.indexOf('function loginLandSchedule1BindNav');
assert.ok(blockStart > 0 && blockEnd > blockStart, 'lift gate block');
vm.runInContext(html.slice(blockStart, blockEnd), sandbox);

assert.strictEqual(sandbox.loginLandSchedule1KbOn(), false, 'no keyboard class still lifts the bar');
assert.strictEqual(sandbox.loginLandSchedule1FitNav(), 300, 'open keyboard gap still lifts the bar when Messages is not focused');
assert.strictEqual(sandbox.document.documentElement.style['--login-land-vv-lift'], '300px');
assert.strictEqual(sandbox.nav.style.bottom, '300px');

sandbox.document.documentElement.classList.add('aidechat-kb');
sandbox.nav.style.bottom = '300px';
assert.strictEqual(sandbox.loginLandSchedule1FitNav(), 0, 'aidechat-kb clears the login-land lift');
assert.strictEqual(sandbox.document.documentElement.style['--login-land-vv-lift'], '0px');
assert.strictEqual(sandbox.nav.style.bottom, '', 'aidechat-kb clears the inline tab-bar bottom');

sandbox.document.documentElement.classList.remove('aidechat-kb');
sandbox.document.body.classList.add('remi-ask-kb');
sandbox.nav.style.bottom = '300px';
assert.strictEqual(sandbox.loginLandSchedule1KbOn(), true, 'remi-ask-kb counts as keyboard mode');
assert.strictEqual(sandbox.loginLandSchedule1FitNav(), 0, 'remi-ask-kb skips the login-land lift');
assert.strictEqual(sandbox.nav.style.bottom, '');

sandbox.document.body.classList.remove('remi-ask-kb');
assert.strictEqual(sandbox.loginLandSchedule1FitNav(), 300, 'the Schedule bar lift returns after keyboard mode');
assert.strictEqual(sandbox.nav.style.bottom, '300px');

console.log('admin-msg-composer-kb2-test: ok');
