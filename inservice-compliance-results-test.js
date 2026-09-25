#!/usr/bin/env node
'use strict';

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

const clearAssignment = extractFn(html, 'async function clearAssignment()');
const loadIS = extractFn(html, 'async function loadISCompliance(force)');
const renderTable = extractFn(html, 'function renderISComplianceTable(rows)');
const completedActs = extractFn(html, 'function isCompletedActionsHtml(i)');
const pendingActs = extractFn(html, 'function isPendingActionsHtml(i)');
const confirmDel = extractFn(html, 'function confirmDeleteISResult(rowIndex)');
const deleteRes = extractFn(html, 'async function deleteISResult(rowIndex)');
const confirmAssign = extractFn(html, 'function confirmDeleteISAssignment(rowIndex)');
const deleteAssign = extractFn(html, 'async function deleteISAssignment(rowIndex)');
const commitDel = extractFn(html, 'async function commitISComplianceDelete(rowIndex, archiveActiveResult)');
const onAssign = extractFn(html, 'function isAideOnCurrentISAssignment(assignView, username)');
const printHook = extractFn(html, 'function printISCert(rowIndex)');
const viewRes = extractFn(html, 'async function viewISResults(rowIndex)');
const startEdit = extractFn(html, 'function startISResultsEdit()');
const saveEdit = extractFn(html, 'async function saveISResultsEdit()');
const getShape = extractFn(html, 'function isISGetShape(data)');
const aceErr = extractFn(html, 'function formatISAceActionError(data,action,fallback)');
const remember = extractFn(html, 'function rememberISResultDetail(id,detail)');
const cached = extractFn(html, 'function cachedISResultDetail(id)');
const fallbackQs = extractFn(html, 'function fallbackISQuestions(row)');
const adopt = extractFn(html, 'function adoptISResultPayload(row,data)');
const regrade = extractFn(html, 'function regradeISQuestionsFromAnswers(questions,answers)');
const mergeRow = extractFn(html, 'function mergeCachedISResultRow(row)');
const formatDate = extractFn(html, 'function formatISCompletedDate(val)');
const formatScore = extractFn(html, 'function formatISScoreColumn(row)');
const formatBanner = extractFn(html, 'function formatISScoreBanner(row)');
const hydrate = extractFn(html, 'function hydrateISComplianceRow(c,aide,topic)');
const fillScore = extractFn(html, 'function fillISScore(row,topic,answers)');
const parseAns = extractFn(html, 'function parseISAnswers(c)');
const completedRec = extractFn(html, 'function isISCompletedRecord(c)');
const certDate = extractFn(html, 'function certDateFromRecord(r)');
const topicIdOf = extractFn(html, 'function isTopicIdOfCompletion(c)');
const isNum = extractFn(html, 'function isNumOrNull(v)');
const ansOk = extractFn(html, 'function isISAnswerCorrect(q,aideAns)');
const firstField = extractFn(html, 'function firstISField(obj,keys)');
const resultIdOf = extractFn(html, 'function isResultIdOf(c)');
const parseJsonArr = extractFn(html, 'function parseISJsonArray(raw)');
const printCert = extractFn(html, 'function printCert(r)');

