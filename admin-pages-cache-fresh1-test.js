#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=pages-cache-fresh1'), 'pages-cache-fresh1 marker');
assert.ok(html.includes('?v=pages-cache-fresh1'), 'query marker stays in the contract for Probe');
assert.ok(html.includes('GHOST-PAGES-CACHE-FRESH1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'admin-build meta');
assert.ok(html.includes('<meta name="pages-cache-fresh1" content="2026-09-29-pages-cache-fresh1">'), 'pages build meta');
assert.ok(html.includes("var PAGES_CACHE_FRESH1_MARKER='v=pages-cache-fresh1'"), 'script marker');
assert.ok(html.includes("var PAGES_CACHE_FRESH1_BUILD='2026-09-29-pages-cache-fresh1'"), 'script build');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No push'), 'no push');
assert.ok(html.includes('https://evercareagency.github.io/Admin/'), 'clean Home Screen URL');
assert.ok(html.includes('without a sticky ?v='), 'clean URL does not need ?v=');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt is the embedded build');

assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-login-land-schedule1">'), 'login-land meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-list-search-az1">'), 'list-search meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-login-land-schedule1"') < html.indexOf('content="2026-09-29-list-search-az1"'), 'tip metas stay in order');
assert.ok(html.indexOf('content="2026-09-29-list-search-az1"') < html.indexOf('content="2026-09-29-pages-cache-fresh1"'), 'fresh meta follows the tip metas');

assert.ok(sw.includes('self.skipWaiting()'), 'skipWaiting');
assert.ok(sw.includes('self.clients.claim()'), 'clientsClaim');
assert.ok(sw.includes("cache:'no-store'"), 'document fetch is no-store');
assert.ok(sw.includes("addEventListener('notificationclick'"), 'ping tap is notificationclick');
assert.ok(!sw.includes('?v='), 'worker does not stick ?v=');
assert.ok(!sw.includes('caches.put') && !sw.includes('caches.open'), 'index is not stored in the Cache API');
assert.ok(sw.includes('pagesCacheFresh1IsNav'), 'navigation gate');
assert.ok(html.includes("updateViaCache:'none'"), 'worker script is not stuck in HTTP cache');
assert.ok(html.includes("cache:'no-store'"), 'build file is revalidated no-store');
assert.ok(html.includes('controllerchange'), 'controllerchange reloads once');
assert.ok(html.includes('admin-build.txt'), 'build file name');
assert.ok(!html.includes('location.search') || !html.slice(html.indexOf('function pagesCacheFresh1Start'), html.indexOf('try{pagesCacheFresh1Start()')).includes('?v='), 'start does not stick a ?v= on the URL');

const store = {};
const reloads = [];
const listeners = {};
const registered = [];
const fetches = [];
const sandbox = {
  PAGES_CACHE_FRESH1_BUILD: '2026-09-29-pages-cache-fresh1',
  sessionStorage: {
    getItem: function(k){ return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function(k, v){ store[k] = String(v); }
  },
  location: {
    pathname: '/Admin/index.html',
    reload: function(){ reloads.push('reload'); }
  },
  document: { documentElement: { setAttribute: function(k, v){ this[k] = v; } } },
  navigator: {
    serviceWorker: {
      controller: null,
      addEventListener: function(name, fn){ listeners[name] = fn; },
      register: function(url, opts){
        registered.push({url: url, opts: opts});
        return Promise.resolve({});
      }
    }
  },
  fetch: function(url, opts){
    fetches.push({url: url, opts: opts});
    return Promise.resolve({ok: true, text: function(){ return Promise.resolve(sandbox.remoteBuild); }});
  }
};
vm.createContext(sandbox);
const start = html.indexOf("var PAGES_CACHE_FRESH1_MARKER='v=pages-cache-fresh1'");
const end = html.indexOf('try{pagesCacheFresh1Start();}');
assert.ok(start > 0 && end > start, 'client block');
vm.runInContext(html.slice(start, end), sandbox);

assert.strictEqual(sandbox.pagesCacheFresh1Base('/Admin/'), '/Admin/');
assert.strictEqual(sandbox.pagesCacheFresh1Base('/Admin/index.html'), '/Admin/');
assert.strictEqual(sandbox.pagesCacheFresh1Base('/'), '/');
assert.strictEqual(sandbox.pagesCacheFresh1Base(''), '/');
assert.strictEqual(sandbox.pagesCacheFresh1Mismatch('2026-09-29-pages-cache-fresh1', '2026-09-29-pages-cache-fresh1\n'), false);
assert.strictEqual(sandbox.pagesCacheFresh1Mismatch('2026-09-29-pages-cache-fresh1', '2026-09-29-next'), true);
assert.strictEqual(sandbox.pagesCacheFresh1Mismatch('2026-09-29-pages-cache-fresh1', '  '), false);

sandbox.pagesCacheFresh1OnControllerChange.done = false;
assert.strictEqual(sandbox.pagesCacheFresh1OnControllerChange(), true, 'first controllerchange reloads');
assert.deepStrictEqual(reloads, ['reload']);
assert.strictEqual(sandbox.pagesCacheFresh1OnControllerChange(), false, 'second controllerchange does not loop');
assert.strictEqual(reloads.length, 1, 'one reload');
assert.strictEqual(sandbox.pagesCacheFresh1ReloadOnce(), false, 'session allows one reload');

store.pagesCacheFresh1Reloads = '0';
sandbox.pagesCacheFresh1OnBuild.swFailed = false;
sandbox.navigator.serviceWorker.controller = null;
assert.strictEqual(sandbox.pagesCacheFresh1OnBuild('2026-09-29-next'), false, 'wait for the worker before burning the reload');
sandbox.navigator.serviceWorker.controller = {};
assert.strictEqual(sandbox.pagesCacheFresh1OnBuild('2026-09-29-next'), true, 'controlled page reloads on a new build');
assert.strictEqual(reloads.length, 2);
assert.strictEqual(sandbox.pagesCacheFresh1OnBuild('2026-09-29-later'), false, 'mismatch does not reload twice');

store.pagesCacheFresh1Reloads = '0';
sandbox.navigator.serviceWorker = null;
assert.strictEqual(sandbox.pagesCacheFresh1OnBuild('2026-09-29-pages-cache-fresh1'), false, 'matching build stays');
assert.strictEqual(sandbox.pagesCacheFresh1OnBuild('2026-09-29-other'), true, 'no worker still reloads once on mismatch');

const swStart = sw.indexOf('function pagesCacheFresh1IsNav');
const swEnd = sw.indexOf("self.addEventListener('fetch'");
const swSandbox = {};
vm.createContext(swSandbox);
vm.runInContext(sw.slice(swStart, swEnd), swSandbox);
assert.strictEqual(swSandbox.pagesCacheFresh1IsNav({method: 'GET', mode: 'navigate', url: 'https://evercareagency.github.io/Admin/'}), true);
assert.strictEqual(swSandbox.pagesCacheFresh1IsNav({method: 'GET', destination: 'document', url: 'https://evercareagency.github.io/Admin/index.html'}), true);
assert.strictEqual(swSandbox.pagesCacheFresh1IsNav({method: 'GET', destination: 'script', url: 'https://evercareagency.github.io/Admin/sw.js'}), false);
assert.strictEqual(swSandbox.pagesCacheFresh1IsNav({method: 'POST', mode: 'navigate', url: 'https://evercareagency.github.io/Admin/'}), false);

sandbox.navigator = {
  serviceWorker: {
    controller: null,
    addEventListener: function(name, fn){ listeners[name] = fn; },
    register: function(url, opts){
      registered.push({url: url, opts: opts});
      return {catch: function(){ return this; }};
    }
  }
};
sandbox.remoteBuild = '2026-09-29-pages-cache-fresh1';
sandbox.location.pathname = '/Admin/';
store.pagesCacheFresh1Reloads = '0';
reloads.length = 0;
registered.length = 0;
fetches.length = 0;
sandbox.pagesCacheFresh1Start();
assert.strictEqual(registered[0].url, '/Admin/sw.js');
assert.strictEqual(registered[0].opts.scope, '/Admin/');
assert.strictEqual(registered[0].opts.updateViaCache, 'none');
assert.strictEqual(typeof listeners.controllerchange, 'function');
assert.strictEqual(fetches[0].url, '/Admin/admin-build.txt');
assert.strictEqual(fetches[0].opts.cache, 'no-store');
assert.strictEqual(sandbox.document.documentElement['data-pages-cache-fresh1'], 'v=pages-cache-fresh1');

console.log('admin-pages-cache-fresh1-test ok');
