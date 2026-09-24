#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ORG = '4f97f4d3-6635-4544-904c-6b06aa02d40b';
const anon = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
const url = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];

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

assert.ok(html.includes("const EVERCARE_ORG_ID='"+ORG+"';"), 'org id');
assert.ok(html.includes('inservice_results'), 'results table');
assert.ok(html.includes('inservice_topic_assignment'), 'assignment table');
assert.ok(html.includes('score_pct'), 'score field is score_pct');
assert.ok(!html.includes('lvaglmztnlnsrhlluayz'), 'abandoned project ref must not appear');
assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(!html.includes('evercare_sb_jwt'), 'inservice uses the auth session, not a second jwt key');
assert.ok(!html.includes('function sbRememberAdminJwt'), 'no parallel token store');

const clearSrc = extractFn(html, 'async function sbClearAssignedTopic(topicId)');
const upsertSrc = extractFn(html, 'async function sbUpsertAssignment(topicId,aideUsernames)');
const archiveSrc = extractFn(html, 'async function sbArchiveInserviceResult(id)');
assert.ok(clearSrc && !/inservice_results/.test(clearSrc), 'clear assignment helper must not touch results');
assert.ok(upsertSrc && !/inservice_results/.test(upsertSrc), 'assignment upsert must not touch results');
assert.ok(/status:'Archived'/.test(archiveSrc), 'archive sets status Archived');
assert.ok(!/method:\s*'DELETE'/.test(archiveSrc+clearSrc+upsertSrc), 'no hard delete');

const sheetsClear = extractFn(html, 'async function clearAssignment()');
assert.ok(sheetsClear.includes("action:'clear_assigned_topic'"), 'flag-off clear still posts Sheets');
assert.ok(!/inservice_results/.test(sheetsClear), 'Sheets clear function must not name results table');
assert.ok(sheetsClear.includes('evercareSbEnabled()'), 'topic id is attached only when the sb flag is on');
assert.ok(sheetsClear.includes('payload.topicId=String(sel.value)'), 'sb clear sends the selected topic id');
assert.ok(extractFn(html, 'function sbAssignTopicQuery()').includes('isAssignTopicTouched'), 'refresh follows the topic the user selected');

const apiPost = extractFn(html, 'async function apiPost(payload)');
assert.ok(apiPost.indexOf('evercareSbEnabled()') < apiPost.indexOf('SHEETS_URL'), 'flag check precedes Sheets');
assert.ok(apiPost.includes("sbInserviceDispatch(payload)"), 'flag on dispatches inservice actions');

const names = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'async function sbRefreshSession(sess)',
  'async function sbRestGet(table, pairs, refreshed)',
  'function sbInserviceAction(action)',
  'function sbOrgId()',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed)',
  'function sbMapInserviceRow(r)',
  'function sbGradeInservice(topicId,answers)',
  'async function sbListInserviceResults()',
  'async function sbGetInserviceResult(id)',
  'async function sbArchiveInserviceResult(id)',
  'async function sbUpdateInserviceAnswers(id,answers)',
  'function sbUsernameList(raw)',
  'function sbMergeAideUsernames(existing,incoming)',
  'function sbParseAssignmentMap(row)',
  'function sbParseAssignmentRows(rows)',
  'function sbAssignmentWriteBody(map,focusTopicId)',
  'function sbProjectAssignment(map,topicId,focusTopicId)',
  'function sbMapAssignment(row)',
  'async function sbFetchAssignmentRow()',
  'function sbAssignmentMapFromFetch(got)',
  'async function sbPostAssignment(body)',
  'async function sbGetAssignedTopic(topicId)',
  'async function sbUpsertAssignment(topicId,aideUsernames)',
  'async function sbSetAssignedTopic(topicId)',
  'async function sbAssignSelectedAides(topicId,aideUsernames)',
  'async function sbClearAssignedTopic(topicId)',
  'async function sbInserviceDispatch(payload)',
  'async function apiPost(payload)'
];
names.forEach(function(sig){assert.ok(extractFn(html, sig), 'missing '+sig);});