assert.ok(clearAssignment, 'clearAssignment missing');
assert.ok(loadIS, 'loadISCompliance missing');
assert.ok(renderTable, 'renderISComplianceTable missing');
assert.ok(completedActs, 'isCompletedActionsHtml missing');
assert.ok(pendingActs, 'isPendingActionsHtml missing');
assert.ok(confirmDel, 'confirmDeleteISResult missing');
assert.ok(deleteRes, 'deleteISResult missing');
assert.ok(confirmAssign, 'confirmDeleteISAssignment missing');
assert.ok(deleteAssign, 'deleteISAssignment missing');
assert.ok(commitDel, 'commitISComplianceDelete missing');
assert.ok(onAssign, 'isAideOnCurrentISAssignment missing');
assert.ok(printHook, 'printISCert missing');
assert.ok(viewRes, 'viewISResults missing');
assert.ok(startEdit, 'startISResultsEdit missing');
assert.ok(html.includes('#isResultsModal button[hidden]{display:none !important;}'), 'hidden footer buttons must beat .btn display');
assert.ok(extractFn(html, 'function setISResultsEditMode(on)').includes("el.style.display=hide?'none':''"), 'edit mode toggles display');
assert.ok(saveEdit, 'saveISResultsEdit missing');
assert.ok(formatDate, 'formatISCompletedDate missing');
assert.ok(formatScore, 'formatISScoreColumn missing');
assert.ok(formatBanner, 'formatISScoreBanner missing');
assert.ok(printCert, 'printCert hook must remain');

assert.ok(html.includes('<th>Score</th>'), 'Score column header');
assert.ok(html.includes('View Results'), 'View Results action');
assert.ok(html.includes('Print Cert'), 'Print Cert action');
assert.ok(html.includes('Edit answers (Admin)'), 'Edit answers Admin button');
assert.ok(html.includes('id="isResultsModal"'), 'View Results modal');
assert.ok(html.includes('id="isResultsBanner"'), 'score banner');
assert.ok(html.includes('Clear Assignment removes the current topic from aides only'), 'Clear Assignment copy');
assert.ok(html.includes('Completion records are kept.'), 'clear success keeps results');
assert.ok(html.includes("action:'get_inservice_result'"), 'get_inservice_result wired');
assert.ok(html.includes("rpc/admin_unassign_inservice_aide"), 'compliance delete uses the Ace RPC');
assert.ok(html.includes("action:'admin_update_inservice_answers'"), 'admin_update_inservice_answers wired');
assert.ok(html.includes("action:'clear_assigned_topic'"), 'clear_assigned_topic unchanged');
assert.ok(html.includes("action:'get_inservices'"), 'get_inservices still used');
assert.ok(html.includes('colspan="6"'), 'table colspan includes Score');

assert.ok(completedActs.includes('View Results'), 'completed actions include View Results');
assert.ok(completedActs.includes('View Cert'), 'completed actions include View Cert');
assert.ok(completedActs.includes('Print Cert'), 'completed actions include Print Cert');
assert.ok(completedActs.includes('Delete'), 'completed actions include Delete');
assert.ok(completedActs.indexOf('View Results') < completedActs.indexOf('View Cert'), 'View Results before View Cert');
assert.ok(completedActs.indexOf('View Cert') < completedActs.indexOf('Print Cert'), 'View Cert before Print Cert');
assert.ok(completedActs.indexOf('Print Cert') < completedActs.indexOf('Delete'), 'Print Cert before Delete');
assert.ok(completedActs.includes('isOfficeCertStaff'), 'certs are office staff only');
assert.ok(pendingActs.includes('Send Reminder'), 'not completed keeps Send Reminder');
assert.ok(pendingActs.includes('Delete'), 'not completed includes Delete');
assert.ok(pendingActs.includes('confirmDeleteISAssignment'), 'not completed Delete confirms the assignment');
assert.ok(!pendingActs.includes('confirmDeleteISResult'), 'not completed Delete does not archive a result');
assert.ok(pendingActs.indexOf('Send Reminder') < pendingActs.indexOf('Delete'), 'Send Reminder before Delete');
assert.ok(!pendingActs.includes('View Results'), 'not completed has no View Results');
assert.ok(!pendingActs.includes('View Cert'), 'not completed has no View Cert');
assert.ok(!pendingActs.includes('Print Cert'), 'not completed has no Print Cert');

