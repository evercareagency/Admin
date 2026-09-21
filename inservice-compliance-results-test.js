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
assert.ok(html.includes("postArchiveAction('delete_inservice_result'"), 'delete_inservice_result wired');
assert.ok(html.includes("action:'admin_update_inservice_answers'"), 'admin_update_inservice_answers wired');
assert.ok(html.includes("action:'clear_assigned_topic'"), 'clear_assigned_topic unchanged');
assert.ok(html.includes("action:'get_inservices'"), 'get_inservices still used');
assert.ok(html.includes('colspan="6"'), 'table colspan includes Score');

assert.ok(completedActs.includes('View Results'), 'completed actions include View Results');
assert.ok(completedActs.includes('Print Cert'), 'completed actions include Print Cert');
assert.ok(completedActs.includes('Delete'), 'completed actions include Delete');
assert.ok(completedActs.indexOf('View Results') < completedActs.indexOf('Print Cert'), 'View Results before Print Cert');
assert.ok(completedActs.indexOf('Print Cert') < completedActs.indexOf('Delete'), 'Print Cert before Delete');
assert.ok(pendingActs.includes('Send Reminder'), 'not completed keeps Send Reminder');
assert.ok(!pendingActs.includes('View Results'), 'not completed has no View Results');
assert.ok(!pendingActs.includes('Delete'), 'not completed has no Delete');

assert.ok(printHook.includes('printCert(row)'), 'Print Cert calls existing printCert');
assert.ok(confirmDel.includes("showSharedConfirm('Are you sure?'"), 'delete uses in-DOM Are you sure?');
assert.ok(confirmDel.includes('Yes, delete'), 'delete confirm label');
assert.ok(!/window\.confirm/.test(confirmDel+deleteRes+renderTable+completedActs), 'no window.confirm');
assert.ok(!/\bconfirm\(/.test(confirmDel+deleteRes), 'no confirm()');

assert.ok(clearAssignment.includes("action:'clear_assigned_topic'"), 'clear posts clear_assigned_topic only');
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
assert.ok(deleteRes.includes("postArchiveAction('delete_inservice_result','archive_inservice_result',{id:id})"), 'delete/archive LOCK { id }');
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
    regrade, fallbackQs, adopt, setEdit, paint, viewRes, saveEdit
  ].join('\n'),
  sandbox
);

assert.strictEqual(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z'), 'Aug 2, 2026');
assert.strictEqual(sandbox.formatISCompletedDate('2026-08-02'), 'Aug 2, 2026');
assert.ok(!/T|Z/.test(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z')), 'never raw ISO');
assert.ok(!/2026-08-02/.test(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z')), 'never YYYY-MM-DD in table');
assert.strictEqual(sandbox.formatISCompletedDate('08/02/2026'), 'Aug 2, 2026');
assert.strictEqual(sandbox.formatISCompletedDate('August 2, 2026'), 'Aug 2, 2026');

const completed = sandbox.hydrateISComplianceRow({
  id:'is-asha-1', username:'aide1', empName:'Asha Aide', topicId:1,
  completedAt:'2026-08-02T01:42:29.000Z',
  scoreCorrect:9, scoreTotal:10, scorePct:90, Status:'Active',
  answers:[1,2,1,3,1,1,1,1,1,0]
}, {username:'aide1', name:'Asha Aide'}, {id:1, title:'Diabetes', shortTitle:'Diabetes Complications', questions:new Array(10).fill({q:'q',options:['a','b'],answer:0})});
assert.strictEqual(completed.isCompleted, true);
assert.strictEqual(sandbox.formatISScoreColumn(completed), '9/10 · 90%');
assert.strictEqual(sandbox.formatISScoreBanner(completed), 'Score: 9/10 (90%)');
assert.strictEqual(sandbox.formatISCompletedDate(sandbox.certDateFromRecord(completed)), 'Aug 2, 2026');

const pending = sandbox.hydrateISComplianceRow({}, {username:'aide2', name:'Pat Pending'}, {id:1, title:'Diabetes', shortTitle:'Diabetes Complications'});
assert.strictEqual(pending.isCompleted, false);
assert.strictEqual(sandbox.formatISScoreColumn(pending), '—');

assert.strictEqual(
  sandbox.formatISAceActionError({success:false,error:'Unknown action'},'get_inservice_result','Could not load results.'),
  'Ace get_inservice_result failed: Unknown action'
);
assert.ok(sandbox.isISGetShape({success:true,items:[{q:'Q1'}],scorePct:90}), 'items+score is get shape');
assert.ok(sandbox.isISGetShape({success:true,scoreCorrect:9,scoreTotal:10,scorePct:90}), 'score fields are get shape');
assert.ok(!sandbox.isISGetShape({success:true}), 'bare success is not get shape');

(async function probeEditReopen(){
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
