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

const PHONE_IDS = [
  'nci_a_caregiverPhone',
  'nci_p_phone',
  'nci_p_emergencyPhone',
  'nci_p_supervisorPhone',
  'nci_c_emergencyPhone',
  'nci_m_healthAgentPhone'
];

PHONE_IDS.forEach(function(id){
  const re = new RegExp('id="'+id+'"[^>]*>');
  const tag = (html.match(re)||[])[0]||'';
  assert.ok(tag, id+' input missing');
  assert.ok(/data-phone="us"/.test(tag), id+' must have data-phone="us"');
  assert.ok(/inputmode="tel"/.test(tag), id+' must have inputmode="tel"');
  const max = parseInt((tag.match(/maxlength="(\d+)"/)||[])[1]||'0',10);
  assert.ok(max>=14&&max<=20, id+' must allow formatted US phone (~14) plus +1 paste');
  assert.ok(/placeholder="\(123\) 456-7890"/.test(tag), id+' must use (123) 456-7890 placeholder');
});

const consentBlock = html.slice(
  html.indexOf('id="nci_c_emergencyName"')-80,
  html.indexOf('id="nci_c_emergencyPhone"')+80
);
const planBlock = html.slice(
  html.indexOf('id="nci_p_emergencyName"')-80,
  html.indexOf('id="nci_p_emergencyPhone"')+80
);
assert.ok(
  /nci_c_emergencyName[\s\S]+nci_c_emergencyRelationship[\s\S]+nci_c_emergencyPhone/.test(consentBlock),
  'Consent emergency order must be Name → Relationship → Phone'
);
assert.ok(
  !/nci_c_emergencyName[\s\S]+nci_c_emergencyPhone[\s\S]+nci_c_emergencyRelationship/.test(consentBlock),
  'Consent must not keep Name → Phone → Relationship'
);
assert.ok(
  /nci_p_emergencyName[\s\S]+nci_p_emergencyRelationship[\s\S]+nci_p_emergencyPhone/.test(planBlock),
  'Activity Plan emergency order must stay Name → Relationship → Phone'
);

assert.ok(html.includes("emergencyContactName"), 'Ace emergencyContactName must stay');
assert.ok(html.includes("emergencyContactRelationship"), 'Ace emergencyContactRelationship must stay');
assert.ok(html.includes("emergencyContactPhone"), 'Ace emergencyContactPhone must stay');
assert.ok(/clientPhone:nciPhoneVal\('nci_p_phone'\)/.test(html), 'collect must send formatted clientPhone');
assert.ok(/emergencyContactPhone:emergPhone/.test(html), 'collect must keep emergencyContactPhone');
assert.ok(/emergencyContactPhone:nciPhoneVal\('nci_c_emergencyPhone'\)/.test(html), 'consent collect must keep emergencyContactPhone');
assert.ok(/nciPhoneVal\('nci_a_caregiverPhone'\)/.test(html), 'collect must format caregiver phone');
assert.ok(/nciPhoneVal\('nci_p_supervisorPhone'\)/.test(html), 'collect must format supervisor phone');
assert.ok(/nciPhoneVal\('nci_m_healthAgentPhone'\)/.test(html), 'collect must format health agent phone');

assert.ok(extractFn(html, 'function maskMDYInput(el,e)'), 'date mask must remain');
assert.ok(extractFn(html, 'function maskPhoneInput(el,e)'), 'maskPhoneInput missing');
assert.ok(extractFn(html, 'function nciBindPhoneMask()'), 'nciBindPhoneMask missing');
assert.ok(/data-date="mdy"/.test(html), 'date mask attributes must remain');

const digitsFn = extractFn(html, 'function nciPhoneDigits(s)');
const formatFn = extractFn(html, 'function formatPhoneDigits(digits,addTrailing)');
const displayFn = extractFn(html, 'function formatUSPhoneDisplay(s)');
assert.ok(digitsFn && formatFn && displayFn, 'phone format helpers missing');
const helpers = new Function(digitsFn+';'+formatFn+';'+displayFn+';return {nciPhoneDigits:nciPhoneDigits,formatPhoneDigits:formatPhoneDigits,formatUSPhoneDisplay:formatUSPhoneDisplay};')();

assert.strictEqual(helpers.nciPhoneDigits('2163775991'), '2163775991');
assert.strictEqual(helpers.nciPhoneDigits('216-377-5991'), '2163775991');
assert.strictEqual(helpers.nciPhoneDigits('+1 216 377 5991'), '2163775991');
assert.strictEqual(helpers.nciPhoneDigits('12163775991'), '2163775991');
assert.strictEqual(helpers.nciPhoneDigits('2163775991999'), '2163775991');
assert.strictEqual(helpers.formatPhoneDigits('2', true), '(2');
assert.strictEqual(helpers.formatPhoneDigits('216', true), '(216) ');
assert.strictEqual(helpers.formatPhoneDigits('216377', true), '(216) 377-');
assert.strictEqual(helpers.formatPhoneDigits('2163775991', true), '(216) 377-5991');
assert.strictEqual(helpers.formatUSPhoneDisplay('2163775991'), '(216) 377-5991');
assert.strictEqual(helpers.formatUSPhoneDisplay('(123) 333-1234'), '(123) 333-1234');
assert.strictEqual(helpers.formatUSPhoneDisplay('+12163775991'), '(216) 377-5991');
assert.strictEqual(helpers.formatUSPhoneDisplay(''), '');
assert.strictEqual(helpers.formatUSPhoneDisplay('+1 (216) 377-5991'), '(216) 377-5991');
assert.strictEqual(helpers.formatUSPhoneDisplay('+1 216-377-5991'), '(216) 377-5991');
assert.strictEqual(helpers.nciPhoneDigits('+1216'), '216');

console.log('nci-phone-mask-test: ok');
