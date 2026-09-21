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

function extractFns(names){
  return names.map(function(n){return extractFn(html, n);}).join('\n');
}

assert.ok(html.includes('id="addAideBtn"'), 'Add aide button must sit in Aides header');
assert.ok(html.includes('onclick="showAddAideModal()"'), 'Add aide button must open the create modal');
assert.ok(html.includes('onclick="renderAides(true)"'), 'Refresh must stay on Aides');
assert.ok(html.includes('id="addAideModal"'), 'Add aide modal missing');
assert.ok(html.includes('id="addAideFullName"'), 'Full name field missing');
assert.ok(html.includes('id="addAideUsername"'), 'Username field missing');
assert.ok(html.includes('id="addAideClientList"'), 'Assign clients list missing');
assert.ok(html.includes('id="createAideBtn"'), 'Create aide button missing');
assert.ok(!/id="addAide[^"]*[Ee]mail"/.test(html), 'Add aide form must not capture email');
assert.ok(!/id="addAideModal"[\s\S]{0,1800}type="email"/.test(html), 'Add aide modal must not have an email input');
assert.ok(html.includes('id="aideTempPwdModal"'), 'One-time temp password modal missing');
assert.ok(html.includes('onclick="copyAideTempPassword()"'), 'Copy button missing on temp password card');
assert.ok(html.includes('onclick="closeAideTempPasswordModal()"'), 'Done must discard the one-time password');
assert.ok(html.includes('Still on temp password'), 'Status pill copy must be Still on temp password');
assert.ok(html.includes('<th>Name</th><th>Username</th><th>Assigned clients</th><th>Status</th>'),
  'Aides table columns must be name, username, assigned clients, status');
assert.ok(html.includes('id="nav_aides"'), 'Aides nav is shared by Admin and Scheduler');
assert.ok(!/if\(currentAdminRole!=='Admin'\).*addAide|addAide.*currentAdminRole!=='Admin'/.test(html),
  'Add aide must not be Admin-only');

const suggest = extractFn(html, 'function suggestAideUsername(fullName)');
const gen = extractFn(html, 'function generateTempPassword()');
const truth = extractFn(html, 'function aideTruth(v)');
const onTemp = extractFn(html, 'function aideOnTempPassword(u)');
const assigned = extractFn(html, 'function aideAssignedClientValues(u)');
const resolve = extractFn(html, 'function resolveClientLabel(item)');
const format = extractFn(html, 'function formatAideAssignedClients(u)');
const aceErr = extractFn(html, 'function aceActionError(data,err,action)');
const create = extractFn(html, 'async function submitCreateAide()');
const reset = extractFn(html, 'async function resetAideTempPassword(username)');
const showOnce = extractFn(html, 'function showAideTempPasswordOnce(username,tempPassword,title)');
const closeOnce = extractFn(html, 'function closeAideTempPasswordModal()');
const render = extractFn(html, 'async function renderAides(force)');
const unknown = extractFn(html, 'function nciLooksLikeUnknownAction(text)');

assert.ok(suggest, 'suggestAideUsername missing');
assert.ok(gen, 'generateTempPassword missing');
assert.ok(onTemp, 'aideOnTempPassword missing');
assert.ok(assigned, 'aideAssignedClientValues missing');
assert.ok(create, 'submitCreateAide missing');
assert.ok(reset, 'resetAideTempPassword missing');
assert.ok(render, 'renderAides missing');

assert.ok(create.includes("action:'create_aide'"), 'create must POST create_aide');
assert.ok(create.includes('fullName') && create.includes('username') && create.includes('tempPassword') && create.includes('clientIds'),
  'create_aide payload must include fullName, username, tempPassword, clientIds');
assert.ok(!/email/.test(create), 'create_aide must not send email');
assert.ok(reset.includes("action:'reset_aide_temp_password'"), 'reset must POST reset_aide_temp_password');
assert.ok(showOnce.includes('_aideTempPwdOnce'), 'one-time password must be stashed only in memory');
assert.ok(closeOnce.includes("_aideTempPwdOnce=''") || closeOnce.includes('_aideTempPwdOnce=""'),
  'closing the modal must discard the temp password');
assert.ok(render.includes('Still on temp password'), 'list must paint Still on temp password');
assert.ok(render.includes('badge-ok') && render.includes('Active'), 'active aides get a green Active pill');
assert.ok(render.includes('confirmResetAideTempPassword'), 'row must expose Reset temp password');

function runHelpers(){
  const src = extractFns([
    'function suggestAideUsername(fullName)',
    'function generateTempPassword()',
    'function aideTruth(v)',
    'function aideOnTempPassword(u)',
    'function aideAssignedClientValues(u)',
    'function resolveClientLabel(item)',
    'function formatAideAssignedClients(u)',
    'function nciLooksLikeUnknownAction(text)',
    'function aceActionError(data,err,action)'
  ]);
  const fn = new Function('allClients', src + '; return {suggestAideUsername, generateTempPassword, aideOnTempPassword, aideAssignedClientValues, formatAideAssignedClients, aceActionError};');
  return fn([{id: 'c1', name: 'Rivera, Ana'}]);
}

const helpers = runHelpers();
assert.strictEqual(helpers.suggestAideUsername('Jane Doe'), 'jdoe', 'Jane Doe → jdoe');
assert.strictEqual(helpers.suggestAideUsername('  Mary Jane Watson '), 'mwatson', 'first initial + last name');
assert.strictEqual(helpers.suggestAideUsername('Jane'), 'jane', 'single name stays lowercase word');
assert.ok(helpers.suggestAideUsername('Jane Doe').indexOf(' ') < 0, 'username has no spaces');

const a = helpers.generateTempPassword();
const b = helpers.generateTempPassword();
assert.ok(a && b && a !== b, 'temp passwords must be unique');
assert.ok(a.length >= 8, 'temp password must be reasonably long');

assert.ok(helpers.aideOnTempPassword({mustChangePassword: true}), 'mustChangePassword alias');
assert.ok(helpers.aideOnTempPassword({onTempPassword: 'yes'}), 'onTempPassword alias');
assert.ok(helpers.aideOnTempPassword({tempPasswordActive: 1}), 'tempPasswordActive alias');
assert.ok(helpers.aideOnTempPassword({needsPasswordChange: 'true'}), 'needsPasswordChange alias');
assert.ok(!helpers.aideOnTempPassword({mustChangePassword: false}), 'false flag is Active');

assert.deepStrictEqual(helpers.aideAssignedClientValues({assignedClients: ['c1']}), ['c1']);
assert.deepStrictEqual(helpers.aideAssignedClientValues({clients: 'c1,c2'}), ['c1', 'c2']);
assert.deepStrictEqual(helpers.aideAssignedClientValues({clientIds: ['c9']}), ['c9']);
assert.strictEqual(helpers.formatAideAssignedClients({assignedClients: ['c1']}), 'Rivera, Ana');

assert.ok(/Unknown action: create_aide/.test(helpers.aceActionError({error: 'Unknown action'}, null, 'create_aide')),
  'Unknown action must surface as a clear toast string');
assert.ok(helpers.aceActionError({error: 'Username taken'}, null, 'create_aide') === 'Username taken',
  'Ace collision error is shown as-is');

console.log('admin-add-aide-test: ok');
