#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  if(start < 0)return '';
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  return '';
}

const sigs = [
  'function schedTodayNy()',
  'function schedMondayOf(date)',
  'function schedIsoDate(d)',
  'function schedEnsureWeek()',
  'function payReadyNyYmd(date)',
  'function payReadyShiftYmd(y,m,d,delta)',
  'function payReadyMdy(iso)',
  'function payReadyWeekRange(now)',
  'function todayISO()'
];
const src = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

function at(iso){
  const Real = Date;
  const frozen = new Real(iso);
  function FakeDate(...args){
    if(args.length === 0)return new Real(frozen.getTime());
    return new Real(...args);
  }
  FakeDate.now = function(){return frozen.getTime();};
  FakeDate.parse = Real.parse;
  FakeDate.UTC = Real.UTC;
  FakeDate.prototype = Real.prototype;
  const sandbox = {Date: FakeDate, Intl: Intl, schedWeekStart: ''};
  vm.createContext(sandbox);
  vm.runInContext(src + '\nthis.schedEnsureWeek=schedEnsureWeek; this.payReadyWeekRange=payReadyWeekRange; this.todayISO=todayISO;', sandbox);
  return sandbox;
}

// 2026-10-07 23:30 America/New_York is 2026-10-08 03:30 UTC (EDT, UTC-4).
const wed = at('2026-10-08T03:30:00.000Z');
assert.strictEqual(wed.todayISO(), '2026-10-07', 'today stays Wednesday in New York after 8pm ET');
assert.strictEqual(wed.schedEnsureWeek(), '2026-10-05', 'Monday schedule week starts 10/05');
assert.strictEqual(wed.payReadyWeekRange().week_start, '2026-10-05', 'Monday pay week starts 10/05');
assert.strictEqual(wed.payReadyWeekRange().label.slice(0, 5), '10/05', 'pay week label starts 10/05');

// Saturday 2026-10-03 23:30 ET is already Sunday on a UTC clock. The week must not jump ahead.
const sat = at('2026-10-04T03:30:00.000Z');
assert.strictEqual(sat.todayISO(), '2026-10-03', 'today stays Saturday in New York');
assert.strictEqual(sat.schedEnsureWeek(), '2026-09-28', 'Monday schedule week stays 09/28');
assert.strictEqual(sat.payReadyWeekRange().week_start, '2026-09-28', 'Monday pay week stays 09/28');

console.log('admin-ny-week-test: ok');
