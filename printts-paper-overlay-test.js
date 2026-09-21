#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const blankAsset = path.join(__dirname, 'assets', 'blank-letter.png');
const blankRef = path.join(__dirname, 'evercare', 'form-ref', 'blank-letter.png');

assert.ok(fs.existsSync(blankAsset), 'assets/blank-letter.png must be in the repo for Pages');
assert.ok(fs.existsSync(blankRef), 'evercare/form-ref/blank-letter.png must exist');
assert.ok(!html.includes('.ts-mo'), 'HTML-drawn .ts-mo grid must be removed');
assert.ok(!html.includes('buildMoTimesheetHTML'), 'buildMoTimesheetHTML must be replaced');
assert.ok(!html.includes('buildPaperSvcSection'), 'table service builder must be removed');
assert.ok(!html.includes('Travel Hours'), 'must not invent Travel Hours');
assert.ok(html.includes('function buildPrintHtml('), 'buildPrintHtml required');
assert.ok(html.includes('class="ts-blank"'), 'blank paper img required');
assert.ok(/TS_BLANK_SRC='assets\/blank-letter\.png\?v='/.test(html), 'Pages-served blank path with cache bust');
assert.ok(html.includes("TS_BLANK_VER='a713ovl'"), 'blank asset version');
assert.ok(/background-image:\s*(?:var\(--ts-blank-url\)|url\(['"]assets\/blank-letter\.png\?v=)/.test(html), 'sheet CSS background-image backup');
assert.ok(html.includes("background-image:url('assets/blank-letter.png?v=a713ovl')"), 'print CSS keeps versioned blank');
assert.ok(!/#tsPrintSheet,\.ts-print-sheet\{[^}]*background:#fff !important/.test(html.replace(/\n/g,'')), 'print sheet CSS must not wipe background-image');
assert.ok(html.includes('data-print-mode="paper-overlay"'), 'sheet marks paper-overlay mode');
assert.ok(html.includes('applyPrintSheetPaper'), 'open/print apply paper CSS + data attr');
assert.ok(/async function printTimesheetSheet\(/.test(html), 'printTimesheetSheet stays async');
assert.ok(/async function waitForBlankPaper\(/.test(html), 'decode wait helper');
assert.ok(html.includes('img.decode') || html.includes('img.decode==='), 'await image decode');
assert.ok(html.includes('naturalWidth>0'), 'blank must decode with naturalWidth>0');
assert.ok(!html.includes('PAPER_SVC_LEFT'), 'legacy HTML left-column builder removed');
assert.ok(!html.includes('PAPER_SERVICES'), 'legacy HTML service table map removed');
assert.ok(html.includes('nameX:110'), 'Ace FORM nameX');
assert.ok(html.includes('dayY0:172.5'), 'Ace FORM dayY0');
assert.ok(html.includes('commentsY:610'), 'Ace FORM commentsY');
assert.ok(/function printTS\(\)\{[\s\S]*requireTimesheetSignatures/.test(html), 'printTS keeps sig gate');
assert.ok(/async function downloadTSPDF\(\)\{[\s\S]*requireTimesheetSignatures/.test(html), 'downloadTSPDF keeps sig gate');
assert.ok(html.includes('sheet.innerHTML=buildPrintHtml(r)'), 'openTimesheetPrint uses overlay HTML');
assert.ok(html.includes('@media print'), 'print stylesheet stays');
assert.ok(/#tsPrintToolbar[\s\S]*display:none !important/.test(html), 'toolbar hidden in print');

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
function extractConst(src, name){
  const start = src.indexOf('const '+name+'=');
  assert.ok(start >= 0, name+' missing');
  let i = start;
  let depth = 0;
  let started = false;
  for(; i < src.length; i++){
    if(src[i] === '[' || src[i] === '{'){depth++; started=true;}
    else if(src[i] === ']' || src[i] === '}'){depth--;}
    else if(src[i] === ';' && (!started || depth === 0))return src.slice(start, i + 1);
  }
  return '';
}

const consts = [
  extractConst(html, 'DAYS'),
  extractConst(html, 'PRINT_DAYS'),
  extractConst(html, 'SVC_PERSONAL_CARE'),
  extractConst(html, 'SVC_ELIMINATION'),
  extractConst(html, 'SVC_HOUSEHOLD'),
  extractConst(html, 'SVC_MOBILITY'),
  extractConst(html, 'SVC_TREATMENTS'),
  extractConst(html, 'SVC_NUTRITION'),
  extractConst(html, 'TS_FORM_PT'),
  extractConst(html, 'TS_BLANK_VER'),
  extractConst(html, 'TS_BLANK_SRC'),
  extractConst(html, 'TS_SVC_OVERLAY')
].join('\n');

const fns = [
  extractFn(html, 'function dayEntry('),
  extractFn(html, 'function isWorkedDay('),
  extractFn(html, 'function to12hrPrint('),
  extractFn(html, 'function toMDYPrint('),
  extractFn(html, 'function hrsToDecimal('),
  extractFn(html, 'function escapePrint('),
  extractFn(html, 'function paperSvcKey('),
  extractFn(html, 'function dayHasPaperService('),
  extractFn(html, 'function formatHrsDisplay('),
  extractFn(html, 'function tsPctX('),
  extractFn(html, 'function tsPctY('),
  extractFn(html, 'function tsFill('),
  extractFn(html, 'function daySigMark('),
  extractFn(html, 'function buildPrintHtml(')
].join('\n');

fns.split('\nfunction ').slice(1).forEach(chunk=>{
  assert.ok(chunk.trim(), 'extracted function empty');
});

function hasSigInk(sig){
  return !!(sig && String(sig).indexOf('data:image') === 0 && String(sig).length > 40);
}

const ctx = {hasSigInk};
vm.createContext(ctx);
vm.runInContext(consts + '\n' + fns, ctx);
const buildPrintHtml = vm.runInContext('buildPrintHtml', ctx);
const tsPctX = vm.runInContext('tsPctX', ctx);
const tsPctY = vm.runInContext('tsPctY', ctx);
const TS_FORM_PT = vm.runInContext('TS_FORM_PT', ctx);

const ink = 'data:image/png;base64,' + 'A'.repeat(80);
const rec = {
  clientName: 'Ruth Coleman',
  empName: 'Aminila Hassaman',
  totalHrs: '18:00',
  notes: 'Client requested extra laundry Thursday.',
  days: {
    0: {date:'2026-09-13', tin:'08:00', tout:'12:00', hrs:'4:00', aideSig:ink, clientSig:ink, svcs:['Assist W/Bath-Bed/Tub/Shower','Meal Prep. (B/L/D)']},
    1: {date:'2026-09-14', tin:'08:00', tout:'14:00', hrs:'6:00', aideSig:ink, clientSig:ink, svcs:['Laundry']},
    2: {date:'2026-09-15', tin:'', tout:'', hrs:'—', svcs:[]},
    3: {date:'2026-09-16', tin:'09:00', tout:'13:00', hrs:'4:00', aideSig:ink, clientSig:ink, svcs:['Skin Care']},
    4: {date:'2026-09-17', tin:'08:00', tout:'12:00', hrs:'4:00', aideSig:ink, clientSig:ink, svcs:['Hair Care/Shampoo']},
    5: {date:'2026-09-18', tin:'', tout:'', hrs:'—', svcs:[]},
    6: {date:'2026-09-19', tin:'', tout:'', hrs:'—', svcs:[]}
  }
};

const out = buildPrintHtml(rec);
assert.ok(out.startsWith('<img class="ts-blank"'), 'sheet starts with blank paper img');
assert.ok(out.includes('src="assets/blank-letter.png?v=a713ovl"'), 'blank src is versioned Pages asset');
assert.ok(!/<table/i.test(out), 'overlay must not rebuild tables');
assert.ok(!out.includes('<table'), 'buildPrintHtml never emits table');
assert.ok(out.includes('Ruth Coleman'), 'client name fill');
assert.ok(out.includes('Aminila Hassaman'), 'caregiver name fill');
assert.ok(out.includes('09/13/26'), 'day date fill');
assert.ok(out.includes('8:00 AM'), 'time in fill');
assert.ok(out.includes('12:00 PM'), 'time out fill');
assert.ok(out.includes('4:00'), 'hours fill');
assert.ok(out.includes('18:00'), 'weekly total fill');
assert.ok(out.includes('Client requested extra laundry Thursday.'), 'comments fill');
assert.ok(!out.includes('Travel'), 'no invented travel field');
assert.ok((out.match(/✓/g) || []).length >= 10, 'day sig and service checkmarks');

const nameLeft = tsPctX(TS_FORM_PT.nameX);
assert.ok(out.includes('left:' + nameLeft), 'name uses FORM % X');
const sunTop = tsPctY(TS_FORM_PT.dayY0);
assert.ok(out.includes('top:' + sunTop), 'Sunday row uses FORM % Y');
const commentsTop = tsPctY(TS_FORM_PT.commentsY);
assert.ok(out.includes('top:' + commentsTop), 'comments use FORM % Y');
const bathMark = tsPctX(TS_FORM_PT.dayXL[0]);
assert.ok(out.includes('left:' + bathMark), 'Sunday personal-care check at dayXL[0]');

const empty = buildPrintHtml({clientName:'', empName:'', days:{}});
assert.ok(empty.includes('ts-blank'), 'blank sheet still renders');
assert.ok(!empty.includes('ts-fill-name'), 'no invented name placeholders');

console.log('printts-paper-overlay-test: ok');
