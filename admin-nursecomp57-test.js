#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=nursecomp57'), 'nursecomp57 marker');
assert.ok(html.includes('admin-build 2026-09-25-nursecomp57'), 'nursecomp57 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-nursecomp57">'), 'nursecomp57 meta');
assert.ok(html.indexOf('content="2026-09-25-nursecomp57"') < html.indexOf('content="2026-09-25-layoutA1"'), 'nursecomp57 is the current build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-layoutA1">'), 'layoutA1 meta stays');
assert.ok(html.includes('v=layoutA1'), 'layoutA1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-loginkb1">'), 'loginkb1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'isclear1 meta stays');
assert.ok(html.includes('v=admintheme1') && html.includes('v=loginkb1') && html.includes('v=isclear1') && html.includes('v=sched1m'), 'prior markers stay');

const tip = 'Cadence tip:</strong> every 57–60 days = 2 in-home visits + 4 phone calls (client or family, call must be Reached). Flexible scheduling — no board.';
const subtitle = 'Rolling 57–60 day window — 2 in-home visits + 4 counting phone calls per client';
assert.ok(html.includes(tip), 'cadence tip is 57–60 days');
assert.ok(html.includes(subtitle), 'subtitle is a rolling 57–60 day window');
assert.ok(!html.includes('every 60 days'), 'flat every 60 days is gone from displayed copy');
assert.ok(!html.includes('Rolling 60-day window'), 'flat Rolling 60-day window is gone');
assert.ok(html.includes("per rolling 57–60 days."), 'empty-state cadence note matches the wording');

assert.ok(html.includes('daysInWindow:60'), 'client-side window length stays 60');
assert.ok(html.includes('Date.now()-60*24*60*60*1000'), 'raw window math stays 60 days');
assert.ok(html.includes("??60)||60"), 'days-left fallback stays 60');
assert.ok(html.includes("{action:'get_supervisory_compliance'}"), 'compliance still posts get_supervisory_compliance');

console.log('admin-nursecomp57-test: ok');
