#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=pwa-install-copy1'), 'pwa-install-copy1 marker');
assert.ok(html.includes('?v=pwa-install-copy1'), 'cache bust query');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pwa-install-copy1">'), 'admin-build meta');
assert.ok(html.includes("var PWA_INSTALL_COPY1_MARKER='v=pwa-install-copy1'"), 'script marker');
assert.ok(html.includes("var PWA_INSTALL_COPY1_BUILD='2026-09-29-pwa-install-copy1'"), 'script build');
assert.ok(html.includes('GHOST-PWA-INSTALL-COPY1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('data-pwa-install-copy1="v=pwa-install-copy1"'), 'modal carries the marker');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/pwa-install-copy1-v1.sql')), 'no SQL patch');

['v=msg-composer-kb4', 'v=client-msg-delete1', 'v=aide-thread-header1', 'v=msg-composer-kb3', 'v=pages-cache-fresh1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('without a sticky ?v='), 'Home Screen URL is not rewritten to a sticky ?v=');

const modalStart = html.indexOf('id="iosInstallModal"');
const modalEnd = html.indexOf('<!-- ADMIN -->', modalStart);
assert.ok(modalStart > 0 && modalEnd > modalStart, 'ios install modal');
const modal = html.slice(modalStart, modalEnd);
const items = modal.match(/<li[\s\S]*?<\/li>/g) || [];
assert.strictEqual(items.length, 4, 'four iPhone steps');
assert.ok(items[0].includes('Tap Share'), 'step 1 Share');
assert.ok(items[0].includes('square with an arrow pointing up'), 'step 1 square with arrow up');
assert.ok(items[0].includes('bottom of Safari'), 'step 1 usually bottom of Safari');
assert.ok(items[1].includes('View More'), 'step 2 names View More');
assert.ok(items[1].includes('isn\u2019t visible yet'), 'step 2 if Add to Home Screen is not visible yet');
assert.ok(!items[1].includes('scroll the list'), 'scroll the list is not the only second step');
assert.ok(items[2].includes('Add to Home Screen'), 'step 3 Add to Home Screen');
assert.ok(!items[2].includes('scroll the list'), 'step 3 is not the scroll hint');
assert.ok(items[3].includes('Tap \u201cAdd\u201d'), 'step 4 Add');
assert.ok(items[3].includes('top right'), 'step 4 top right');
assert.ok(items[3].includes('EverCare appears on your home screen'), 'step 4 done');
assert.ok(!modal.includes('scroll the list if you don\u2019t see it'), 'old scroll-only hint is gone');
assert.ok(modal.includes('Using Android Chrome?'), 'Android footnote stays');
assert.ok(modal.includes('Install app'), 'Android Install app stays');
assert.ok(modal.includes('Got it \u2713'), 'Got it stays');

assert.ok(html.includes('el.textContent=ready?\'\ud83d\udcf2 Tap Install\':\'\ud83d\udcf1 Add to Home Screen\''), 'install CTA labels stay');
assert.ok(html.includes('>Install</button>'), 'banner Install label stays');
assert.ok(html.includes('class="ec-install-cta-label" style="font-size:1.05rem">\ud83d\udcf1 Add to Home Screen</span>'), 'login CTA label stays');

console.log('admin-pwa-install-copy1-test: ok');
