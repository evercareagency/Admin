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
const clearRowSrc = extractFn(html, 'async function sbClearAssignedTopicRow(topicId)');
const upsertSrc = extractFn(html, 'async function sbUpsertTopicAssignment(topicId,aideUsernames)');
const archiveSrc = extractFn(html, 'async function sbArchiveInserviceResult(id)');
assert.ok(clearSrc && !/inservice_results/.test(clearSrc), 'clear assignment helper must not touch results');
assert.ok(clearRowSrc && !/inservice_results/.test(clearRowSrc), 'clear row helper must not touch results');
assert.ok(upsertSrc && !/inservice_results/.test(upsertSrc), 'assignment upsert must not touch results');
assert.ok(/status:'Archived'/.test(archiveSrc), 'archive sets status Archived');
assert.ok(!/method:\s*'DELETE'/.test(archiveSrc+upsertSrc), 'results archive and assignment upsert do not DELETE');
assert.ok(clearSrc.includes('sbClearAssignedTopicRow(topicId)'), 'clear delegates the write to one function');
assert.ok(!/DELETE/.test(clearSrc), 'delete vs null stays inside sbClearAssignedTopicRow');
assert.ok(clearRowSrc.includes("sbRestMutate('DELETE','inservice_topic_assignment'"), 'clear deletes the assignment row');
assert.ok(upsertSrc.includes("['on_conflict','org_id,topic_id']"), 'upsert conflicts on org_id,topic_id');
assert.ok(!upsertSrc.includes("['on_conflict','org_id']"), 'upsert must not use the legacy org-only conflict target');
assert.ok(!/[\s{]id\s*:/.test(upsertSrc), 'topic upsert must not send the uuid id column');
assert.strictEqual((html.match(/async function sbUpsertAssignment\(/g) || []).length, 1, 'client assignment upsert is the only function with this name');
assert.ok(!/v:\s*2|topics:\s*\{/.test(html), 'v2 aide_usernames encoding must be gone');

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
  'function sbEmptyAssignment()',
  'function sbMapAssignment(row)',
  'async function sbFetchAssignmentRows(topicId)',
  'async function sbGetAssignedTopic(topicId)',
  'async function sbUpsertTopicAssignment(topicId,aideUsernames)',
  'async function sbSetAssignedTopic(topicId)',
  'async function sbAssignSelectedAides(topicId,aideUsernames)',
  'async function sbClearAssignedTopicRow(topicId)',
  'async function sbClearAssignedTopic(topicId)',
  'async function sbAdminUnassignInserviceAide(topicId, username, archiveActiveResult)',
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
  const assignSelect = (html.match(/var SB_ASSIGN_SELECT='[^']*';/) || [''])[0];
  assert.ok(assignSelect, 'assignment select list');
  vm.runInContext(assignSelect+'\n'+names.map(function(sig){return extractFn(html, sig);}).join('\n'), box);
  return {box:box, calls:calls, mem:mem};
}

function sessionWindow(){
  return {__sbSession:{access_token:'admin-jwt', refresh_token:'refresh-1', profile:{org_id:ORG}}};
}

(async function(){
  const off = harness({search:'?sheets=1'});
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

  const missingDefault = harness({search:''});
  const missDefault = await missingDefault.box.apiPost({action:'get_inservices'});
  assert.strictEqual(missDefault.success, false);
  assert.ok(/not signed in/i.test(missDefault.error));
  assert.strictEqual(missingDefault.calls.length, 0, 'default on with no jwt must not fall through to sheets');

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
  assert.strictEqual(JSON.stringify(emptyAssign), JSON.stringify({success:true, topicId:null, aideUsernames:null, assignAll:false, assignments:[]}));
  const emptyAssignUrl = empty.calls.filter(function(c){return c.url.indexOf('inservice_topic_assignment')>=0;}).pop().url;
  assert.ok(decodeURIComponent(emptyAssignUrl).indexOf('select=id,org_id,topic_id,aide_usernames,updated_at')>=0);
  assert.ok(decodeURIComponent(emptyAssignUrl).indexOf('order=topic_id')>=0);
  assert.ok(decodeURIComponent(emptyAssignUrl).indexOf('org_id=eq.'+ORG)>=0);
  assert.ok(emptyAssignUrl.indexOf('topic_id=')<0, 'list assignments is every row for the org');

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

  const assignmentRows = [];
  function assignmentQuery(u){
    return decodeURIComponent(String(u));
  }
  function assignmentTopicFilter(u){
    const m = assignmentQuery(u).match(/(?:^|[?&])topic_id=eq\.([^&]+)/);
    return m ? m[1] : null;
  }
  const assign = harness({
    search:'?sb=1',
    storage:{evercare_sb:'1'},
    window:sessionWindow(),
    route: function(u, init){
      if(u.indexOf('inservice_topic_assignment')>=0){
        const topic = assignmentTopicFilter(u);
        if(init.method==='GET'){
          const rows = assignmentRows.filter(function(r){return !topic || String(r.topic_id)===topic;});
          return {ok:true, status:200, raw: JSON.stringify(rows)};
        }
        if(init.method==='POST'){
          const body = JSON.parse(init.body);
          const idx = assignmentRows.findIndex(function(r){return String(r.topic_id)===String(body.topic_id);});
          if(idx>=0)assignmentRows[idx]=body;
          else assignmentRows.push(body);
          return {ok:true, status:201, raw: JSON.stringify([body])};
        }
        if(init.method==='DELETE'){
          for(let i=assignmentRows.length-1;i>=0;i--){
            if(!topic || String(assignmentRows[i].topic_id)===topic)assignmentRows.splice(i,1);
          }
          return {ok:true, status:200, raw:'[]'};
        }
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
  assert.ok(assignmentQuery(setCall.url).indexOf('/rest/v1/inservice_topic_assignment?on_conflict=org_id,topic_id')>=0);
  assert.deepStrictEqual(JSON.parse(setCall.init.body), {org_id:ORG, topic_id:'1', aide_usernames:null});
  assert.ok(setCall.init.headers.Prefer.indexOf('resolution=merge-duplicates')>=0);
  assert.ok(!Object.prototype.hasOwnProperty.call(JSON.parse(setCall.init.body), 'updated_at'));
  assert.ok(!Object.prototype.hasOwnProperty.call(JSON.parse(setCall.init.body), 'id'), 'assign all must not send uuid id');
  assert.ok(assign.calls.every(function(c){return c.url.indexOf('inservice_results')<0;}), 'assign all does not touch results');

  assign.calls.length = 0;
  const selected = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'1', aideUsernames:['aide2','Aide2']});
  assert.strictEqual(selected.assignAll, false);
  assert.strictEqual(JSON.stringify(selected.aideUsernames), JSON.stringify(['aide2']));
  const selBody = JSON.parse(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().init.body);
  assert.deepStrictEqual(selBody, {org_id:ORG, topic_id:'1', aide_usernames:['aide2']});
  assert.ok(!Object.prototype.hasOwnProperty.call(selBody, 'id'), 'selected assign must not send uuid id');
  const selGet = assign.calls.filter(function(c){return c.init.method==='GET' && c.url.indexOf('inservice_topic_assignment')>=0;}).pop();
  assert.ok(selGet, 'selected assign reads that topic row first');
  assert.ok(assignmentQuery(selGet.url).indexOf('topic_id=eq.1')>=0);
  assert.ok(assignmentQuery(selGet.url).indexOf('org_id=eq.'+ORG)>=0);

  assign.calls.length = 0;
  assignmentRows.length = 0;
  assignmentRows.push({org_id:ORG, topic_id:'1', aide_usernames:['Aide1']});
  const merged = await assign.box.apiPost({action:'assign_inservice_aides', topicId:1, aideUsernames:['aide1','aide2']});
  assert.strictEqual(JSON.stringify(merged.aideUsernames), JSON.stringify(['Aide1','aide2']));

  assign.calls.length = 0;
  assignmentRows.length = 0;
  assignmentRows.push({org_id:ORG, topic_id:'1', aide_usernames:null});
  const fromAll = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'1', aideUsernames:['newhire']});
  assert.strictEqual(JSON.stringify(fromAll.aideUsernames), JSON.stringify(['newhire']), 'null means ALL and must not be merged as a list');
  assert.strictEqual(fromAll.assignAll, false);

  assign.calls.length = 0;
  const cleared = await assign.box.apiPost({action:'clear_assigned_topic'});
  assert.strictEqual(cleared.success, false);
  assert.ok(/topic id missing/i.test(cleared.error));
  assert.ok(!assign.calls.some(function(c){return c.init.method==='DELETE'||c.init.method==='POST';}), 'clear without a topic does not write');

  assign.calls.length = 0;
  assignmentRows.length = 0;
  assignmentRows.push({org_id:ORG, topic_id:'1', aide_usernames:['bbj'], updated_at:'2026-09-01T00:00:00Z'});
  const topicB = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'2', aideUsernames:['bowlax19']});
  assert.strictEqual(topicB.success, true);
  assert.strictEqual(topicB.topicId, '2');
  assert.strictEqual(JSON.stringify(topicB.aideUsernames), JSON.stringify(['bowlax19']));
  assert.strictEqual(topicB.assignAll, false);
  const multiBody = JSON.parse(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().init.body);
  assert.deepStrictEqual(multiBody, {org_id:ORG, topic_id:'2', aide_usernames:['bowlax19']});
  assert.ok(assignmentQuery(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().url).indexOf('on_conflict=org_id,topic_id')>=0);
  assert.deepStrictEqual(assignmentRows.map(function(r){return r.topic_id;}).sort(), ['1','2']);
  assert.deepStrictEqual(assignmentRows.find(function(r){return r.topic_id==='1';}).aide_usernames, ['bbj']);
  assert.ok(assign.calls.every(function(c){return c.url.indexOf('inservice_results')<0&&c.init.method!=='DELETE';}), 'second topic assign does not delete or touch results');

  assign.calls.length = 0;
  const stillA = await assign.box.apiPost({action:'get_assigned_topic', topicId:'1'});
  assert.strictEqual(stillA.topicId, '1');
  assert.strictEqual(JSON.stringify(stillA.aideUsernames), JSON.stringify(['bbj']));
  assert.strictEqual(stillA.assignAll, false);
  assert.ok(assignmentQuery(assign.calls[0].url).indexOf('topic_id=eq.1')>=0);
  assert.ok(assignmentQuery(assign.calls[0].url).indexOf('select=id,org_id,topic_id,aide_usernames,updated_at')>=0);
  assert.ok(assignmentQuery(assign.calls[0].url).indexOf('order=topic_id')>=0);
  const stillB = await assign.box.apiPost({action:'get_assigned_topic', topicId:'2'});
  assert.strictEqual(JSON.stringify(stillB.aideUsernames), JSON.stringify(['bowlax19']));

  assign.calls.length = 0;
  const clearA = await assign.box.apiPost({action:'clear_assigned_topic', topicId:'1'});
  assert.strictEqual(clearA.success, true);
  assert.strictEqual(clearA.topicId, null);
  const clearDeletes = assign.calls.filter(function(c){return c.init.method==='DELETE';});
  assert.strictEqual(clearDeletes.length, 1);
  assert.ok(!assign.calls.some(function(c){return c.init.method==='POST'||c.init.method==='PATCH';}), 'clear does not upsert or patch');
  const clearUrl = assignmentQuery(clearDeletes[0].url);
  assert.ok(clearUrl.indexOf('/rest/v1/inservice_topic_assignment?')>=0);
  assert.ok(clearUrl.indexOf('org_id=eq.'+ORG)>=0);
  assert.ok(clearUrl.indexOf('topic_id=eq.1')>=0);
  assert.ok(clearUrl.indexOf('inservice_results')<0);
  assert.strictEqual(clearDeletes[0].init.body, undefined);
  assert.ok(!clearDeletes[0].init.headers.Prefer, 'DELETE has no Prefer header');
  assert.deepStrictEqual(assignmentRows.map(function(r){return r.topic_id;}), ['2'], 'topic 1 row is gone');
  const afterClearA = await assign.box.apiPost({action:'get_assigned_topic', topicId:'1'});
  assert.strictEqual(afterClearA.topicId, null);
  assert.strictEqual(afterClearA.assignAll, false);
  const keptB = await assign.box.apiPost({action:'get_assigned_topic', topicId:'2'});
  assert.strictEqual(keptB.topicId, '2');
  assert.strictEqual(JSON.stringify(keptB.aideUsernames), JSON.stringify(['bowlax19']));

  assign.calls.length = 0;
  const listedTopics = await assign.box.apiPost({action:'get_assigned_topic'});
  assert.strictEqual(listedTopics.topicId, '2');
  assert.strictEqual(JSON.stringify(listedTopics.assignments), JSON.stringify([{topicId:'2', aideUsernames:['bowlax19'], assignAll:false}]));
  assert.ok(assignmentQuery(assign.calls[0].url).indexOf('select=id,org_id,topic_id,aide_usernames,updated_at')>=0);
  assert.ok(assignmentQuery(assign.calls[0].url).indexOf('order=topic_id')>=0);
  assert.ok(assignmentQuery(assign.calls[0].url).indexOf('org_id=eq.'+ORG)>=0);
  assert.ok(!/(?:^|[?&])topic_id=eq\./.test(assignmentQuery(assign.calls[0].url)), 'list has no topic filter');

  assignmentRows.push({org_id:ORG, topic_id:null, aide_usernames:null});
  assignmentRows.push({org_id:ORG, topic_id:'9', aide_usernames:{v:2, topics:{'9':{aides:['old']}}}});
  const legacyRead = await assign.box.apiPost({action:'get_assigned_topic'});
  assert.strictEqual(JSON.stringify(legacyRead.assignments), JSON.stringify([{topicId:'2', aideUsernames:['bowlax19'], assignAll:false}]), 'legacy null-topic and non-array rows are not rewritten or listed');
  assert.ok(assignmentRows.some(function(r){return r.topic_id==='9';}), 'non-array aide_usernames row is left in place');
  assign.calls.length = 0;
  const nobody = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'4', aideUsernames:[]});
  assert.strictEqual(nobody.assignAll, false);
  assert.strictEqual(JSON.stringify(nobody.aideUsernames), JSON.stringify([]));
  assert.deepStrictEqual(JSON.parse(assign.calls.filter(function(c){return c.init.method==='POST';}).pop().init.body).aide_usernames, []);

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

  assign.calls.length = 0;
  assignmentRows.length = 0;
  vm.runInContext(extractFn(html, 'async function sbUpsertAssignment(aideId, clientId)'), assign.box);
  const probeAssign = await assign.box.apiPost({action:'assign_inservice_aides', topicId:'1', aideUsernames:['qa_probe']});
  assert.strictEqual(probeAssign.success, true);
  assert.deepStrictEqual(probeAssign.aideUsernames, ['qa_probe']);
  const probePost = assign.calls.filter(function(c){return c.init.method==='POST';}).pop();
  assert.ok(assignmentQuery(probePost.url).indexOf('/rest/v1/inservice_topic_assignment?on_conflict=org_id,topic_id')>=0);
  assert.ok(probePost.url.indexOf('/rest/v1/assignments?')<0, 'topic assign must not post the client assignments table');
  assert.deepStrictEqual(JSON.parse(probePost.init.body), {org_id:ORG, topic_id:'1', aide_usernames:['qa_probe']});
  assert.ok(!Object.prototype.hasOwnProperty.call(JSON.parse(probePost.init.body), 'id'));

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
  const sheetsUi = uiBox('?sheets=1', '1');
  await sheetsUi.box.clearAssignment();
  assert.strictEqual(JSON.stringify(sheetsUi.posts[0]), JSON.stringify({action:'clear_assigned_topic'}), 'sheets rollback clear has no topic id');
  const defaultUi = uiBox('', '3');
  await defaultUi.box.clearAssignment();
  assert.strictEqual(defaultUi.posts[0].topicId, '3', 'default clear sends the selected topic');
  const sbUi = uiBox('?sb=1', '1');
  await sbUi.box.clearAssignment();
  assert.strictEqual(JSON.stringify(sbUi.posts[0]), JSON.stringify({action:'clear_assigned_topic', topicId:'1'}), 'flag on clear sends the selected topic only');
  const sbUiB = uiBox('?sb=1', '2');
  await sbUiB.box.clearAssignment();
  assert.strictEqual(sbUiB.posts[0].topicId, '2');

  const rpcSrc = extractFn(html, 'async function sbAdminUnassignInserviceAide(topicId, username, archiveActiveResult)');
  assert.ok(rpcSrc.includes("sbRestMutate('POST','rpc/admin_unassign_inservice_aide'"), 'delete posts the Ace RPC only');
  assert.ok(rpcSrc.includes('p_topic_id:String(topicId)'), 'RPC sends p_topic_id');
  assert.ok(rpcSrc.includes('p_username:name'), 'RPC sends p_username');
  assert.ok(rpcSrc.includes('p_archive_active_result:archiveActiveResult===true'), 'RPC sends p_archive_active_result');
  assert.ok(!/inservice_results|inservice_topic_assignment|sbUpsertTopicAssignment|sbRestMutate\(\s*'DELETE'|sbRestMutate\(\s*'PATCH'/.test(rpcSrc), 'RPC helper does not write tables itself');
  assert.ok(!extractFn(html, 'function sbInserviceAction(action)').includes('unassign_inservice_aide'), 'no second unassign action');
  assert.ok(!html.includes('function sbUnassignInserviceAide'), 'client unassign path is gone');

  const rpc = harness({
    search:'?sb=1',
    storage:{evercare_sb:'1'},
    window:sessionWindow(),
    route: function(u, init){
      if(u.indexOf('/rest/v1/rpc/admin_unassign_inservice_aide')>=0 && init.method==='POST'){
        const body = JSON.parse(init.body);
        if(body.p_username==='hard')return {ok:true, status:200, raw: JSON.stringify({ok:true, results_hard_deleted:true})};
        if(body.p_username==='nope')return {ok:true, status:200, raw: JSON.stringify({ok:false, error:'not assigned'})};
        return {ok:true, status:200, raw: JSON.stringify({ok:true, results_hard_deleted:false})};
      }
      return {ok:false, status:500, raw: JSON.stringify({message:'unexpected '+init.method+' '+u})};
    }
  });
  const pendingRpc = await rpc.box.sbAdminUnassignInserviceAide(1, ' Pat ', false);
  assert.strictEqual(pendingRpc.success, true);
  assert.strictEqual(pendingRpc.results_hard_deleted, false);
  assert.strictEqual(rpc.calls.length, 1);
  const pendingCall = rpc.calls[0];
  assert.strictEqual(pendingCall.init.method, 'POST');
  assert.ok(pendingCall.url.indexOf('/rest/v1/rpc/admin_unassign_inservice_aide')>=0);
  assert.deepStrictEqual(JSON.parse(pendingCall.init.body), {p_topic_id:'1', p_username:'Pat', p_archive_active_result:false});
  assert.strictEqual(pendingCall.init.headers.apikey, anon);
  assert.strictEqual(pendingCall.init.headers.Authorization, 'Bearer admin-jwt');
  assert.ok(pendingCall.init.headers.Prefer.indexOf('return=representation')>=0);
  assert.ok(!rpc.calls.some(function(c){return c.init.method==='DELETE'||c.init.method==='PATCH'||c.url.indexOf('inservice_results')>=0||c.url.indexOf('inservice_topic_assignment')>=0;}));

  rpc.calls.length = 0;
  const completedRpc = await rpc.box.sbAdminUnassignInserviceAide('2', 'asha', true);
  assert.strictEqual(completedRpc.success, true);
  assert.deepStrictEqual(JSON.parse(rpc.calls[0].init.body), {p_topic_id:'2', p_username:'asha', p_archive_active_result:true});

  rpc.calls.length = 0;
  const hard = await rpc.box.sbAdminUnassignInserviceAide('1', 'hard', true);
  assert.strictEqual(hard.success, false);
  assert.strictEqual(hard.results_hard_deleted, true);

  rpc.calls.length = 0;
  const refused = await rpc.box.sbAdminUnassignInserviceAide('1', 'nope', false);
  assert.strictEqual(refused.success, false);
  assert.strictEqual(refused.error, 'not assigned');

  rpc.calls.length = 0;
  const missingTopic = await rpc.box.sbAdminUnassignInserviceAide('  ', 'aide2', false);
  assert.strictEqual(missingTopic.success, false);
  assert.ok(/topic id missing/i.test(missingTopic.error));
  assert.strictEqual(rpc.calls.length, 0);

  console.log('inservice-sb-dual-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
