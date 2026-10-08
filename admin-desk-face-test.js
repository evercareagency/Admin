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

const src = [
  'function deskLooksRaw(text)',
  'function deskFaceError(friendly, raw)',
  'function showTempMsg(msg,color,holdMs)'
].map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const warned = [];
const toast = {
  id: '',
  style: {},
  textContent: '',
  parentNode: null,
  setAttribute: function(){}
};
const document = {
  body: {appendChild: function(el){ el.parentNode = document.body; }},
  getElementById: function(){ return toast.id ? toast : null; },
  createElement: function(){ toast.id = 'nciToast'; return toast; }
};
const sandbox = {
  document: document,
  console: {warn: function(v){ warned.push(v); }},
  setTimeout: function(){ return 1; },
  clearTimeout: function(){}
};
vm.createContext(sandbox);
vm.runInContext(src + '\nthis.deskFaceError=deskFaceError; this.showTempMsg=showTempMsg;', sandbox);

const face = sandbox.deskFaceError('Could not save this intake.', 'JWT expired: permission denied for table');
assert.strictEqual(face, 'Could not save this intake.');
assert.strictEqual(warned.length, 1);
assert.ok(String(warned[0]).indexOf('JWT') >= 0);

warned.length = 0;
sandbox.showTempMsg('TypeError: cannot read pdf_link', 'var(--danger)');
assert.strictEqual(toast.textContent, 'Something went wrong. Please try again.');
assert.ok(String(warned[0]).indexOf('TypeError') >= 0);
assert.ok(toast.textContent.indexOf('TypeError') < 0);
assert.ok(toast.textContent.indexOf('pdf_link') < 0);

sandbox.showTempMsg('PDF will be available soon', 'var(--teal)');
assert.strictEqual(toast.textContent, 'PDF will be available soon');

console.log('admin-desk-face-test: ok');