assert.ok(printHook.includes('printCert(row)'), 'Print Cert calls existing printCert');
assert.ok(confirmDel.includes("showSharedConfirm('Are you sure?'"), 'delete uses in-DOM Are you sure?');
assert.ok(confirmDel.includes('Yes, delete'), 'delete confirm label');
assert.ok(confirmAssign.includes("showSharedConfirm('Are you sure?'"), 'assignment delete uses Are you sure?');
assert.ok(confirmAssign.includes('Yes, delete'), 'assignment delete confirm label');
assert.ok(confirmAssign.includes('deleteISAssignment'), 'assignment confirm calls deleteISAssignment');
assert.ok(!/window\.confirm/.test(confirmDel+deleteRes+confirmAssign+deleteAssign+renderTable+completedActs+pendingActs), 'no window.confirm');
assert.ok(!/\bconfirm\(/.test(confirmDel+deleteRes+confirmAssign+deleteAssign), 'no confirm()');

assert.ok(clearAssignment.includes("action:'clear_assigned_topic'"), 'sheets rollback still posts clear_assigned_topic');
assert.ok(clearAssignment.includes('sbClearAssignedTopic(topicId)'), 'sb clear deletes the assignment row');
assert.ok(clearAssignment.includes('Choose a topic before clearing the assignment.'), 'missing topicId fails loud');
assert.ok(!/admin_unassign_inservice_aide/.test(clearAssignment), 'clear must not call the per-aide delete RPC');
assert.ok(!/delete_inservice_result/.test(clearAssignment), 'clear must not delete results');
assert.ok(!/delete_inservice/.test(clearAssignment), 'clear must not call delete');
assert.ok(loadIS.includes('isISCompletedRecord'), 'after clear, completed rows still render');
assert.ok(loadIS.includes('Completed results stay here after Clear Assignment'), 'empty copy does not imply wipe');

assert.ok(viewRes.includes("action:'get_inservice_result'"), 'View Results fetches get_inservice_result');
assert.ok(viewRes.includes('id:resultId'), 'View Results sends Ace v42 { id }');
assert.ok(!viewRes.includes('Unknown action: get_inservice_result'), 'must not fake unknown-action stub');
assert.ok(!viewRes.includes("action:'get_inservice_results'"), 'do not invent get_inservice_results alias');
assert.ok(!html.includes('not deployed yet'), 'must not show Ace-not-deployed stub copy');
assert.ok(viewRes.includes('formatISAceActionError'), 'View Results surfaces Ace error string');
assert.ok(viewRes.includes('fallbackISQuestions'), 'View Results falls back to cached/list detail');
assert.ok(saveEdit.includes("action:'admin_update_inservice_answers'"), 'save posts admin update');
assert.ok(saveEdit.includes('id:resultId,answers:answers'), 'save sends Ace v42 { id, answers:[selIdx] }');
assert.ok(saveEdit.includes('isISGetShape(data)'), 'save paints from update when it has get shape');
assert.ok(saveEdit.includes("action:'get_inservice_result'"), 'save may refresh via get only if update lacks get shape');
assert.ok(saveEdit.includes('rememberISResultDetail'), 'save caches painted result for reopen');
assert.ok(saveEdit.includes('loadISCompliance(true)'), 'save refreshes score/list');
assert.ok(getShape && aceErr && remember && cached && fallbackQs && adopt && regrade && mergeRow, 'hotfix helpers missing');
assert.ok(deleteRes.includes('commitISComplianceDelete(rowIndex, true)'), 'completed delete archives via the RPC flag');
assert.ok(deleteAssign.includes('commitISComplianceDelete(rowIndex, false)'), 'not completed delete does not archive');
assert.ok(commitDel.includes('sbAdminUnassignInserviceAide(topicId, username, archiveActiveResult===true)'), 'both deletes call the RPC helper');
assert.ok(!/postArchiveAction|delete_inservice_result|archive_inservice_result|inservice_results|inservice_topic_assignment|apiPost\(/.test(deleteRes+deleteAssign+commitDel), 'dashboard delete has no second path');
assert.ok(!/clear_assigned_topic/.test(deleteAssign+commitDel), 'one aide delete must not clear the whole topic');
assert.ok(onAssign.includes('aide_usernames null = all aides'), 'null assignment means every aide');
assert.ok(loadIS.includes('isAideOnCurrentISAssignment'), 'not completed rows follow the assignment list');
assert.ok(loadIS.includes('!isISCompletedRecord(completion)&&!isAideOnCurrentISAssignment'), 'completed rows stay when that aide is off the list');
assert.ok(html.includes('v=isdel1'), 'isdel1 marker');
assert.ok(html.includes('v=isclear1'), 'isclear1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'admin-build isclear1');
assert.ok(html.includes('2026-09-24-nursespd1'), 'nursespd1 marker stays');
assert.ok(html.includes('v=sched1m'), 'sched1m marker stays');
assert.ok(html.includes('v=pdf1p'), 'pdf1p marker stays');
assert.ok(loadIS.includes('includeArchived')===false || /no includeArchived/.test(html), 'get_inservices skips archived');
assert.ok(!/includeArchived\s*:/.test(loadIS), 'must not pass includeArchived');

assert.ok(html.includes('v=c2rib7212'), 'C2 cache-bust comment stays');
assert.ok(html.includes('function printCert('), 'C2 printCert stays');

function makeEl(id){
  return {
    id:id,
    hidden:false,
    textContent:'',
    innerHTML:'',
    disabled:false,
    dataset:{},
    style:{display:''},
    classList:{add:function(){},remove:function(){}}
  };
}

const els = {
  isResultsNote: makeEl('isResultsNote'),
  isResultsBody: makeEl('isResultsBody'),
  isResultsBanner: makeEl('isResultsBanner'),
  isResultsMeta: makeEl('isResultsMeta'),
  isResultsModal: makeEl('isResultsModal'),
  isResultsSaveEdit: makeEl('isResultsSaveEdit'),
  isResultsEditBtn: makeEl('isResultsEditBtn'),
  isResultsCancelEdit: makeEl('isResultsCancelEdit')
};

const posts = [];
const toasts = [];
const topicQs = [
  {q:'Q1',options:['a','b'],answer:1},
  {q:'Q2',options:['c','d'],answer:0}
];

const sandbox = {
  Intl,
  Date,
  Number,
  String,
  Object,
  Array,
  JSON,
  isNaN,
  Math,
  console,
  INSERVICES: [{id:1,title:'Diabetes',shortTitle:'Diabetes Complications',questions:topicQs}],
  isComplianceRows: [],
  isResultsState: {rowIndex:-1,row:null,questions:[],editing:false},
  isResultDetailById: {},
  document: {
    getElementById: function(id){return els[id]||null;},
    querySelector: function(){return null;}
  },
  apiPost: async function(payload){
    posts.push(payload);
    if(payload.action==='admin_update_inservice_answers'){
      return {
        success:true,
        id:payload.id,
        answers:payload.answers,
        items:[
          {index:0,prompt:'Q1',options:['a','b'],selected:payload.answers[0],correct:1,isCorrect:payload.answers[0]===1},
          {index:1,prompt:'Q2',options:['c','d'],selected:payload.answers[1],correct:0,isCorrect:payload.answers[1]===0}
        ],
        scoreCorrect:payload.answers.filter(function(a,i){return a===(i===0?1:0);}).length,
        scoreTotal:2,
        scorePct:payload.answers[0]===1&&payload.answers[1]===0?100:50
      };
    }
    if(payload.action==='get_inservice_result'){
      return {success:false,error:'Unknown action'};
    }
    return {success:false,error:'Unknown action'};
  },
  showTempMsg: function(msg){toasts.push(msg);},
  openModal: function(){},
  closeModal: function(){},
  loadISCompliance: async function(){},
  nciLooksLikeUnknownAction: function(text){return /unknown action|not implemented|stub action/i.test(String(text||''));}
};
vm.createContext(sandbox);
assert.ok(topicIdOf && isNum && ansOk && fillScore && hydrate && certDate && firstField && resultIdOf && parseJsonArr, 'score/date helpers missing');
const parseItems = extractFn(html, 'function parseISResultItems(payload)');
const payloadFn = extractFn(html, 'function isResultPayload(data)');
const applyScore = extractFn(html, 'function applyISResultScore(row,data)');
const normalize = extractFn(html, 'function normalizeISResultQuestions(data,row)');
const localQs = extractFn(html, 'function buildLocalISQuestions(row)');
const paint = extractFn(html, 'function paintISResults()');
const setEdit = extractFn(html, 'function setISResultsEditMode(on)');
const escapeHtml = extractFn(html, 'function escapeHtml(str)');
assert.ok(parseItems && payloadFn && applyScore && normalize && localQs && paint && setEdit && escapeHtml, 'paint helpers missing');
vm.runInContext(
  [
    escapeHtml, isNum, firstField, resultIdOf, parseJsonArr, parseAns, parseItems, completedRec,
    topicIdOf, ansOk, fillScore, hydrate, certDate, formatDate, formatScore, formatBanner,
    payloadFn, applyScore, normalize, localQs, getShape, aceErr, remember, cached, mergeRow,
    regrade, fallbackQs, adopt, setEdit,
    extractFn(html, 'function isQuizLetter(index)'),
    extractFn(html, 'function isQuizChoiceLabel(index, text)'),
    extractFn(html, 'function isQuizAnswerLine(q, index, fallbackText)'),
    paint, viewRes, saveEdit
  ].join('\n'),
  sandbox
);

assert.strictEqual(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z'), '08/02/2026');
assert.strictEqual(sandbox.formatISCompletedDate('2026-08-02'), '08/02/2026');
assert.ok(!/T|Z/.test(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z')), 'never raw ISO');
assert.ok(!/2026-08-02/.test(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z')), 'never YYYY-MM-DD in table');
assert.strictEqual(sandbox.formatISCompletedDate('08/02/2026'), '08/02/2026');
assert.strictEqual(sandbox.formatISCompletedDate('August 2, 2026'), '08/02/2026');

const completed = sandbox.hydrateISComplianceRow({
  id:'is-asha-1', username:'aide1', empName:'Asha Aide', topicId:1,
  completedAt:'2026-08-02T01:42:29.000Z',
  scoreCorrect:9, scoreTotal:10, scorePct:90, Status:'Active',
  answers:[1,2,1,3,1,1,1,1,1,0]
}, {username:'aide1', name:'Asha Aide'}, {id:1, title:'Diabetes', shortTitle:'Diabetes Complications', questions:new Array(10).fill({q:'q',options:['a','b'],answer:0})});
assert.strictEqual(completed.isCompleted, true);
assert.strictEqual(sandbox.formatISScoreColumn(completed), '9/10 · 90%');
assert.strictEqual(sandbox.formatISScoreBanner(completed), 'Score: 9/10 (90%)');
assert.strictEqual(sandbox.formatISCompletedDate(sandbox.certDateFromRecord(completed)), '08/02/2026');

const pending = sandbox.hydrateISComplianceRow({}, {username:'aide2', name:'Pat Pending'}, {id:1, title:'Diabetes', shortTitle:'Diabetes Complications'});
assert.strictEqual(pending.isCompleted, false);
assert.strictEqual(sandbox.formatISScoreColumn(pending), '—');

vm.runInContext([pendingActs, onAssign, confirmAssign, extractFn(html, 'function isComplianceDeleteTopicId(row)')].join('\n'), sandbox);
sandbox.isComplianceRows=[pending];
sandbox.showSharedConfirm=function(title, fn, label){sandbox._confirm={title:title,label:label,fn:fn};};
const pendingHtml=sandbox.isPendingActionsHtml(0);
assert.ok(pendingHtml.includes('Send Reminder'), 'pending html has Send Reminder');
assert.ok(pendingHtml.includes('Delete'), 'pending html has Delete');
assert.ok(pendingHtml.indexOf('Send Reminder')<pendingHtml.indexOf('Delete'), 'pending html order');
assert.ok(pendingHtml.includes('confirmDeleteISAssignment(0)'), 'pending Delete is wired');
assert.ok(!pendingHtml.includes('View Results')&&!pendingHtml.includes('Print Cert'), 'pending html has no cert actions');
sandbox.confirmDeleteISAssignment(0);
assert.strictEqual(sandbox._confirm.title, 'Are you sure?');
assert.strictEqual(sandbox._confirm.label, 'Yes, delete');
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({assignAll:true, aideUsernames:null}, 'aide2'), true);
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({assignAll:true, aideUsernames:['Aide2']}, 'aide2'), true);
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({assignAll:true, aideUsernames:['Aide2']}, 'other'), false);
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({assignAll:false, aideUsernames:['Aide2']}, 'aide2'), true);
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({assignAll:false, aideUsernames:['Aide2']}, 'other'), false);
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({assignAll:false, aideUsernames:[]}, 'aide2'), false);
assert.strictEqual(sandbox.isAideOnCurrentISAssignment({success:true, topicId:1}, 'aide2'), true);

vm.runInContext([
  extractFn(html, 'function isComplianceDeleteTopicId(row)'),
  deleteRes,
  deleteAssign,
  commitDel
].join('\n'), sandbox);

assert.strictEqual(
  sandbox.formatISAceActionError({success:false,error:'Unknown action'},'get_inservice_result','Could not load results.'),
  'Ace get_inservice_result failed: Unknown action'
);
assert.ok(sandbox.isISGetShape({success:true,items:[{q:'Q1'}],scorePct:90}), 'items+score is get shape');
assert.ok(sandbox.isISGetShape({success:true,scoreCorrect:9,scoreTotal:10,scorePct:90}), 'score fields are get shape');
assert.ok(!sandbox.isISGetShape({success:true}), 'bare success is not get shape');

(async function probeEditReopen(){
  const rpcCalls=[];
  sandbox.sbAdminUnassignInserviceAide=async function(topicId, username, archive){
    rpcCalls.push({topicId:topicId, username:username, archive:archive});
    return {success:true, results_hard_deleted:false};
  };
  sandbox.cacheInvalidate=function(){};
  sandbox.renderInservices=async function(){};
  sandbox.isComplianceRows=[{username:' patjunk ', topicId:1, isCompleted:false}];
  await sandbox.deleteISAssignment(0);
  assert.deepStrictEqual(rpcCalls, [{topicId:'1', username:'patjunk', archive:false}]);
  sandbox.isComplianceRows=[{username:'asha', topicId:2, isCompleted:true, id:'result-asha'}];
  await sandbox.deleteISResult(0);
  assert.deepStrictEqual(rpcCalls[1], {topicId:'2', username:'asha', archive:true});

  const listRow=sandbox.hydrateISComplianceRow({
    id:'is-asha-1', username:'aide1', empName:'Asha Aide', topicId:1,
    completedAt:'2026-08-02T01:42:29.000Z',
    scoreCorrect:1, scoreTotal:2, scorePct:50, Status:'Active',
    answers:[0,0]
  }, {username:'aide1', name:'Asha Aide'}, sandbox.INSERVICES[0]);
  sandbox.isComplianceRows=[listRow];
  sandbox.isResultDetailById={};
  posts.length=0;
  await sandbox.viewISResults(0);
  assert.ok(posts.some(function(p){return p.action==='get_inservice_result'&&p.id==='is-asha-1';}), 'open calls LOCK get_inservice_result { id }');
  assert.ok(els.isResultsNote.textContent.indexOf('get_inservice_result')>=0, 'note names the Ace action');
  assert.ok(els.isResultsNote.textContent.indexOf('Unknown action')>=0, 'note keeps Ace error string');
  assert.ok(els.isResultsNote.textContent.trim()!=='Unknown action', 'must not show bare Unknown action');
  assert.ok(els.isResultsBody.innerHTML.indexOf('is-result-qa')>=0, 'list-row answers paint Q&A when get fails');
  assert.ok(/class="mark"/.test(els.isResultsBody.innerHTML), 'Q&A includes correct/wrong marks');
  assert.ok(els.isResultsBody.innerHTML.indexOf('Aide answer:')>=0, 'review names the aide answer');
  assert.ok(els.isResultsBody.innerHTML.indexOf('A. a')>=0, 'wrong aide choice is lettered');
  assert.ok(els.isResultsBody.innerHTML.indexOf('Correct:')>=0&&els.isResultsBody.innerHTML.indexOf('B. b')>=0, 'correct choice is lettered');
  assert.ok(els.isResultsBody.innerHTML.indexOf('A. c')>=0, 'right aide choice is lettered');

  const letterQs=sandbox.isResultsState.questions;
  sandbox.isResultsState.editing=true;
  sandbox.isResultsState.questions=[{
    question:'Which event?',
    options:['routine visit','medical emergency','hurricane','fire','flood','power outage'],
    selected:1,
    correct:2,
    aideAnswer:'medical emergency',
    correctAnswer:'hurricane',
    isCorrect:false
  }];
  sandbox.paintISResults();
  const editHtml=els.isResultsBody.innerHTML;
  ['A. routine visit','B. medical emergency','C. hurricane','D. fire','E. flood','F. power outage'].forEach(function(label){
    assert.ok(editHtml.indexOf(label)>=0, 'edit choice shows '+label);
  });
  assert.ok(!/\bG\./.test(editHtml), 'edit stops at the option count');
  sandbox.isResultsState.editing=false;
  sandbox.paintISResults();
  const reviewHtml=els.isResultsBody.innerHTML;
  assert.ok(reviewHtml.indexOf('Aide answer:')>=0&&reviewHtml.indexOf('B. medical emergency')>=0, 'review aide line is lettered');
  assert.ok(reviewHtml.indexOf('Correct:')>=0&&reviewHtml.indexOf('C. hurricane')>=0, 'review correct line is lettered');
  sandbox.isResultsState.questions=letterQs;
  sandbox.isResultsState.editing=false;
  sandbox.paintISResults();

  sandbox.isResultsState.questions[0].selected=1;
  sandbox.isResultsState.questions[1].selected=0;
  posts.length=0;
  await sandbox.saveISResultsEdit();
  assert.strictEqual(posts.filter(function(p){return p.action==='admin_update_inservice_answers';}).length, 1, 'save posts admin update');
  assert.strictEqual(posts.filter(function(p){return p.action==='get_inservice_result';}).length, 0, 'do not re-get when update has items/score');
  assert.ok(els.isResultsBody.innerHTML.indexOf('is-result-qa')>=0, 'save paints View Results from update');
  assert.ok(/2\/2|100%/.test(els.isResultsBanner.textContent), 'update score paints on banner');

  sandbox.isResultsState={rowIndex:-1,row:null,questions:[],editing:false};
  els.isResultsBody.innerHTML='';
  els.isResultsNote.textContent='';
  await sandbox.viewISResults(0);
  assert.ok(els.isResultsBody.innerHTML.indexOf('is-result-qa')>=0, 'reopen View Results shows Q&A marks after Edit');
  assert.ok(/class="mark"/.test(els.isResultsBody.innerHTML), 'reopen keeps correct/wrong marks');
  assert.ok(els.isResultsBody.innerHTML.indexOf('Unknown action')<0, 'reopen body is Q&A, not Unknown action');
})().then(function(){
  console.log('inservice-compliance-results-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
