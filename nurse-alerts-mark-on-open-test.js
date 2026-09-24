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

const loadFn = extractFn(html, 'async function loadAdminNurseSection()');
const afterFn = extractFn(html, 'async function loadAdminNurseAlertsAfterCompletes()');
const schedFn = extractFn(html, 'function scheduleDeferredNurseSheets()');
const refreshFn = extractFn(html, 'async function refreshCompletedNewClientIntakes()');
const markFn = extractFn(html, 'async function markNurseAlertsRead(ids)');
const fetchFn = extractFn(html, 'async function fetchUnreadNurseAlerts()');
const showTabFn = extractFn(html, 'function showTab(tab)');

assert.ok(loadFn, 'loadAdminNurseSection missing');
assert.ok(afterFn, 'loadAdminNurseAlertsAfterCompletes missing');
assert.ok(schedFn, 'scheduleDeferredNurseSheets missing');
assert.ok(refreshFn, 'refreshCompletedNewClientIntakes missing');
assert.ok(markFn, 'markNurseAlertsRead missing');
assert.ok(fetchFn, 'fetchUnreadNurseAlerts missing');
assert.ok(showTabFn, 'showTab missing');

assert.ok(showTabFn.includes("if(tab==='nurse')loadAdminNurseSection()"),
  'showTab(nurse) must call loadAdminNurseSection');
assert.ok(/onclick="loadAdminNurseSection\(\)"/.test(html),
  'Refresh must keep calling loadAdminNurseSection');

assert.ok(!/await\s+markNurseAlertsRead|fetchUnreadNurseAlerts|list_nurse_alerts|loadNurseActivityFeed/.test(loadFn),
  'loadAdminNurseSection must not await or start nurse-alert /exec');
assert.ok(!/await\s+markNurseAlertsRead/.test(afterFn),
  'deferred alerts must not await markNurseAlertsRead');
assert.ok(/void\s+markNurseAlertsRead\(ids\)/.test(afterFn),
  'mark must be fire-and-forget so Completes/Supervisory are not blocked');
assert.ok(loadFn.includes('clearAdminNurseAlertsUi()'),
  'must optimistically clear badge + unread list before lists/activity');
assert.ok(loadFn.indexOf('clearAdminNurseAlertsUi()') < loadFn.indexOf('refreshCompletedNewClientIntakes()'),
  'must clear Unread UI before the Completes refresh');
assert.ok(afterFn.includes('fetchUnreadNurseAlerts()'),
  'must fetch unread via list_nurse_alerts helper after the list paints');
assert.ok(loadFn.includes('refreshCompletedNewClientIntakes()'),
  'must still load Completes');
assert.ok(loadFn.includes('loadAdminSupervisoryContacts()'),
  'must still load Supervisory');
assert.ok(loadFn.indexOf('loadAdminSupervisoryContacts()') < loadFn.indexOf('await refreshCompletedNewClientIntakes()'),
  'Supervisory starts in parallel and does not wait on nurse-alert');
assert.ok(afterFn.includes('loadNurseActivityFeed()'),
  'must still load activity after alerts');
assert.ok(refreshFn.indexOf('cancelNurseSheetsFetches()') < refreshFn.indexOf('loadCompletedNewClientIntakes()'),
  'Refresh aborts in-flight Sheets /exec before the Ace list');
assert.ok(refreshFn.indexOf('loadCompletedNewClientIntakes()') < refreshFn.indexOf('scheduleDeferredNurseSheets()'),
  'nurse-alert /exec is scheduled only after the Completes list paints');
assert.ok(schedFn.includes('loadAdminNurseAlertsAfterCompletes()'),
  'Admin/Scheduler defer list_nurse_alerts until after Completes');

assert.ok(fetchFn.includes("action:'list_nurse_alerts'"),
  'fetch must use Ace list_nurse_alerts');
assert.ok(fetchFn.includes("['items','alerts','data','rows']"),
  'list_nurse_alerts must read Ace items[].id first');
assert.ok(fetchFn.includes('username'),
  'list_nurse_alerts must send {username}');
assert.ok(/markNurseAlertsRead\(ids\)\.then/.test(afterFn),
  'after mark, must re-fetch list_nurse_alerts to sync badge');
assert.ok(markFn.includes("action:'mark_nurse_alerts_read'"),
  'mark must use Ace mark_nurse_alerts_read');
assert.ok(/username,ids:list/.test(markFn),
  'mark payload must be {username, ids[]}');
