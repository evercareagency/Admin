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
assert.ok(html.includes('id="addAideErr"'), 'in-modal collision error #addAideErr missing');
const errBeforeBtn=html.indexOf('id="addAideErr"');
const createBtnAt=html.indexOf('id="createAideBtn"');
assert.ok(errBeforeBtn>=0&&createBtnAt>errBeforeBtn, '#addAideErr must sit above the Create button');
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
const taken = extractFn(html, 'function looksLikeUsernameTaken(text)');
const already = extractFn(html, 'function aideUsernameAlreadyTaken(username)');
const showErr = extractFn(html, 'function showAddAideError(msg)');
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
assert.ok(taken, 'looksLikeUsernameTaken missing');
assert.ok(already, 'aideUsernameAlreadyTaken missing');
assert.ok(showErr, 'showAddAideError missing');

assert.ok(create.includes("'admin_create_aide'") && create.includes("'create_aide'"),
  'create must POST admin_create_aide with create_aide alias');
assert.ok(create.includes('name:') && create.includes('username') && create.includes('tempPassword') && create.includes('clientIds'),
  'admin_create_aide payload must include name, username, tempPassword, clientIds');
assert.ok(!/\bemail\b/.test(create), 'admin_create_aide must not send email');
assert.ok(create.includes('aideUsernameAlreadyTaken'), 'must pre-check loaded aides before POST');
assert.ok(create.includes('Username already taken'), 'pre-check must show Username already taken');
assert.ok(create.includes('showAddAideError'), 'non-success must use in-modal + toast helper');
assert.ok(showErr.includes('#b91c1c'), 'collision toast must use solid red #b91c1c');
assert.ok(showErr.includes('addAideErr'), 'showAddAideError must paint #addAideErr');
assert.ok(create.indexOf('closeModal')<0||create.indexOf("if(data&&data.success)")<create.indexOf("closeModal('addAideModal')"),
  'must not close the modal on create failure');
assert.ok(create.includes("btn.textContent='Create aide'"), 'Create button must re-enable after failure');
assert.ok(reset.includes("'reset_temp_password'") && reset.includes("'reset_aide_temp_password'"),
  'reset must POST reset_temp_password with alias');
assert.ok(reset.includes('tempPassword'), 'reset_temp_password must send Ghost-generated tempPassword');
const postAide = extractFn(html, 'async function postAideAction(primary,alias,payload)');
assert.ok(postAide, 'postAideAction helper missing');
assert.ok(postAide.includes('nciLooksLikeUnknownAction'), 'alias retry only on Unknown action');
assert.ok(postAide.includes('looksLikeUsernameTaken'), 'must not alias-retry a taken username');
assert.ok(showOnce.includes('_aideTempPwdOnce'), 'one-time password must be stashed only in memory');
assert.ok(closeOnce.includes("_aideTempPwdOnce=''") || closeOnce.includes('_aideTempPwdOnce=""'),
  'closing the modal must discard the temp password');
assert.ok(render.includes('Still on temp password'), 'list must paint Still on temp password');
assert.ok(render.includes('badge-ok') && render.includes('Active'), 'active aides get a green Active pill');
const aideActions = extractFn(html, 'function aideActionButtons(un, desk)');
assert.ok(aideActions.includes('confirmResetAideTempPassword'), 'row must expose Reset temp password');
assert.ok(render.includes('aideActionButtons'), 'list rows use the shared aide actions');

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
    'function looksLikeUsernameTaken(text)',
    'function aceActionError(data,err,action)'
  ]);
  const fn = new Function('allClients', src + '; return {suggestAideUsername, generateTempPassword, aideOnTempPassword, aideAssignedClientValues, formatAideAssignedClients, aceActionError, looksLikeUsernameTaken, nciLooksLikeUnknownAction};');
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

assert.ok(/Unknown action: admin_create_aide/.test(helpers.aceActionError({error: 'Unknown action'}, null, 'admin_create_aide')),
  'Unknown action must surface as a clear toast string');
