#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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

const save = extractFn(html, 'async function saveNewClientIntake(status)');
assert.ok(save, 'saveNewClientIntake not found');
assert.strictEqual(extractFn(html, 'async function nciEnsureCompletePdf(intakeId,priorPdfError)'), '', 'ensure helper is gone');
assert.strictEqual(extractFn(html, 'async function archiveNewClientIntakePdf('), '', 'archive helper is gone');
assert.strictEqual(extractFn(html, 'async function nciCallArchivePdf('), '', 'archive call helper is gone');
assert.strictEqual(extractFn(html, 'async function nciPollCompletePdfLink('), '', 'drive link poll is gone');
assert.ok(!/NCI_PDF_POLL_MS|NCI_ARCHIVE_RETRY_MS|NCI_PDF_INTERIM_WARN_MS/.test(html), 'drive wait constants are gone');
assert.ok(!save.includes("showTempMsg('Saved — PDF generating'"), 'complete save does not show the generating toast');
assert.ok(save.includes("showTempMsg('PDF will be available soon','var(--teal)')"), 'missing PDF shows a calm soon toast');
assert.ok(!/await\s+archiveNewClientIntakePdf/.test(save), 'save must not await archive');
assert.ok(!/await\s+nciCallArchivePdf/.test(save), 'save must not await archive helper');
assert.ok(!/await\s+nciEnsureCompletePdf/.test(save), 'save must not await a pdf ensure');
const toastAt = save.indexOf("showTempMsg('PDF will be available soon'");
const closeAt = save.indexOf('closeNewClientIntake(true)', toastAt);
assert.ok(toastAt > 0 && closeAt > toastAt, 'soon toast appears before close');

console.log('nci-pdf-generating-toast-test: ok');