assert.ok(!/list_admin_alerts|get_nurse_activity_unread|visitId/.test(loadFn+afterFn+fetchFn+markFn),
  'must not invent Ace actions/fields');

const appendFn = extractFn(html, 'function appendNurseActivityFeed(items)');
assert.ok(appendFn.includes('adminNurseAlerts&&adminNurseAlerts.length'),
  'activity feed Unread labels still gated on adminNurseAlerts');

function makeEl(id, html){
  return {id, hidden:false, className:'', classList:{add(){},remove(){}}, textContent:'', innerHTML:html||''};
}

async function runRole(role){
  const events = [];
  let markStarted = false;
  let markFinished = false;
  let listsFinished = false;
  let activitySawUnread = false;

  const badge = makeEl('nav_nurse_badge');
  badge.textContent = '8';
  badge.hidden = false;
  const list = makeEl('adminNurseAlertsList', '<span class="badge badge-warn">Unread</span>');
  const completes = makeEl('nciCompletedAdminBody');
  const supervisory = makeEl('adminSupervisoryBody');
  const els = {
    nav_nurse_badge: badge,
    adminNurseAlertsList: list,
    nciCompletedAdminBody: completes,
    adminSupervisoryBody: supervisory
  };
  const document = {getElementById(id){ return els[id] || null; }};

  let currentAdminRole = role;
  let currentAdminUsername = role === 'Admin' ? 'admin' : 'scheduler';
  let currentNurseName = null;
  let adminNurseAlerts = [
    {id:'a1',type:'intake',refId:'1',clientName:'Ada',nurseUsername:'rn',createdAt:''},
    {id:'a2',type:'visit',refId:'2',clientName:'Bea',nurseUsername:'rn',createdAt:''}
  ];

  function portalUsername(){
    return String(currentAdminUsername||currentNurseName||currentAdminRole||'').trim();
  }
  function nurseListRows(data,keys){
    if(!data)return [];
    if(Array.isArray(data))return data;
    const names=keys||['items','alerts','data','rows'];
    for(let i=0;i<names.length;i++){
      const v=data[names[i]];
      if(Array.isArray(v))return v;
    }
    return [];
  }
  function mapNurseAlertRow(a){
    return {
      id:a&&a.id!=null?String(a.id):'',
      type:a&&a.type?String(a.type):'',
      refId:a&&a.refId!=null?String(a.refId):'',
      clientName:(a&&a.clientName)||'',
      nurseUsername:(a&&a.nurseUsername)||'',
      createdAt:(a&&a.createdAt)||''
    };
  }
  function setNurseAlertBadge(n){
    const count=Number(n)||0;
    badge.textContent=String(count);
    badge.hidden = count<=0;
    events.push({t:'badge',n:count});
  }
  function paintAdminNurseAlerts(alerts){
    if(!alerts||!alerts.length){
      list.innerHTML='<p class="nci-hint">No unread nurse alerts.</p>';
    }else{
      list.innerHTML=alerts.map(()=>'<span class="badge badge-warn">Unread</span>').join('');
    }
    events.push({t:'paint',n:(alerts||[]).length});
  }
  function clearAdminNurseAlertsUi(){
    adminNurseAlerts=[];
    setNurseAlertBadge(0);
    paintAdminNurseAlerts([]);
  }
  let listed = 0;
  async function apiPost(payload){
    events.push({t:'api',action:payload.action,payload});
    if(payload.action==='list_nurse_alerts'){
      assert.strictEqual(payload.username, currentAdminUsername);
      listed++;
      if(listed>1){
        return {success:true,items:[]};
      }
      return {success:true,items:[
        {id:'n1',type:'intake',refId:'10',clientName:'Cara',nurseUsername:'rn',createdAt:'2026-09-21'},
        {id:'n2',type:'visit',refId:'11',clientName:'Dee',nurseUsername:'rn',createdAt:'2026-09-21'}
      ]};
    }
    if(payload.action==='mark_nurse_alerts_read'){
      markStarted = true;
      assert.strictEqual(payload.username, currentAdminUsername);
      assert.deepStrictEqual(payload.ids, ['n1','n2']);
      await new Promise(r=>setTimeout(r, 80));
      markFinished = true;
      return {success:true};
    }
    throw new Error('unexpected action '+payload.action);
  }
  async function fetchUnreadNurseAlerts(){
    if(currentAdminRole!=='Admin'&&currentAdminRole!=='Scheduler')return [];
    const username=portalUsername();
    if(!username)return [];
    const data=await apiPost({action:'list_nurse_alerts',username});
    if(!(data&&data.success))return [];
    return nurseListRows(data,['items','alerts','data','rows']).map(mapNurseAlertRow).filter(a=>a.id);
  }
  async function markNurseAlertsRead(ids){
    const username=portalUsername();
    const listIds=(ids||[]).map(String).filter(Boolean);
    if(!username||!listIds.length)return;
    await apiPost({action:'mark_nurse_alerts_read',username,ids:listIds});
  }
  async function refreshCompletedNewClientIntakes(){
    events.push({t:'completes-start'});
    await new Promise(r=>setTimeout(r, 20));
    completes.innerHTML='<tr><td>ok</td></tr>';
    events.push({t:'completes-painted'});
    listsFinished = true;
    scheduleDeferredNurseSheets();
  }
  function scheduleDeferredNurseSheets(){
    void loadAdminNurseAlertsAfterCompletes();
  }
  async function loadAdminSupervisoryContacts(){
    supervisory.innerHTML='<tr><td>ok</td></tr>';
  }
  async function loadNurseActivityFeed(){
    activitySawUnread = !!(adminNurseAlerts && adminNurseAlerts.length);
    const hasUnread=adminNurseAlerts&&adminNurseAlerts.length;
    if(hasUnread){
      list.innerHTML += '<span class="badge badge-warn">Unread</span>';
    }else{
      list.innerHTML = '<div>Latest activity</div>';
    }
  }
  async function loadAdminNurseAlertsAfterCompletes(){
    const alerts=await fetchUnreadNurseAlerts();
    const ids=alerts.map(a=>a.id).filter(Boolean);
    adminNurseAlerts=[];
    if(ids.length){
      void markNurseAlertsRead(ids).then(async()=>{
        const leftover=await fetchUnreadNurseAlerts();
        adminNurseAlerts=[];
        setNurseAlertBadge(leftover.length);
      });
    }
    await loadNurseActivityFeed();
  }

  async function loadAdminNurseSection(){
    if(currentAdminRole!=='Admin'&&currentAdminRole!=='Scheduler')return;
    clearAdminNurseAlertsUi();
    const supervisoryP=loadAdminSupervisoryContacts();
    await refreshCompletedNewClientIntakes();
    await supervisoryP;
  }

  await loadAdminNurseSection();

  const paintAt = events.findIndex(e=>e.t==='completes-painted');
  const alertAt = events.findIndex(e=>e.action==='list_nurse_alerts');
  assert.ok(paintAt>=0 && alertAt>paintAt, role+': list_nurse_alerts starts only after Completes paints');
  assert.ok(listsFinished, role+': Completes/Supervisory must finish');
  assert.ok(markStarted, role+': mark_nurse_alerts_read must fire on open');
  assert.strictEqual(markFinished, false, role+': lists/activity must not wait for mark to finish');
  assert.strictEqual(badge.textContent, '0', role+': badge cleared on open');
  assert.strictEqual(badge.hidden, true, role+': badge hidden on open');
  assert.ok(!/Unread/.test(list.innerHTML), role+': activity must not resurrect Unread labels');
  assert.strictEqual(activitySawUnread, false, role+': adminNurseAlerts must be [] before activity');
  assert.ok(completes.innerHTML.includes('ok'), role+': Completes still load');
  assert.ok(supervisory.innerHTML.includes('ok'), role+': Supervisory still load');
  assert.deepStrictEqual(adminNurseAlerts, [], role+': adminNurseAlerts cleared');

  const markCall = events.find(e=>e.action==='mark_nurse_alerts_read');
  assert.ok(markCall, role+': mark posted');
  assert.deepStrictEqual(Object.keys(markCall.payload).sort(), ['action','ids','username']);

  await new Promise(r=>setTimeout(r, 120));
  assert.ok(markFinished, role+': mark eventually finishes');
  assert.ok(events.filter(e=>e.action==='list_nurse_alerts').length>=2,
    role+': must re-fetch list_nurse_alerts after mark');
  assert.strictEqual(badge.textContent, '0', role+': re-fetch empty list keeps badge 0');
  assert.ok(!/Unread/.test(list.innerHTML), role+': re-fetch must not resurrect Unread');

  return {events, markFinished};
}

(async function(){
  const admin = await runRole('Admin');
  const sched = await runRole('Scheduler');
  assert.ok(admin.events.some(e=>e.action==='list_nurse_alerts'));
  assert.ok(sched.events.some(e=>e.action==='list_nurse_alerts'));
  console.log('nurse-alerts-mark-on-open-test: PASS');
})().catch(err=>{
  console.error(err);
  process.exit(1);
});