assert.ok(helpers.aceActionError({error: 'Username taken'}, null, 'admin_create_aide') === 'Username taken',
  'Ace collision error is shown as-is');
assert.strictEqual(helpers.aceActionError({success:false,error:'Username already taken'}, null, 'admin_create_aide'),
  'Username already taken', 'Ace v46 collision error is shown as-is');
assert.ok(!helpers.nciLooksLikeUnknownAction('Username already taken'),
  'taken username is not Unknown action');
assert.ok(helpers.looksLikeUsernameTaken('Username already taken'),
  'Username already taken is a collision');
assert.strictEqual(helpers.formatAideAssignedClients({assignedClients:[{id:'c1',name:'Rivera, Ana'}]}), 'Rivera, Ana');

function runTakenCheck(users){
  const src = extractFns([
    'function collectLoadedAideUsernames()',
    'function aideUsernameAlreadyTaken(username)'
  ]);
  const prelude='var loadedAidesList='+JSON.stringify(users)+';var allAidesForAssign=[];function cacheGet(){return null;}';
  return new Function(prelude+src+';return {aideUsernameAlreadyTaken};')();
}
const takenCheck=runTakenCheck([{username:'JaneDoe'},{username:'mwatson'}]);
assert.ok(takenCheck.aideUsernameAlreadyTaken('janedoe'), 'pre-check is case-insensitive');
assert.ok(takenCheck.aideUsernameAlreadyTaken('JANEDOE'), 'pre-check upper-case match');
assert.ok(!takenCheck.aideUsernameAlreadyTaken('newaide'), 'unused username is free');

function runDomCollision(){
  const src=extractFns([
    'function clearAddAideError()',
    'function showAddAideError(msg)',
    'function showTempMsg(msg,color,holdMs)'
  ]);
  const prelude=[
    'var store={};',
    'function el(id){if(!store[id])store[id]={id:id,textContent:"",style:{cssText:"",display:"none"},parentNode:null,setAttribute:function(){}};return store[id];}',
    'var document={getElementById:el,body:{appendChild:function(n){n.parentNode=this;}},createElement:function(){return el("nciToast");}};'
  ].join('');
  return new Function(prelude+src+';showAddAideError("Username already taken");return {err:document.getElementById("addAideErr"),toast:document.getElementById("nciToast")};')();
}
const painted=runDomCollision();
assert.strictEqual(painted.err.textContent,'Username already taken','in-modal error must show Ace collision text');
assert.strictEqual(painted.err.style.display,'block','#addAideErr must be visible');
assert.ok(painted.toast.style.cssText.indexOf('#b91c1c')>=0,'toast background must be solid #b91c1c');
assert.strictEqual(painted.toast.textContent,'Username already taken','toast must repeat Ace collision text');

