#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(!/xlsx\.full\.min\.js/i.test(html), 'SheetJS/xlsx script tag must be removed');
assert.ok(!/\bXLSX\b/.test(html), 'XLSX global must not remain');
assert.ok(!/exportAllToExcel/.test(html), 'exportAllToExcel must be removed');
assert.ok(!/Export All to Excel/.test(html), 'Excel button copy must be removed');
assert.ok(/cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/3\.10\.1\/jszip\.min\.js/.test(html), 'JSZip CDN required');
assert.ok(html.includes('id="exportAllPdfsBtn"'), 'export button id required');
assert.ok(html.includes('Export all as PDFs'), 'Mo-facing Export all as PDFs label');
assert.ok(html.includes('async function exportAllAsPDFs('), 'exportAllAsPDFs required');
assert.ok(html.includes('async function renderTimesheetPdfDoc('), 'shared PDF helper required');
assert.ok(html.includes('async function renderTimesheetPdfBlob('), 'blob helper required');
assert.ok(/async function downloadTSPDF\(\)\{[\s\S]*requireTimesheetSignatures/.test(html), 'downloadTSPDF keeps sig gate');
assert.ok(/function printTS\(\)\{[\s\S]*requireTimesheetSignatures/.test(html), 'printTS keeps sig gate');
assert.ok(html.includes('downloadTSPDF()') && html.includes('printTS()'), 'single-row print/pdf buttons stay');
assert.ok(html.includes('onclick="closeTimesheetPrint()"'), 'Back/Close stay');

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

const exportFn = extractFn(html, 'async function exportAllAsPDFs(');
const hydrateFn = extractFn(html, 'async function hydrateTimesheetForOverlay(');
const downloadFn = extractFn(html, 'async function downloadTSPDF(');
const renderDoc = extractFn(html, 'async function renderTimesheetPdfDoc(');
assert.ok(exportFn, 'exportAllAsPDFs extract');
assert.ok(hydrateFn, 'hydrateTimesheetForOverlay extract');
assert.ok(downloadFn, 'downloadTSPDF extract');
assert.ok(renderDoc, 'renderTimesheetPdfDoc extract');

assert.ok(!/apiPost\(/.test(exportFn), 'export must not call apiPost /exec');
assert.ok(!/action:\s*['"]get_all['"]/.test(exportFn), 'export must not re-fetch get_all');
assert.ok(!/generate.?pdf/i.test(exportFn), 'never call Sheets generate PDF');
assert.ok(!/drive\.google|googleapis|upload/i.test(exportFn), 'no Drive upload');
assert.ok(!/archive_.*pdf/i.test(exportFn), 'no Apps Script PDF archive');
assert.ok(!/apiPost\(/.test(hydrateFn), 'hydrate must not call /exec');
assert.ok(exportFn.includes('getExportableTimesheets()'), 'uses in-memory list');
assert.ok(exportFn.includes('JSZip'), 'builds a JSZip');
assert.ok(exportFn.includes('renderTimesheetPdfBlob'), 'reuses overlay PDF blob helper');
assert.ok(exportFn.includes('EverCare_Timesheets_PDFs_'), 'zip filename prefix');
assert.ok(exportFn.includes("Downloaded '+ok+' PDFs") || exportFn.includes('Downloaded '), 'done toast');
assert.ok(exportFn.includes('var(--danger)'), 'danger toast on fail');
assert.ok(exportFn.includes('Exporting '), 'progress Exporting N/M');
assert.ok(exportFn.includes('err++'), 'skip + count errors');
assert.ok(downloadFn.includes('requireTimesheetSignatures'), 'single PDF still gated');
assert.ok(downloadFn.includes('renderTimesheetPdfDoc'), 'single PDF uses shared helper');
assert.ok(renderDoc.includes('buildPrintHtml(r)'), 'shared helper uses overlay HTML');
assert.ok(renderDoc.includes("jsPDF('p','pt','letter')"), 'Letter page');
assert.ok(renderDoc.includes('html2canvas'), 'html2canvas overlay capture');
assert.ok(renderDoc.includes("data-print-mode','paper-overlay'") || renderDoc.includes('paper-overlay'), 'paper-overlay mode');

const helpers = [
  extractFn(html, 'function parseTimesheetDays('),
  extractFn(html, 'function timesheetHasOverlayFields('),
  extractFn(html, 'function getExportableTimesheets('),
  extractFn(html, 'function weekStartMMDDYYYY('),
  extractFn(html, 'function sanitizePdfNamePart('),
  extractFn(html, 'function timesheetZipPdfName('),
  extractFn(html, 'function uniqueZipName(')
].join('\n');

const ctx = {
  allRecords: [],
  store: {get: function(){ return null; }}
};
vm.createContext(ctx);
vm.runInContext(helpers, ctx);

const name = vm.runInContext("timesheetZipPdfName({empName:'Aminila Hassaman',weekStart:'2026-09-13'})", ctx);
assert.strictEqual(name, 'Hassaman_Aminila_WeekOf_09132026.pdf', 'Last_First_WeekOf_MMDDYYYY');

const oneWord = vm.runInContext("timesheetZipPdfName({empName:'Hassaman',weekStart:'2026-09-13'})", ctx);
assert.strictEqual(oneWord, 'Hassaman_WeekOf_09132026.pdf', 'single-token name');

assert.ok(vm.runInContext("timesheetHasOverlayFields({empName:'A',weekStart:'2026-09-13',days:{}})", ctx), 'name+week is enough');
assert.ok(vm.runInContext("timesheetHasOverlayFields({days:{0:{tin:'08:00'}}})", ctx), 'day fields are enough');
assert.ok(!vm.runInContext("timesheetHasOverlayFields({id:1,days:{}})", ctx), 'empty id-only row is not enough');
assert.ok(vm.runInContext("timesheetHasOverlayFields({days:'{\\\"0\\\":{\\\"tin\\\":\\\"08:00\\\"}}'})", ctx), 'JSON days string parses');

ctx.allRecords = [
  {id:1,submitted:'2026-09-14',empName:'A',weekStart:'2026-09-13',days:{0:{tin:'08:00'}}},
  {id:2,submitted:'',empName:'Draft',weekStart:'2026-09-13',days:{}}
];
const listed = vm.runInContext('getExportableTimesheets()', ctx);
assert.strictEqual(listed.length, 2, 'in-memory allRecords already submitted-filtered by list loader');

ctx.allRecords = [];
ctx.store = {get: function(k){
  if(k!=='admin_records')return null;
  return [
    {id:1,submitted:'yes',empName:'A',weekStart:'2026-09-13',days:{0:{tin:'08:00'}}},
    {id:2,empName:'Draft',weekStart:'2026-09-13',days:{0:{tin:'08:00'}}}
  ];
}};
const fromStore = vm.runInContext('getExportableTimesheets()', ctx);
assert.strictEqual(fromStore.length, 1, 'store fallback skips drafts (no submitted)');
assert.strictEqual(fromStore[0].id, 1);

ctx.used = {};
const a = vm.runInContext("uniqueZipName('Hassaman_Aminila_WeekOf_09132026.pdf', used)", ctx);
const b = vm.runInContext("uniqueZipName('Hassaman_Aminila_WeekOf_09132026.pdf', used)", ctx);
assert.strictEqual(a, 'Hassaman_Aminila_WeekOf_09132026.pdf');
assert.strictEqual(b, 'Hassaman_Aminila_WeekOf_09132026_2.pdf');

console.log('export-all-pdfs-zip-test: ok');
