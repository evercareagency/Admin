#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ORG = '4f97f4d3-6635-4544-904c-6b06aa02d40b';
const OTHER_ORG = '11111111-1111-4111-8111-111111111111';
const anon = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
const url = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const sheetsUrl = (html.match(/const SHEETS_URL='([^']+)'/) || [])[1];

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
function between(startSig, endSig){
  const start = html.indexOf(startSig);
  const end = html.indexOf(endSig, start + startSig.length);
  assert.ok(start >= 0 && end > start, startSig);
  return html.slice(start, end);
}

assert.ok(html.includes('GHOST-ADMIN-WRITE-DUALS-CONTRACT-v1'), 'contract is named in the tip');
assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(html.includes(anon), 'anon key stays the embedded jwt');
assert.ok(html.includes("const EVERCARE_ORG_ID='"+ORG+"';"), 'org id');
assert.ok(!html.includes('rpc/complete_aide_setup'), 'caregiver setup stays off this tip');
assert.ok(!html.includes("from('aides').insert") && !html.includes("POST','aides'"), 'aides are created through the Ace RPC');

const apiPost = extractFn(html, 'async function apiPost(payload)');
assert.ok(apiPost.indexOf('sbIsAdminWriteAction') < apiPost.indexOf('fetch(SHEETS_URL'), 'admin writes branch before sheets');
assert.ok(apiPost.includes('sbAdminWriteDispatch(payload)'), 'admin writes delegate');
assert.ok(apiPost.includes('typeof sbIsAdminWriteAction'), 'missing helper must not throw');

const saveEdits = between('function saveEdits(){', 'function showCorrectionPanel()');
const sendCorrFn = between('async function sendCorrectionRequest(){', 'function quickDelete(id)');
const quickDelete = between('function quickDelete(id){', 'function deleteRec()');
assert.ok(saveEdits.includes('sbAdminWriteDispatch'), 'flag-on save edits uses the dispatcher');
assert.ok(saveEdits.includes("fetch(SHEETS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'update',id:currentRec.id,emp_name:currentRec.empName,client_name:currentRec.clientName,total_hours:currentRec.totalHrs,notes:currentRec.notes,days:currentRec.days||{}})}).catch(()=>{});"), 'flag-off timesheet update fetch is unchanged');
assert.ok(saveEdits.indexOf('sbAdminWriteDispatch') < saveEdits.indexOf('fetch(SHEETS_URL'), 'supabase return happens before the sheets fetch');
assert.ok(sendCorrFn.includes("action:'send_correction'"), 'correction action name stays');
assert.ok(sendCorrFn.includes("fetch(SHEETS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'send_correction',id:currentRec.id,correctionDays,correctionNote:note})})"), 'flag-off send_correction fetch is unchanged');
assert.ok(quickDelete.includes("fetch(SHEETS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'delete',id})}).catch(()=>{});"), 'flag-off timesheet delete fetch is unchanged');
assert.ok(quickDelete.includes("sbAdminWriteDispatch({action:'delete',id:id})"), 'flag-on delete is a soft delete dispatch');
assert.ok(!/method:\s*'DELETE'/.test(extractFn(html, 'async function sbAdminSoftDeleteTimesheet(payload)')), 'timesheet delete is not a hard DELETE');
assert.ok(!/method:\s*'DELETE'/.test(extractFn(html, 'async function sbAdminArchiveClient(payload)')), 'client archive is not a hard DELETE');
assert.ok(extractFn(html, 'async function sbAdminUpdateTimesheet(payload)').includes("sbRestMutate('PATCH','timesheets'"), 'timesheet update patches by id');
assert.ok(!extractFn(html, 'async function sbAdminUpdateTimesheet(payload)').includes('week_start'), 'update must not write the week key');
assert.ok(extractFn(html, 'async function sbUpsertAssignment(aideId, clientId)').includes("['on_conflict','org_id,aide_id,client_id']"), 'assignments upsert on the natural key');
assert.ok(extractFn(html, 'async function sbAdminSendCorrection(payload)').includes("status:'correction_requested'"), 'correction status');
assert.ok(extractFn(html, 'async function sbAdminSendCorrection(payload)').includes('correction_days'), 'correction days');
assert.ok(extractFn(html, 'async function sbAdminSendCorrection(payload)').includes('correction_note'), 'correction note');