async function runSubmitPrecheck(){
  const src=extractFns([
    'function clearAddAideError()',
    'function showAddAideError(msg)',
    'function showTempMsg(msg,color,holdMs)',
    'function collectLoadedAideUsernames()',
    'function aideUsernameAlreadyTaken(username)',
    'async function submitCreateAide()'
  ]);
  const prelude=[
    'var posted=0;',
    'var modalClosed=false;',
    'var loadedAidesList=[{username:"jdoe"}];',
    'var allAidesForAssign=[];',
    'function cacheGet(){return {success:true,data:[{username:"jdoe"}]};}',
    'async function postAideAction(){posted++;return {data:{success:false,error:"Username already taken"},err:null,action:"admin_create_aide"};}',
    'function closeModal(){modalClosed=true;}',
    'var store={};',
    'function el(id){if(!store[id])store[id]={id:id,value:id==="addAideFullName"?"Jane Doe":id==="addAideUsername"?"JDOE":"",textContent:"",style:{cssText:"",display:"none"},disabled:false,parentNode:null,setAttribute:function(){}};return store[id];}',
    'var document={getElementById:el,body:{appendChild:function(n){n.parentNode=this;}},createElement:function(){return el("nciToast");}};'
  ].join('');
  return new Function('return (async function(){'+prelude+src+';await submitCreateAide();return {posted:posted,modalClosed:modalClosed,err:document.getElementById("addAideErr"),toast:document.getElementById("nciToast"),name:document.getElementById("addAideFullName").value,user:document.getElementById("addAideUsername").value,btn:document.getElementById("createAideBtn")};})();')();
}
async function runSubmitAceCollision(){
  const src=extractFns([
    'function clearAddAideError()',
    'function showAddAideError(msg)',
    'function showTempMsg(msg,color,holdMs)',
    'function collectLoadedAideUsernames()',
    'function aideUsernameAlreadyTaken(username)',
    'function looksLikeUsernameTaken(text)',
    'function nciLooksLikeUnknownAction(text)',
    'function aceActionError(data,err,action)',
    'async function submitCreateAide()'
  ]);
  const prelude=[
    'var posted=0;',
    'var modalClosed=false;',
    'var loadedAidesList=[];',
    'var allAidesForAssign=[];',
    'var addAideSelectedClients={forEach:function(){},length:0};',
    'if(typeof Array.from!=="function")Array.from=function(){return [];};',
    'function cacheGet(){return null;}',
    'function generateTempPassword(){return "TempPass1";}',
    'function cacheInvalidate(){}',
    'function logActivity(){}',
    'function renderAides(){}',
    'function showAideTempPasswordOnce(){}',
    'async function postAideAction(){posted++;return {data:{success:false,error:"Username already taken"},err:null,action:"admin_create_aide"};}',
    'function closeModal(){modalClosed=true;}',
    'var store={};',
    'function el(id){if(!store[id])store[id]={id:id,value:id==="addAideFullName"?"Jane Doe":id==="addAideUsername"?"jdoe":"",textContent:id==="createAideBtn"?"Create aide":"",style:{cssText:"",display:"none"},disabled:false,parentNode:null,setAttribute:function(){}};return store[id];}',
    'var document={getElementById:el,body:{appendChild:function(n){n.parentNode=this;}},createElement:function(){return el("nciToast");}};'
  ].join('');
  return new Function('return (async function(){'+prelude+src+';await submitCreateAide();return {posted:posted,modalClosed:modalClosed,err:document.getElementById("addAideErr"),toast:document.getElementById("nciToast"),name:document.getElementById("addAideFullName").value,user:document.getElementById("addAideUsername").value,btn:document.getElementById("createAideBtn")};})();')();
}

Promise.all([runSubmitPrecheck(),runSubmitAceCollision()]).then(function(results){
  const pre=results[0];
  const ace=results[1];
  assert.strictEqual(pre.posted,0,'pre-check must not POST a taken username');
  assert.strictEqual(pre.modalClosed,false,'modal stays open on collision');
  assert.strictEqual(pre.err.textContent,'Username already taken');
  assert.strictEqual(pre.err.style.display,'block');
  assert.ok(pre.toast.style.cssText.indexOf('#b91c1c')>=0);
  assert.strictEqual(pre.name,'Jane Doe','name stays filled');
  assert.strictEqual(pre.user,'jdoe','username stays filled (normalized)');
  assert.strictEqual(pre.btn.disabled,false,'Create stays enabled');
  assert.strictEqual(ace.posted,1,'Ace collision still POSTs when list is empty');
  assert.strictEqual(ace.modalClosed,false,'Ace collision must not close the modal');
  assert.strictEqual(ace.err.textContent,'Username already taken','Ace error must paint #addAideErr');
  assert.ok(ace.toast.style.cssText.indexOf('#b91c1c')>=0,'Ace collision toast uses #b91c1c');
  assert.strictEqual(ace.name,'Jane Doe');
  assert.strictEqual(ace.user,'jdoe');
  assert.strictEqual(ace.btn.disabled,false);
  assert.strictEqual(ace.btn.textContent,'Create aide');
  console.log('admin-add-aide-test: ok');
}).catch(function(e){
  console.error(e);
  process.exit(1);
});
