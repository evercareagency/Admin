#!/usr/bin/env node
'use strict';

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

assert.ok(html.includes('v=c2rib7212'), 'Pages cache-bust comment for C2 cert');
assert.ok(html.includes('admin-build" content="2026-09-21-cert-c2-ribbon-laurel"'), 'admin-build meta for hard-refresh');
assert.ok(html.includes('function formatCertDate('), 'formatCertDate required');
assert.ok(html.includes('function certDateFromRecord('), 'certDateFromRecord required');
assert.ok(html.includes('function buildCertHtml('), 'buildCertHtml required');
assert.ok(html.includes('function printCert('), 'printCert required');
assert.ok(html.includes('function renderAdminCertSample('), 'certSample renderer required');
assert.ok(html.includes('certSample=1'), 'certSample query hook');
assert.ok(html.includes('data-cert-style="c2-ribbon-laurel"'), 'C2 style marker');
assert.ok(html.includes('EVERCARE HOME AGENCY'), 'agency lockup');
assert.ok(html.includes('Certificate of Inservice Completion'), 'title');
assert.ok(html.includes('Personal Care / Home Making'), 'C2 ribbon text');
assert.ok(html.includes('data-cert-track="personal-care-home-making"'), 'aide track is personal care / home making');
assert.ok(!/Skilled Nursing|Therapy track/i.test(html.slice(html.indexOf('function certRibbonHtml'), html.indexOf('function printCert'))), 'cert is not a skilled nursing track');
assert.ok(html.includes('background:#FDFBF0'), 'cream paper, not a dark signature band');
assert.ok(html.includes('This certifies that'), 'body lead-in');
assert.ok(html.includes('has successfully completed'), 'body completion line');
assert.ok(html.includes('Employee Signature'), 'employee sig line');
assert.ok(html.includes('RN / Supervisor Signature'), 'RN/supervisor sig line');
assert.ok(html.includes('← Back'), 'Back button');
assert.ok(html.includes('✕ Close'), 'Close button');
assert.ok(html.includes('Print Certificate'), 'Print Certificate button');
assert.ok(/class="cbtn cbtn-ghost no-print"/.test(html), 'Back/Close are .no-print');
assert.ok(/class="cbtn cbtn-print no-print"/.test(html), 'Print Certificate is .no-print');
assert.ok(html.includes('@page{size:letter portrait;margin:0.22in;}'), 'US Letter print page');
assert.ok(html.includes('@media print{'), 'print stylesheet');
assert.ok(/\.no-print,\.cert-toolbar\{display:none !important;\}/.test(html), 'print hides chrome');
assert.ok(html.includes('certLaurelSvg'), 'laurel seal helper');
assert.ok(html.includes('certRibbonHtml'), 'ribbon helper');
assert.ok(!/graduation|mortar\s*board|cap-icon/i.test(html.slice(html.indexOf('function certLaurelSvg'), html.indexOf('function printCert'))), 'seal must not use a graduation cap');
const certFnSrc = html.slice(html.indexOf('function formatCertDate'), html.indexOf('function printCert(r)') + 800);
assert.ok(!certFnSrc.includes('5510 Pearl'), 'no street address on cert (or leftover footer)');
assert.ok(!certFnSrc.includes('(216) 377-5991'), 'no agency phone on cert');
assert.ok(!/class="footer">5510/.test(certFnSrc), 'old address footer class removed');

const formatCertDate = extractFn(html, 'function formatCertDate(val)');
const certDateFromRecord = extractFn(html, 'function certDateFromRecord(r)');
const buildCertHtml = extractFn(html, 'function buildCertHtml(r)');
const escapeHtml = extractFn(html, 'function escapeHtml(str)');
assert.ok(formatCertDate, 'extract formatCertDate');
assert.ok(certDateFromRecord, 'extract certDateFromRecord');
assert.ok(buildCertHtml, 'extract buildCertHtml');
assert.ok(escapeHtml, 'extract escapeHtml');

const sandbox = { INSERVICES: [] };
vm.createContext(sandbox);
vm.runInContext(escapeHtml + '\n' + formatCertDate + '\n' + certDateFromRecord + '\n' +
  extractFn(html, 'function certLaurelSvg()') + '\n' +
  extractFn(html, 'function certRibbonHtml()') + '\n' +
  extractFn(html, 'function certCornerSvg(pos)') + '\n' +
  buildCertHtml, sandbox);

assert.strictEqual(sandbox.formatCertDate('2026-08-02T01:42:29.000Z'), 'August 2, 2026');
assert.strictEqual(sandbox.formatCertDate('2026-08-02'), 'August 2, 2026');
assert.strictEqual(sandbox.formatCertDate('08/02/2026'), 'August 2, 2026');
assert.strictEqual(sandbox.formatCertDate('8/2/2026'), 'August 2, 2026');
assert.strictEqual(sandbox.formatCertDate('August 2, 2026'), 'August 2, 2026');
assert.strictEqual(sandbox.formatCertDate(''), '—');
assert.strictEqual(sandbox.formatCertDate(null), '—');
assert.ok(!/T\d{2}:/.test(sandbox.formatCertDate('2026-08-02T01:42:29.000Z')), 'never emit raw ISO time');
assert.ok(!/Z$/.test(sandbox.formatCertDate('2026-08-02T01:42:29.000Z')), 'never emit trailing Z');

assert.strictEqual(sandbox.certDateFromRecord({completed:'2026-08-02T01:42:29.000Z'}), '2026-08-02T01:42:29.000Z');
assert.strictEqual(sandbox.certDateFromRecord({completedAt:'2026-08-02'}), '2026-08-02');
assert.strictEqual(sandbox.certDateFromRecord({dateCompleted:'08/02/2026'}), '08/02/2026');
assert.strictEqual(sandbox.formatCertDate(sandbox.certDateFromRecord({completedAt:'2026-08-02T01:42:29.000Z'})), 'August 2, 2026');

const cert = sandbox.buildCertHtml({
  empName:'Aminila Hassaman',
  topicTitle:'Infection Control & Hand Hygiene',
  completed:'2026-08-02T01:42:29.000Z'
});
assert.ok(cert.includes('EVERCARE HOME AGENCY'), 'built cert agency');
assert.ok(cert.includes('Aminila Hassaman'), 'built cert name');
assert.ok(cert.includes('Infection Control &amp; Hand Hygiene') || cert.includes('Infection Control & Hand Hygiene'), 'built cert topic');
assert.ok(cert.includes('August 2, 2026'), 'built cert US long date');
assert.ok(!cert.includes('2026-08-02T01:42:29.000Z'), 'built cert strips ISO');
assert.ok(!cert.includes('5510 Pearl'), 'built cert has no address');
assert.ok(!cert.includes('377-5991'), 'built cert has no phone');
assert.ok(cert.includes('Personal Care / Home Making'), 'built cert ribbon');
assert.ok(cert.includes('rib-tail'), 'built cert swallowtail ribbon');
assert.ok(cert.includes('class="seal"'), 'built cert laurel seal');
assert.ok(cert.includes('← Back'), 'built cert Back');
assert.ok(cert.includes('✕ Close'), 'built cert Close');
assert.ok(cert.includes('Print Certificate'), 'built cert Print');
assert.ok(/@media print/.test(cert), 'built cert print rules');
assert.ok(cert.includes('size:letter'), 'built cert letter page');

assert.ok(/formatCertDate\(certDateFromRecord\(completion\)\)/.test(html), 'compliance table uses US cert date');

console.log('print-cert-c2-test: ok');
