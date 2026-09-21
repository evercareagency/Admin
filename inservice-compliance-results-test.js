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
assert.ok(viewRes.includes('nciLooksLikeUnknownAction'), 'View Results stubs unknown Ace action');
assert.ok(saveEdit.includes("action:'admin_update_inservice_answers'"), 'save posts admin update');
assert.ok(saveEdit.includes('loadISCompliance(true)'), 'save refreshes score/list');
assert.ok(deleteRes.includes("postArchiveAction('delete_inservice_result'"), 'delete posts delete_inservice_result');

assert.ok(html.includes('v=c2rib7212'), 'C2 cache-bust comment stays');
assert.ok(html.includes('function printCert('), 'C2 printCert stays');

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
  console
};
vm.createContext(sandbox);
assert.ok(topicIdOf && isNum && ansOk && fillScore && hydrate && certDate, 'score/date helpers missing');
vm.runInContext(
  [isNum, parseAns, completedRec, topicIdOf, ansOk, fillScore, hydrate, certDate, formatDate, formatScore, formatBanner].join('\n'),
  sandbox
);

assert.strictEqual(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z'), 'Aug 2, 2026');
assert.strictEqual(sandbox.formatISCompletedDate('2026-08-02'), 'Aug 2, 2026');
assert.ok(!/T|Z/.test(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z')), 'never raw ISO');
assert.ok(!/2026-08-02/.test(sandbox.formatISCompletedDate('2026-08-02T01:42:29.000Z')), 'never YYYY-MM-DD in table');
assert.strictEqual(sandbox.formatISCompletedDate('08/02/2026'), 'Aug 2, 2026');
assert.strictEqual(sandbox.formatISCompletedDate('August 2, 2026'), 'Aug 2, 2026');

const completed = sandbox.hydrateISComplianceRow({
  username:'aide1', empName:'Asha Aide', topicId:1,
  completed:'2026-08-02T01:42:29.000Z',
  scoreCorrect:9, scoreTotal:10, scorePercent:90,
  answers:JSON.stringify([1,2,1,3,1,1,1,1,1,0])
}, {username:'aide1', name:'Asha Aide'}, {id:1, title:'Diabetes', shortTitle:'Diabetes Complications', questions:new Array(10).fill({q:'q',options:['a','b'],answer:0})});
assert.strictEqual(completed.isCompleted, true);
assert.strictEqual(sandbox.formatISScoreColumn(completed), '9/10 · 90%');
assert.strictEqual(sandbox.formatISScoreBanner(completed), 'Score: 9/10 (90%)');
assert.strictEqual(sandbox.formatISCompletedDate(sandbox.certDateFromRecord(completed)), 'Aug 2, 2026');

const pending = sandbox.hydrateISComplianceRow({}, {username:'aide2', name:'Pat Pending'}, {id:1, title:'Diabetes', shortTitle:'Diabetes Complications'});
assert.strictEqual(pending.isCompleted, false);
assert.strictEqual(sandbox.formatISScoreColumn(pending), '—');

console.log('inservice-compliance-results-test: ok');
