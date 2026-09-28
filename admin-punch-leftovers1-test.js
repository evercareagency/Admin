#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=punch-leftovers1'), 'punch-leftovers1 marker');
assert.ok(html.includes('?v=punch-leftovers1'), 'query marker');
assert.ok(html.includes('data-punch-leftovers1="v=punch-leftovers1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-28-punch-leftovers1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-punch-leftovers1">'), 'meta');
assert.ok(html.includes('<!-- punch leftovers 2026-09-28 v=punch-leftovers1 ?v=punch-leftovers1 admin-build 2026-09-28-punch-leftovers1'), 'comment');
assert.ok(html.includes("var PUNCH_LEFTOVERS1_MARKER='v=punch-leftovers1'"), 'script marker');
assert.ok(html.includes("var PUNCH_LEFTOVERS1_BUILD='2026-09-28-punch-leftovers1'"), 'script build');
assert.ok(html.includes('GHOST-PUNCH-LEFTOVERS1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-28-punch-leftovers1"'), 'punch meta follows hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after hide1b');

['v=remi-payroll-ins1', 'v=remi-float-hide1b', 'v=layoutA1', 'v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const cssAt = html.indexOf('/* v=punch-leftovers1 — phone offset.');
assert.ok(cssAt > 0, 'offset comment');
const css = html.slice(cssAt, cssAt + 900);
assert.ok(css.includes('@media(max-width:430px)'), 'phone max 430');
assert.ok(css.includes('#adminScreen .page-hdr'), 'desk titles');
assert.ok(css.includes('position:sticky'), 'titles stick under the bar');
assert.ok(css.includes('top:68px'), '12px under the 56px header');
assert.ok(css.includes('scroll-margin-top:68px'), 'scroll offset');
assert.ok(html.includes('#adminScreen .shell-top{position:sticky;top:0;'), 'header stays the sticky teal bar');
assert.ok(!css.includes('schedSlotDetail'), 'schedule day drawer is not in this offset');
assert.ok(!css.includes('schedSlotModeEdit'), 'schedule edit control is not in this offset');
assert.ok(html.includes('week calendar only'), 'cold load is the week calendar');
assert.ok(!html.includes('Schedule QaHold sticky Day/Edit on cold load is not touched'), 'cold load is in scope');
assert.ok(html.includes('var schedSlotDrawerClosed=true'), 'day drawer starts closed');
assert.ok(html.includes('function schedClearEntrySelection()'), 'entry clears a sticky day');
assert.ok(html.includes('if(!schedKeepDayOnLoad&&!schedPendingDeepLink)schedClearEntrySelection()'), 'schedule entry clears unless a deep link or week move asked to keep the day');

const ensureAt = html.indexOf('function schedEnsureSlotSelection()');
const ensure = html.slice(ensureAt, html.indexOf('function schedChipHtml', ensureAt));
assert.ok(ensureAt > 0 && ensure.length < 800, 'selection helper stays small');
assert.ok(!ensure.includes("fallback.days['1']"), 'does not invent Monday of the first client');
assert.ok(!ensure.includes('schedSlotSelected={'), 'does not invent a client or day');
assert.ok(ensure.includes('schedSlotSelected=null'), 'an invalid leftover selection is dropped');

console.log('admin-punch-leftovers1 unit ok');
