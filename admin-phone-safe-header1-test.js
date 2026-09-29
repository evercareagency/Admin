#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('v=phone-safe-header1'), 'marker');
assert.ok(html.includes('?v=phone-safe-header1'), 'query marker');
assert.ok(html.includes('GHOST-PHONE-SAFE-HEADER1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('admin-build 2026-09-29-phone-safe-header1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-phone-safe-header1">'), 'meta');
assert.ok(html.includes("var PHONE_SAFE_HEADER1_MARKER='v=phone-safe-header1'"), 'script marker');
assert.ok(html.includes("var PHONE_SAFE_HEADER1_BUILD='2026-09-29-phone-safe-header1'"), 'script build');
assert.ok(html.includes('data-phone-safe-header1="v=phone-safe-header1"'), 'data attr on shell');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('viewport-fit=cover'), 'viewport-fit stays');
assert.ok(html.includes('interactive-widget=resizes-content'), 'interactive-widget stays');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');

const shellAt = html.indexOf('#adminScreen .shell-top{position:sticky;top:0;');
assert.ok(shellAt > 0, 'shell-top rule');
const shell = html.slice(shellAt, html.indexOf('}', shellAt) + 1);
assert.ok(shell.includes('safe-area-inset-top'), 'shell-top CSS includes safe-area-inset-top');
assert.ok(shell.includes('padding-top:max(8px, env(safe-area-inset-top, 0px))'), 'padding-top clears the inset');
assert.ok(shell.includes('padding:8px 12px'), 'left right bottom padding stays');
assert.ok(shell.includes('min-height:calc(56px + env(safe-area-inset-top, 0px))'), 'min-height grows with the inset');
assert.ok(shell.includes('top:0'), 'sticky top stays 0 so teal paints under the status bar');

const hdrAt = html.indexOf('/* v=punch-leftovers1 — phone offset.');
const hdr = html.slice(hdrAt, hdrAt + 900);
assert.ok(hdr.includes('top:calc(68px + env(safe-area-inset-top, 0px))'), 'desk titles follow the taller bar');
assert.ok(hdr.includes('scroll-margin-top:calc(68px + env(safe-area-inset-top, 0px))'), 'scroll margin follows the taller bar');

assert.ok(html.includes('top:calc(env(safe-area-inset-top, 0px) + 72px)'), 'Remi CSS fallback is not double-counted');
assert.ok(html.includes('function remiNotesClarity1SheetTop()'), 'measured shell bottom still positions Remi');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/phone-safe-header1-v1.sql')), 'no SQL patch');

console.log('admin-phone-safe-header1 unit ok');