const names = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'function sbActiveLinks(rows)',
  'function sbMapClient(row)',
  'function sbMapTimesheet(row)',
  'function sbFirstRow(data)',
  'function sbUuid(v)',
  'function sbOrgId()',
  'async function sbRefreshSession(sess)',
  'async function sbRestGet(table, pairs, refreshed)',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed)',
  'function looksLikeUsernameTaken(text)',
  'function nciLooksLikeUnknownAction(text)',
  'async function postAideAction(primary,alias,payload)',
  'function sbIsAdminWriteAction(action)',
  'function sbOptionalText(v)',
  'function sbNormalizeWriteError(msg)',
  'function sbUuidList(raw)',
  'function sbCoord(v)',
  'function sbSameUser(a,b)',
  'function sbUsernameIn(list, name)',
  'async function sbRestRpc(fnName, body)',
  'function sbMapAideAuth(data)',
  'async function sbAdminCreateAide(payload)',
  'async function sbAdminResetTempPassword(payload)',
  'function sbKnownAides()',
  'async function sbResolveAideId(token)',
  'async function sbUpsertAssignment(aideId, clientId)',
  'async function sbSoftUnassign(aideId, clientId)',
  'async function sbActiveAssignmentRows(clientId)',
  'async function sbSyncClientAssignments(clientId, nextNames, currentRows)',
  'function sbClientWriteBody(payload, isCreate)',
  'function sbAssignedNames(payload)',
  'async function sbAdminAddClient(payload)',
  'async function sbAdminUpdateClient(payload)',
  'async function sbAdminArchiveClient(payload)',
  'async function sbAdminUpdateTimesheet(payload)',
  'async function sbAdminSendCorrection(payload)',
  'async function sbAdminSoftDeleteTimesheet(payload)',
  'async function sbAdminWriteDispatch(payload)',
  'async function apiPost(payload)'
];
const fns = names.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const clientId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';
const aideA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const aideB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
const aideC = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4';
const tsId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5';