function harness(opts){
  const calls = [];
  const mem = Object.assign({}, opts.storage || {});
  const box = {
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anon,
    EVERCARE_ORG_ID: ORG,
    SHEETS_URL: 'https://script.google.com/macros/s/TEST/exec',
    GAS_HEADERS: {'Content-Type':'text/plain;charset=utf-8'},
    SB_SESSION_KEY: 'evercare_sb_session',
    INSERVICES: opts.topics || [{
      id:1,
      title:'Complications of Diabetes: Prevention and Care',
      shortTitle:'Diabetes Complications',
      questions:[
        {q:'Q1', options:['a','b','c','d'], answer:1},
        {q:'Q2', options:['c','d'], answer:0}
      ]
    }],
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k,v){mem[k]=String(v);}
    },
    window: opts.window || {},
    fetch: function(fetchUrl, init){
      calls.push({url:String(fetchUrl), init:init});
      if(opts.reject)return Promise.reject(opts.reject);
      const res = (opts.route || function(){return {ok:true, status:200, raw:'[]'};})(String(fetchUrl), init);
      return Promise.resolve({
        ok: res.ok !== false,
        status: res.status || 200,
        text: function(){return Promise.resolve(res.raw == null ? '' : res.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Number: Number,
    Array: Array,
    Object: Object,
    Promise: Promise,
    encodeURIComponent: encodeURIComponent,
    isNaN: isNaN,
    Math: Math
  };
  vm.createContext(box);
  vm.runInContext(names.map(function(sig){return extractFn(html, sig);}).join('\n'), box);
  return {box:box, calls:calls, mem:mem};
}

function sessionWindow(){
  return {__sbSession:{access_token:'admin-jwt', refresh_token:'refresh-1', profile:{org_id:ORG}}};
}

(async function(){
  const off = harness({search:''});
  const offData = await off.box.apiPost({action:'get_inservices'});
  assert.strictEqual(off.calls.length, 1, 'flag off makes one Sheets call');
  assert.ok(off.calls[0].url.indexOf('script.google.com')>=0, 'flag off stays on /exec');
  assert.ok(off.calls[0].url.indexOf('supabase.co')<0, 'flag off does not call supabase');
  assert.strictEqual(JSON.parse(off.calls[0].init.body).action, 'get_inservices');
  assert.deepStrictEqual(offData, []);

  const stored = harness({storage:{evercare_sb:'1'}});
  stored.calls.length = 0;
  await stored.box.apiPost({action:'get_activity_log'});
  assert.ok(stored.calls[0].url.indexOf('script.google.com')>=0, 'non-inservice actions stay on Sheets');
  assert.strictEqual(stored.calls.filter(function(c){return c.url.indexOf('supabase.co')>=0;}).length, 0);

  const missing = harness({search:'?sb=1'});
  const miss = await missing.box.apiPost({action:'get_inservices'});
  assert.strictEqual(miss.success, false);
  assert.ok(/not signed in/i.test(miss.error));
  assert.strictEqual(missing.calls.length, 0, 'no jwt means no rest call');

  const row = {
    id:'11111111-1111-1111-1111-111111111111',
    legacy_id:'1750000000000',
    username:'aide1',
    emp_name:'Asha Aide',
    topic_id:'1',
    topic_title:'Complications of Diabetes: Prevention and Care',
    answers:[1,0],
    signature:'signed',
    score_correct:2,
    score_total:2,
    score_pct:100,
    graded_detail:{scoreCorrect:2,scoreTotal:2,scorePct:100,items:[{index:0,prompt:'Q1',isCorrect:true}]},
    completed:'Aug 2, 2026',
    status:'Active',
    submitted_at:'2026-08-02T01:42:29.000Z'
  };
  const archived = Object.assign({}, row, {id:'22222222-2222-2222-2222-222222222222', status:'Archived', username:'old'});

  const on = harness({
    search:'?sb=1',
    window:sessionWindow(),
    route: function(){
      return {ok:true, status:200, raw: JSON.stringify([row, archived])};
    }
  });
  const listed = await on.box.apiPost({action:'get_inservices'});
  assert.strictEqual(listed.success, true);
  assert.strictEqual(listed.data.length, 1, 'archived rows stay off the list');
  assert.strictEqual(listed.data[0].scorePct, 100);
  assert.strictEqual(listed.data[0].score_pct, 100);
  assert.strictEqual(listed.data[0].empName, 'Asha Aide');
  assert.strictEqual(listed.data[0].topicId, '1');
  assert.strictEqual(listed.data[0].completedAt, '2026-08-02T01:42:29.000Z');
  assert.ok(on.calls[0].url.indexOf('/rest/v1/inservice_results?')===url.length);
  assert.ok(on.calls[0].url.indexOf('score_pct')>=0);
  assert.ok(on.calls[0].url.indexOf('status=eq.Active')>=0);
  assert.ok(on.calls[0].url.indexOf('order=submitted_at.desc')>=0);
  assert.ok(on.calls[0].url.indexOf('org_id=eq.'+ORG)>=0);
  assert.strictEqual(on.calls[0].init.method, 'GET');
  assert.strictEqual(on.calls[0].init.headers.apikey, anon);
  assert.strictEqual(on.calls[0].init.headers.Authorization, 'Bearer admin-jwt');
  assert.ok(!on.calls[0].url.includes('inservice_topic_assignment'));

  const empty = harness({
    search:'?sb=1&x=1',
    window:sessionWindow(),
    route: function(u){
      if(u.indexOf('inservice_topic_assignment')>=0)return {ok:true, status:200, raw:'[]'};
      return {ok:true, status:200, raw:'[]'};
    }
  });
  const emptyList = await empty.box.apiPost({action:'get_inservices'});
  assert.strictEqual(JSON.stringify(emptyList), JSON.stringify({success:true, data:[]}));
  const emptyAssign = await empty.box.apiPost({action:'get_assigned_topic'});
  assert.strictEqual(JSON.stringify(emptyAssign), JSON.stringify({success:true, topicId:null, aideUsernames:null, assignAll:false}));

  const viewed = harness({
    search:'?sb=1',
    window:sessionWindow(),
    route: function(){return {ok:true, status:200, raw: JSON.stringify([row])};}
  });
  const one = await viewed.box.apiPost({action:'get_inservice_result', id:row.id});
  assert.strictEqual(one.success, true);
  assert.strictEqual(one.id, row.id);
  assert.strictEqual(one.scorePct, 100);
  assert.ok(Array.isArray(one.items) && one.items.length===1);
  assert.ok(viewed.calls[0].url.indexOf('id=eq.'+row.id)>=0);
  assert.ok(viewed.calls[0].url.indexOf('select=*')>=0);

  let assignment = null;
  const assign = harness({
    search:'?sb=1',
    storage:{evercare_sb:'1'},
    window:sessionWindow(),
    route: function(u, init){
      if(init.method==='GET' && u.indexOf('inservice_topic_assignment')>=0){
        return {ok:true, status:200, raw: assignment ? JSON.stringify([assignment]) : '[]'};
      }
      if(init.method==='POST' && u.indexOf('inservice_topic_assignment')>=0){
        assignment = JSON.parse(init.body);
        return {ok:true, status:201, raw: JSON.stringify([assignment])};
      }
      if(init.method==='GET' && u.indexOf('inservice_results')>=0){
        return {ok:true, status:200, raw: JSON.stringify([row])};
      }
      if(init.method==='PATCH' && u.indexOf('inservice_results')>=0){
        const body = JSON.parse(init.body);
        return {ok:true, status:200, raw: JSON.stringify([Object.assign({}, row, body)])};
      }
      return {ok:false, status:500, raw: JSON.stringify({message:'unexpected '+init.method+' '+u})};
    }
  });

  const all = await assign.box.apiPost({action:'set_assigned_topic', topicId:'1'});
  assert.strictEqual(all.success, true);
  assert.strictEqual(all.assignAll, true);
  assert.strictEqual(all.topicId, '1');
  assert.strictEqual(all.aideUsernames, null);
  const setCall = assign.calls.filter(function(c){return c.init.method==='POST';}).pop();
  assert.ok(setCall.url.indexOf('inservice_topic_assignment?on_conflict=org_id')>=0);
  assert.deepStrictEqual(JSON.parse(setCall.init.body), {org_id:ORG, topic_id:'1', aide_usernames:null});
  assert.ok(setCall.init.headers.Prefer.indexOf('resolution=merge-duplicates')>=0);
  assert.ok(assign.calls.every(function(c){return c.url.indexOf('inservice_results')<0;}), 'assign all does not touch results');

  assign.calls.length = 0;
  const selected = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'1', aideUsernames:['aide2','Aide2']});
  assert.strictEqual(selected.assignAll, false);
  assert.strictEqual(JSON.stringify(selected.aideUsernames), JSON.stringify(['aide2']));
  const selBody = JSON.parse(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().init.body);
  assert.deepStrictEqual(selBody.aide_usernames, ['aide2']);
  assert.ok(assign.calls.some(function(c){return c.init.method==='GET' && c.url.indexOf('inservice_topic_assignment')>=0;}), 'selected assign reads the row first');

  assign.calls.length = 0;
  assignment = {org_id:ORG, topic_id:'1', aide_usernames:['Aide1']};
  const merged = await assign.box.apiPost({action:'assign_inservice_aides', topicId:1, aideUsernames:['aide1','aide2']});
  assert.strictEqual(JSON.stringify(merged.aideUsernames), JSON.stringify(['Aide1','aide2']));

  assign.calls.length = 0;
  assignment = {org_id:ORG, topic_id:'1', aide_usernames:null};
  const fromAll = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'1', aideUsernames:['newhire']});
  assert.strictEqual(JSON.stringify(fromAll.aideUsernames), JSON.stringify(['newhire']), 'null means ALL and must not be merged as a list');
  assert.strictEqual(fromAll.assignAll, false);

  assign.calls.length = 0;
  const cleared = await assign.box.apiPost({action:'clear_assigned_topic'});
  assert.strictEqual(cleared.success, true);
  assert.strictEqual(cleared.topicId, null);
  const clearCalls = assign.calls.slice();
  assert.ok(clearCalls.length>=1);
  assert.ok(clearCalls.every(function(c){return c.url.indexOf('inservice_results')<0;}), 'clear must never touch inservice_results');
  const clearBody = JSON.parse(clearCalls.filter(function(c){return c.init.method==='POST';})[0].init.body);
  assert.deepStrictEqual(clearBody, {org_id:ORG, topic_id:null, aide_usernames:null});
  assert.ok(!clearCalls.some(function(c){return c.init.method==='DELETE';}));

  assign.calls.length = 0;
  assignment = {org_id:ORG, topic_id:'1', aide_usernames:['bbj']};
  const topicB = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'2', aideUsernames:['bowlax19']});
  assert.strictEqual(topicB.success, true);
  assert.strictEqual(topicB.topicId, '2');
  assert.strictEqual(JSON.stringify(topicB.aideUsernames), JSON.stringify(['bowlax19']));
  assert.strictEqual(topicB.assignAll, false);
  const multiBody = JSON.parse(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().init.body);
  assert.strictEqual(multiBody.org_id, ORG);
  assert.strictEqual(multiBody.topic_id, '2');
  assert.strictEqual(multiBody.aide_usernames.v, 2);
  assert.deepStrictEqual(multiBody.aide_usernames.topics['1'], {aides:['bbj']});
  assert.deepStrictEqual(multiBody.aide_usernames.topics['2'], {aides:['bowlax19']});
  assert.ok(assign.calls.every(function(c){return c.url.indexOf('inservice_results')<0&&c.init.method!=='DELETE';}), 'second topic assign does not delete or touch results');

  assign.calls.length = 0;
  const stillA = await assign.box.apiPost({action:'get_assigned_topic', topicId:'1'});
  assert.strictEqual(stillA.topicId, '1');
  assert.strictEqual(JSON.stringify(stillA.aideUsernames), JSON.stringify(['bbj']));
  assert.strictEqual(stillA.assignAll, false);
  const stillB = await assign.box.apiPost({action:'get_assigned_topic', topicId:'2'});
  assert.strictEqual(JSON.stringify(stillB.aideUsernames), JSON.stringify(['bowlax19']));

  assign.calls.length = 0;
  const clearA = await assign.box.apiPost({action:'clear_assigned_topic', topicId:'1'});
  assert.strictEqual(clearA.success, true);
  assert.strictEqual(clearA.topicId, null);
  const clearAPosts = assign.calls.filter(function(c){return c.init.method==='POST';});
  assert.strictEqual(clearAPosts.length, 1);
  assert.deepStrictEqual(JSON.parse(clearAPosts[0].init.body), {org_id:ORG, topic_id:'2', aide_usernames:['bowlax19']});
  assert.ok(assign.calls.every(function(c){return c.url.indexOf('inservice_results')<0&&c.init.method!=='DELETE';}), 'scoped clear does not delete or touch results');
  const afterClearA = await assign.box.apiPost({action:'get_assigned_topic', topicId:'1'});
  assert.strictEqual(afterClearA.topicId, null);
  assert.strictEqual(afterClearA.assignAll, false);
  const keptB = await assign.box.apiPost({action:'get_assigned_topic', topicId:'2'});
  assert.strictEqual(keptB.topicId, '2');
  assert.strictEqual(JSON.stringify(keptB.aideUsernames), JSON.stringify(['bowlax19']));

  assign.calls.length = 0;
  const allOther = await assign.box.apiPost({action:'set_assigned_topic', topicId:'3'});
  assert.strictEqual(allOther.assignAll, true);
  assert.strictEqual(allOther.topicId, '3');
  const allBody = JSON.parse(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().init.body);
  assert.strictEqual(allBody.aide_usernames.v, 2);
  assert.deepStrictEqual(allBody.aide_usernames.topics['2'], {aides:['bowlax19']});
  assert.deepStrictEqual(allBody.aide_usernames.topics['3'], {aides:null});
  const clearOther = await assign.box.apiPost({action:'clear_assigned_topic', topicId:'3'});
  assert.strictEqual(clearOther.topicId, null);
  assert.deepStrictEqual(assignment, {org_id:ORG, topic_id:'2', aide_usernames:['bowlax19']});
  const afterOther = await assign.box.apiPost({action:'get_assigned_topic', topicId:'2'});
  assert.strictEqual(JSON.stringify(afterOther.aideUsernames), JSON.stringify(['bowlax19']));

  assign.calls.length = 0;
  const saved = await assign.box.apiPost({action:'admin_update_inservice_answers', id:row.id, answers:[0,0]});
  assert.strictEqual(saved.success, true);
  assert.strictEqual(saved.score_pct, 50);
  assert.strictEqual(saved.scorePct, 50);
  assert.strictEqual(saved.scoreCorrect, 1);
  assert.strictEqual(saved.scoreTotal, 2);
  const patch = assign.calls.filter(function(c){return c.init.method==='PATCH';}).pop();
  const patchBody = JSON.parse(patch.init.body);
  assert.deepStrictEqual(patchBody.answers, [0,0]);
  assert.strictEqual(patchBody.score_pct, 50);
  assert.strictEqual(patchBody.score_correct, 1);
  assert.strictEqual(patchBody.score_total, 2);
  assert.strictEqual(patchBody.graded_detail.scorePct, 50);
  assert.strictEqual(patchBody.graded_detail.items.length, 2);
  assert.ok(!Object.prototype.hasOwnProperty.call(patchBody, 'scorePercent'));
  assert.ok(patch.url.indexOf('inservice_results')>=0);

  assign.calls.length = 0;
  const archivedOk = await assign.box.apiPost({action:'delete_inservice_result', id:row.id});
  assert.strictEqual(archivedOk.success, true);
  assert.strictEqual(archivedOk.status, 'Archived');
  const arch = assign.calls.filter(function(c){return c.init.method==='PATCH';}).pop();
  assert.deepStrictEqual(JSON.parse(arch.init.body), {status:'Archived'});
  assert.ok(arch.url.indexOf('inservice_results')>=0);
  assert.ok(!assign.calls.some(function(c){return c.init.method==='DELETE'||c.url.indexOf('inservice_topic_assignment')>=0;}));

  const alias = await assign.box.apiPost({action:'archive_inservice_result', id:row.id});
  assert.strictEqual(alias.success, true);
  assert.deepStrictEqual(JSON.parse(assign.calls.filter(function(c){return c.init.method==='PATCH';}).pop().init.body), {status:'Archived'});

  const uiNames = [
    'function evercareSbEnabled()',
    'async function clearAssignment()',
    'function isAssignSheetsFailMsg(data,err)'
  ];
  function uiBox(search, topicValue){
    const posts = [];
    const box = {
      location: {search: search},
      localStorage: {getItem: function(){return null;}},
      document: {getElementById: function(id){
        if(id==='assignTopicSel')return {value: topicValue};
        return null;
      }},
      showTempMsg: function(){},
      cacheInvalidate: function(){},
      renderInservices: function(){},
      apiPost: function(payload){posts.push(payload); return Promise.resolve({success:true, topicId:null});},
      evercareSbEnabled: null
    };
    vm.createContext(box);
    vm.runInContext(uiNames.map(function(sig){return extractFn(html, sig);}).join('\n'), box);
    return {box:box, posts:posts};
  }
  const sheetsUi = uiBox('', '1');
  await sheetsUi.box.clearAssignment();
  assert.strictEqual(JSON.stringify(sheetsUi.posts[0]), JSON.stringify({action:'clear_assigned_topic'}), 'flag off clear has no topic id');
  const sbUi = uiBox('?sb=1', '1');
  await sbUi.box.clearAssignment();
  assert.strictEqual(JSON.stringify(sbUi.posts[0]), JSON.stringify({action:'clear_assigned_topic', topicId:'1'}), 'flag on clear sends the selected topic only');
  const sbUiB = uiBox('?sb=1', '2');
  await sbUiB.box.clearAssignment();
  assert.strictEqual(sbUiB.posts[0].topicId, '2');

  console.log('inservice-sb-dual-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