function harness(opts){
  const calls = [];
  const mem = Object.assign({}, opts.storage || {});
  const queue = (opts.responses || []).slice();
  const box = {
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anon,
    SHEETS_URL: sheetsUrl,
    EVERCARE_ORG_ID: ORG,
    SB_SESSION_KEY: 'evercare_sb_session',
    GAS_HEADERS: {'Content-Type':'text/plain;charset=utf-8'},
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    window: {},
    fetch: function(fetchUrl, init){
      calls.push({url: fetchUrl, init: init || {}});
      let res = null;
      if(opts.route)res = opts.route(fetchUrl, init || {}, calls);
      if(!res)res = queue.length ? queue.shift() : {ok:true, status:200, raw:'{"success":true}'};
      if(res && res.reject)return Promise.reject(res.reject);
      return Promise.resolve({
        ok: res.ok !== false && (res.status || 200) < 400,
        status: res.status || 200,
        text: function(){return Promise.resolve(res.raw == null ? '' : res.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    Date: Date,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
    Array: Array,
    Number: Number,
    isNaN: isNaN,
    isFinite: isFinite,
    allAidesForAssign: opts.aides || []
  };
  if(opts.session){
    mem.evercare_sb_session = JSON.stringify(opts.session);
    box.window.__sbSession = opts.session;
  }
  vm.createContext(box);
  vm.runInContext(fns, box);
  return {box: box, calls: calls, mem: mem};
}

function session(token, org){
  return {
    access_token: token || 'office-jwt',
    refresh_token: 'refresh-1',
    user: {id: 'admin-uid', email: 'admin@roles.evercare.local'},
    email: 'admin@roles.evercare.local',
    profile: {id: 'admin-uid', org_id: org || ORG, role: 'admin'}
  };
}
function decoded(u){return decodeURIComponent(String(u));}
function bodyOf(call){return JSON.parse(call.init.body);}
function params(u){return new URL(u).searchParams;}

const created = {
  ok: true,
  success: true,
  username: 'jdoe',
  full_name: 'Jane Doe',
  email: 'jdoe@users.evercare.local',
  aide_id: aideA,
  profile_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  must_change_password: true,
  temp_password: 'EcServerOnce',
  assigned_count: 1
};
const clientRow = {
  id: clientId,
  legacy_id: '1700000000000',
  name: 'Ann Client',
  address: '123 Main',
  lat: 41.5,
  lng: -81.6,
  is_active: true,
  org_id: ORG
};

(async function(){
  const offPayloads = [
    {action:'admin_create_aide', username:'jdoe', name:'Jane Doe', fullName:'Jane Doe', tempPassword:'EcLocal99', clientIds:[clientId]},
    {action:'create_aide', username:'jdoe', name:'Jane Doe', fullName:'Jane Doe', tempPassword:'EcLocal99', clientIds:[]},
    {action:'reset_temp_password', username:'jdoe', tempPassword:'EcLocal99'},
    {action:'reset_aide_temp_password', username:'jdoe', tempPassword:'EcLocal99'},
    {action:'add_client', name:'Ann Client', address:'123 Main', lat:'41.5', lng:'-81.6', assignedAides:['jdoe']},
    {action:'update_client', id:clientId, name:'Ann Client', address:'123 Main', lat:'', lng:'', assignedAides:['jdoe']},
    {action:'archive_client', clientId:clientId},
    {action:'delete_client', id:clientId},
    {action:'update', id:'sheet-1', emp_name:'Jane', client_name:'Ann', total_hours:'8:00', notes:'n', days:{'0':{tin:'08:00'}}},
    {action:'send_correction', id:'sheet-1', correctionDays:[0,2], correctionNote:'fix Monday'},
    {action:'delete', id:'sheet-1'},
    {action:'complete_aide_setup', username:'jdoe'},
    {action:'log_activity', role:'Admin', activity:'Created aide @jdoe'}
  ];
  for(let i=0;i<offPayloads.length;i++){
    const payload = offPayloads[i];
    const off = harness({search:'', responses:[{status:200, raw:JSON.stringify({success:true})}]});
    const data = await off.box.apiPost(payload);
    assert.strictEqual(data.success, true, payload.action);
    assert.strictEqual(off.calls.length, 1, payload.action+' flag off is one sheets call');
    assert.strictEqual(off.calls[0].url, sheetsUrl, payload.action);
    assert.strictEqual(off.calls[0].init.method, 'POST');
    assert.strictEqual(off.calls[0].init.headers['Content-Type'], 'text/plain;charset=utf-8');
    assert.deepStrictEqual(bodyOf(off.calls[0]), payload, payload.action+' body unchanged');
    assert.ok(off.calls[0].url.indexOf('/exec') > 0, payload.action);
  }

  const storageOn = harness({
    search:'',
    storage:{evercare_sb:'1'},
    session:session(),
    responses:[{status:200, raw:JSON.stringify(created)}]
  });
  const viaStorage = await storageOn.box.apiPost({action:'create_aide', username:'jdoe', name:'Jane Doe', fullName:'Jane Doe', tempPassword:'EcLocal99', clientIds:[]});
  assert.strictEqual(viaStorage.success, true);
  assert.ok(storageOn.calls[0].url.indexOf('/rest/v1/rpc/admin_create_aide') > 0, 'localStorage flag uses the RPC');
  assert.ok(!storageOn.calls.some(function(c){return c.url === sheetsUrl;}), 'localStorage flag must not hit sheets');

  const noJwt = harness({search:'?sb=1'});
  const missing = await noJwt.box.apiPost({action:'admin_create_aide', username:'jdoe', fullName:'Jane Doe', tempPassword:'EcLocal99'});
  assert.strictEqual(missing.success, false);
  assert.strictEqual(missing.error, 'Not signed in');
  assert.strictEqual(noJwt.calls.length, 0, 'missing office jwt must not fall through to sheets');

  const aides = [
    {id:aideA, username:'jdoe'},
    {id:aideB, username:'asmith'},
    {id:aideC, username:'bjones'}
  ];
  const on = harness({
    search:'?sb=1',
    session:session('nurse-jwt', OTHER_ORG),
    aides: aides,
    route: function(fetchUrl, init){
      const u = decoded(fetchUrl);
      if(u.indexOf('/rest/v1/rpc/admin_create_aide') > 0){
        return {status:200, raw:JSON.stringify(created)};
      }
      if(u.indexOf('/rest/v1/rpc/reset_aide_temp_password') > 0){
        return {status:200, raw:JSON.stringify(Object.assign({}, created, {temp_password:'EcResetOnce', assigned_count:0}))};
      }
      if(init.method==='POST' && u.indexOf('/rest/v1/clients') > 0){
        const sent = JSON.parse(init.body);
        return {status:201, raw:JSON.stringify([Object.assign({id:clientId}, sent)])};
      }
      if(init.method==='PATCH' && u.indexOf('/rest/v1/clients') > 0){
        const sent = JSON.parse(init.body);
        return {status:200, raw:JSON.stringify([Object.assign({id:clientId, org_id:OTHER_ORG}, sent)])};
      }
      if(init.method==='GET' && u.indexOf('/rest/v1/assignments') > 0){
        return {status:200, raw:JSON.stringify([
          {id:'as-1', aide_id:aideA, is_active:true, aide:{id:aideA, username:'jdoe'}},
          {id:'as-2', aide_id:aideB, is_active:true, aide:{id:aideB, username:'asmith'}}
        ])};
      }
      if(init.method==='POST' && u.indexOf('/rest/v1/assignments') > 0){
        return {status:201, raw:JSON.stringify([JSON.parse(init.body)])};
      }
      if(init.method==='PATCH' && u.indexOf('/rest/v1/assignments') > 0){
        return {status:200, raw:JSON.stringify([Object.assign({id:'as-2'}, JSON.parse(init.body))])};
      }
      if(init.method==='PATCH' && u.indexOf('/rest/v1/timesheets') > 0){
        return {status:200, raw:JSON.stringify([Object.assign({
          id:tsId, emp_name:'Jane Doe', client_name:'Ann Client', total_hours:'8:00', notes:'n',
          days:{'0':{tin:'08:00'}}, status:'submitted', week_start:'2026-09-14', is_active:true
        }, JSON.parse(init.body))])};
      }
      return {status:500, raw:JSON.stringify({message:'unexpected '+init.method+' '+u})};
    }
  });

  const made = await on.box.apiPost({
    action:'admin_create_aide',
    username:'jdoe',
    name:'Jane Doe',
    fullName:'Jane Doe',
    tempPassword:'EcLocal99',
    clientIds:[clientId, 'sheet-row', clientId],
    phone:'216-555-0100'
  });
  assert.strictEqual(made.success, true);
  assert.strictEqual(made.tempPassword, 'EcServerOnce');
  assert.strictEqual(made.temp_password, 'EcServerOnce');
  assert.strictEqual(made.must_change_password, true);
  assert.strictEqual(made.mustChangePassword, true);
  assert.strictEqual(made.username, 'jdoe');
  assert.strictEqual(made.aideId, aideA);
  const createCall = on.calls[0];
  assert.strictEqual(createCall.init.method, 'POST');
  assert.ok(createCall.url.indexOf('?') < 0, createCall.url);
  assert.strictEqual(createCall.init.headers.apikey, anon);
  assert.strictEqual(createCall.init.headers.Authorization, 'Bearer nurse-jwt');
  assert.notStrictEqual(createCall.init.headers.Authorization, 'Bearer '+anon);
  assert.strictEqual(createCall.init.headers['Content-Type'], 'application/json');
  assert.ok(createCall.init.headers.Prefer.indexOf('return=representation') >= 0);
  assert.deepStrictEqual(bodyOf(createCall), {
    p_username:'jdoe',
    p_full_name:'Jane Doe',
    p_temp_password:'EcLocal99',
    p_email:null,
    p_client_ids:[clientId],
    p_joined_at:null
  });
  assert.ok(!Object.prototype.hasOwnProperty.call(bodyOf(createCall), 'phone'));
  assert.ok(!Object.prototype.hasOwnProperty.call(bodyOf(createCall), 'p_phone'));
  assert.ok(JSON.stringify(on.mem).indexOf('EcServerOnce') < 0, 'temp password is not written to storage');
  assert.ok(JSON.stringify(on.mem).indexOf('EcLocal99') < 0, 'client temp password is not written to storage');

  on.calls.length = 0;
  const reset = await on.box.postAideAction('reset_temp_password', 'reset_aide_temp_password', {username:'jdoe', tempPassword:'EcLocal99'});
  assert.strictEqual(reset.data.success, true);
  assert.strictEqual(reset.data.tempPassword, 'EcResetOnce');
  assert.strictEqual(reset.data.must_change_password, true);
  assert.strictEqual(reset.action, 'reset_temp_password');
  assert.strictEqual(on.calls.length, 1);
  assert.ok(on.calls[0].url.indexOf('/rest/v1/rpc/reset_aide_temp_password') > 0);
  assert.deepStrictEqual(bodyOf(on.calls[0]), {p_username:'jdoe', p_temp_password:'EcLocal99'});
  assert.strictEqual(on.calls[0].init.headers.Authorization, 'Bearer nurse-jwt');

  on.calls.length = 0;
  const aliasReset = await on.box.apiPost({action:'reset_aide_temp_password', username:'jdoe', tempPassword:'EcLocal99'});
  assert.strictEqual(aliasReset.success, true);
  assert.ok(on.calls[0].url.indexOf('/rest/v1/rpc/reset_aide_temp_password') > 0);

  on.calls.length = 0;
  const added = await on.box.apiPost({
    action:'add_client',
    name:'Ann Client',
    address:'123 Main',
    lat:'41.5',
    lng:'-81.6',
    assignedAides:['jdoe']
  });
  assert.strictEqual(added.success, true);
  assert.strictEqual(added.id, clientId);
  assert.strictEqual(on.calls.length, 2, 'insert client then upsert assignment');
  assert.ok(on.calls[0].url.indexOf('/rest/v1/clients') > 0);
  assert.strictEqual(on.calls[0].init.method, 'POST');
  const addBody = bodyOf(on.calls[0]);
  assert.strictEqual(addBody.org_id, OTHER_ORG, 'org comes from the office profile');
  assert.strictEqual(addBody.name, 'Ann Client');
  assert.strictEqual(addBody.address, '123 Main');
  assert.strictEqual(addBody.lat, 41.5);
  assert.strictEqual(addBody.lng, -81.6);
  assert.strictEqual(addBody.is_active, true);
  assert.ok(/^\d+$/.test(addBody.legacy_id), addBody.legacy_id);
  assert.ok(!Object.prototype.hasOwnProperty.call(addBody, 'assignedAides'));
  const upCall = on.calls[1];
  assert.strictEqual(upCall.init.method, 'POST');
  assert.ok(decoded(upCall.url).indexOf('/rest/v1/assignments?on_conflict=org_id,aide_id,client_id') > 0, decoded(upCall.url));
  assert.ok(upCall.init.headers.Prefer.indexOf('resolution=merge-duplicates') >= 0);
  assert.deepStrictEqual(bodyOf(upCall), {org_id:OTHER_ORG, aide_id:aideA, client_id:clientId, is_active:true});

  on.calls.length = 0;
  const updated = await on.box.apiPost({
    action:'update_client',
    id:clientId,
    name:'Ann Client',
    address:'9 Oak',
    lat:'',
    lng:'',
    assignedAides:['jdoe', 'bjones']
  });
  assert.strictEqual(updated.success, true);
  assert.strictEqual(on.calls[0].init.method, 'PATCH');
  assert.strictEqual(params(on.calls[0].url).get('id'), 'eq.'+clientId);
  assert.deepStrictEqual(bodyOf(on.calls[0]), {name:'Ann Client', address:'9 Oak', lat:null, lng:null});
  assert.ok(decoded(on.calls[1].url).indexOf('/rest/v1/assignments?') === decoded(on.calls[1].url).indexOf('/rest/v1/assignments'));
  assert.strictEqual(params(on.calls[1].url).get('client_id'), 'eq.'+clientId);
  assert.strictEqual(params(on.calls[1].url).get('is_active'), 'eq.true');
  assert.strictEqual(on.calls[2].init.method, 'PATCH');
  assert.deepStrictEqual(bodyOf(on.calls[2]), {is_active:false});
  assert.strictEqual(params(on.calls[2].url).get('aide_id'), 'eq.'+aideB);
  assert.strictEqual(params(on.calls[2].url).get('client_id'), 'eq.'+clientId);
  assert.strictEqual(on.calls[3].init.method, 'POST');
  assert.deepStrictEqual(bodyOf(on.calls[3]), {org_id:OTHER_ORG, aide_id:aideC, client_id:clientId, is_active:true});
  assert.ok(!on.calls.some(function(c){return c.init.method==='DELETE';}), 'assignments are soft-unassigned');

  on.calls.length = 0;
  const archived = await on.box.apiPost({action:'archive_client', clientId:clientId});
  assert.strictEqual(archived.success, true);
  assert.strictEqual(archived.active, false);
  assert.strictEqual(archived.clientId, clientId);
  assert.deepStrictEqual(bodyOf(on.calls[0]), {is_active:false});
  assert.strictEqual(on.calls[0].init.method, 'PATCH');
  on.calls.length = 0;
  const deletedClient = await on.box.apiPost({action:'delete_client', id:clientId});
  assert.strictEqual(deletedClient.success, true);
  assert.strictEqual(deletedClient.active, false);
  assert.deepStrictEqual(bodyOf(on.calls[0]), {is_active:false});

  on.calls.length = 0;
  const days = {'0':{tin:'08:00', tout:'16:00', hrs:'8:00'}};
  const ts = await on.box.apiPost({
    action:'update',
    id:tsId,
    emp_name:'Jane Doe',
    client_name:'Ann Client',
    total_hours:'8:00',
    notes:'edited',
    days:days,
    week_start:'2026-09-14',
    aide_id:aideA,
    client_id:clientId,
    org_id:OTHER_ORG
  });
  assert.strictEqual(ts.success, true);
  assert.strictEqual(on.calls.length, 1);
  assert.strictEqual(on.calls[0].init.method, 'PATCH');
  assert.ok(on.calls[0].url.indexOf('/rest/v1/timesheets?') > 0);
  assert.strictEqual(params(on.calls[0].url).get('id'), 'eq.'+tsId);
  assert.deepStrictEqual(bodyOf(on.calls[0]), {
    emp_name:'Jane Doe',
    client_name:'Ann Client',
    total_hours:'8:00',
    notes:'edited',
    days:days
  });

  on.calls.length = 0;
  const corr = await on.box.apiPost({
    action:'send_correction',
    id:tsId,
    correctionDays:[0, 2],
    correctionNote:'fix Monday'
  });
  assert.strictEqual(corr.success, true);
  assert.strictEqual(corr.status, 'correction_requested');
  assert.deepStrictEqual(bodyOf(on.calls[0]), {
    status:'correction_requested',
    correction_days:[0, 2],
    correction_note:'fix Monday'
  });
  assert.strictEqual(params(on.calls[0].url).get('id'), 'eq.'+tsId);
  assert.ok(!Object.prototype.hasOwnProperty.call(bodyOf(on.calls[0]), 'week_start'));

  on.calls.length = 0;
  const gone = await on.box.apiPost({action:'delete', id:tsId});
  assert.strictEqual(gone.success, true);
  assert.strictEqual(gone.is_active, false);
  assert.strictEqual(on.calls[0].init.method, 'PATCH');
  assert.deepStrictEqual(bodyOf(on.calls[0]), {is_active:false});
  assert.strictEqual(params(on.calls[0].url).get('id'), 'eq.'+tsId);

  const taken = harness({
    search:'?sb=1',
    session:session(),
    responses:[{status:409, ok:false, raw:JSON.stringify({code:'23505', message:'duplicate key value violates unique constraint "aides_org_username_uidx"'})}]
  });
  const collision = await taken.box.postAideAction('admin_create_aide', 'create_aide', {
    username:'jdoe', name:'Jane Doe', fullName:'Jane Doe', tempPassword:'EcLocal99', clientIds:[]
  });
  assert.strictEqual(collision.data.success, false);
  assert.strictEqual(collision.data.error, 'Username already taken');
  assert.strictEqual(collision.action, 'admin_create_aide');
  assert.strictEqual(taken.calls.length, 1, 'a taken username does not alias-retry or hit sheets');
  assert.ok(taken.calls[0].url.indexOf('/rest/v1/rpc/admin_create_aide') > 0);

  const rawTaken = harness({
    search:'?sb=1',
    session:session(),
    responses:[{status:400, ok:false, raw:JSON.stringify({message:'username taken'})}]
  });
  const raw = await rawTaken.box.apiPost({action:'admin_create_aide', username:'jdoe', fullName:'Jane Doe', tempPassword:'EcLocal99'});
  assert.strictEqual(raw.success, false);
  assert.strictEqual(raw.error, 'username taken');

  const refreshed = harness({
    search:'?sb=1',
    session:session(),
    responses:[
      {status:401, ok:false, raw:JSON.stringify({message:'JWT expired'})},
      {status:200, raw:JSON.stringify({access_token:'office-jwt-2', refresh_token:'refresh-2', expires_in:3600, expires_at:1999999999, token_type:'bearer', user:{id:'admin-uid', email:'admin@roles.evercare.local'}})},
      {status:200, raw:JSON.stringify(created)}
    ]
  });
  const after = await refreshed.box.apiPost({action:'admin_create_aide', username:'jdoe', fullName:'Jane Doe', name:'Jane Doe', tempPassword:'EcLocal99', clientIds:[]});
  assert.strictEqual(after.success, true);
  assert.ok(refreshed.calls[1].url.indexOf('/auth/v1/token?grant_type=refresh_token') > 0);
  assert.strictEqual(refreshed.calls[2].init.headers.Authorization, 'Bearer office-jwt-2');
  assert.strictEqual(JSON.parse(refreshed.mem.evercare_sb_session).access_token, 'office-jwt-2');
  assert.strictEqual(JSON.parse(refreshed.mem.evercare_sb_session).profile.org_id, ORG);

  const stillSheets = harness({
    search:'?sb=1',
    session:session(),
    responses:[
      {status:200, raw:JSON.stringify({success:true})},
      {status:200, raw:JSON.stringify({success:true})}
    ]
  });
  await stillSheets.box.apiPost({action:'complete_aide_setup', username:'jdoe'});
  await stillSheets.box.apiPost({action:'save_new_client_intake', clientName:'Ann'});
  assert.strictEqual(stillSheets.calls.length, 2);
  assert.ok(stillSheets.calls.every(function(c){return c.url === sheetsUrl;}));

  const profileOrg = harness({
    search:'?sb=1',
    session:session('office-jwt', null),
    responses:[{status:201, raw:JSON.stringify([{id:clientId, name:'Ann', address:'1', is_active:true}])}]
  });
  profileOrg.box.window.__sbSession = {access_token:'office-jwt', refresh_token:'refresh-1', profile:null};
  profileOrg.mem.evercare_sb_session = JSON.stringify(profileOrg.box.window.__sbSession);
  const fallback = await profileOrg.box.apiPost({action:'add_client', name:'Ann', address:'1', lat:'', lng:''});
  assert.strictEqual(fallback.success, true);
  assert.strictEqual(bodyOf(profileOrg.calls[0]).org_id, ORG, 'missing profile falls back to the live org id');

  console.log('admin-sb-writes-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
