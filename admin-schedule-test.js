#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('<!-- admin schedule 2026-09-24 v=sched1'), 'schedule tip marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-sched1">'), 'admin-build meta');
assert.ok(html.includes('<!-- admin-role-password 2026-09-24 v=adminpw1 Ace admin_set_role_password -->'), 'adminpw1 marker stays');
assert.ok(html.includes('No patterns yet — Add usual pattern'), 'empty-state copy');

const nurseAt = html.indexOf('id="nav_nurse"');
const schedAt = html.indexOf('id="nav_schedule"');
assert.ok(nurseAt > 0 && schedAt > nurseAt, 'Schedule nav follows Nurse');
assert.ok(html.slice(nurseAt, schedAt).indexOf('id="nav_completes"') < 0, 'Schedule sits before Completed intakes');
assert.ok(html.includes('onclick="showTab(\'schedule\')"'), 'nav uses showTab(schedule)');
assert.ok(html.includes("if(tab==='schedule')loadAdminSchedule();"), 'showTab loads the schedule');
assert.ok(html.includes('id="tab_schedule"') && html.includes('id="tab_nurse"'), 'schedule is its own tab');
assert.ok(html.indexOf('id="tab_timesheets"') < html.indexOf('id="tab_schedule"'), 'timesheets desk stays');

const start = html.indexOf('// admin schedule v=sched1');
const end = html.indexOf('// end admin schedule v=sched1');
assert.ok(start > 0 && end > start, 'schedule script block');
const src = html.slice(start, end);
assert.ok(!/SHEETS_URL/.test(src), 'schedule does not call Sheets');
assert.ok(!/\/exec/.test(src), 'schedule does not post /exec');
assert.ok(src.includes('evercare_sched_v1'), 'stub key');
assert.ok(src.includes('Ace will replace'), 'stub comment names Ace');
assert.ok(src.includes("sbRestRpc('list_schedule_week'") && src.includes('p_week_start'), 'week RPC');
assert.ok(src.includes("sbRestRpc('upsert_schedule_pattern'") && src.includes('p_usual_aide_id'), 'pattern RPC');
assert.ok(src.includes("sbRestRpc('upsert_schedule_exception'") && src.includes('p_on_date') && src.includes('p_kind'), 'exception RPC');
assert.ok(src.includes("'schedule_patterns'") && src.includes("'schedule_exceptions'"), 'Ace table names');

const mem = {};
const toasts = [];
const rpc = [];
const els = {};
function makeEl(id){
  const el = {
    id:id,
    hidden:false,
    innerHTML:'',
    textContent:'',
    value:'',
    disabled:false,
    checked:false,
    dataset:{},
    style:{},
    setAttribute:function(k,v){this[k]=v;},
    getAttribute:function(k){return this[k];},
    addEventListener:function(){},
    scrollIntoView:function(){this.scrolled=true;},
    focus:function(){}
  };
  els[id]=el;
  return el;
}
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedScroll','schedHead','schedBody','schedPanel','schedPanelTitle','schedUsualFields','schedExceptionMeta','schedCalloffWrap','schedClearBtn','schedSaveBtn','schedClientSel','schedWeekdaySel','schedAideSel','schedHours','schedCalloff','schedNote','schedWhen','schedUsualAide','schedFilterOpen','schedFilterCalloff','schedSearch'].forEach(makeEl);

const sandbox = {
  allClients:[],
  loadedAidesList:[],
  allAidesForAssign:[],
  currentAdminRole:'Admin',
  localStorage:{
    getItem:function(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},
    setItem:function(k,v){mem[k]=String(v);},
    removeItem:function(k){delete mem[k];}
  },
  document:{
    getElementById:function(id){
      if(els[id])return els[id];
      if(els.schedBody&&String(els.schedBody.innerHTML).indexOf('id="'+id+'"')>=0){
        return {scrollIntoView:function(){this.scrolled=true;}};
      }
      return null;
    }
  },
  showTempMsg:function(msg){toasts.push(String(msg));},
  logActivity:function(){},
  sbUuid:function(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));},
  evercareSbEnabled:function(){return true;},
  readSbSession:function(){return null;},
  sbRestRpc:function(name, body){rpc.push({name:name, body:body}); return Promise.resolve({ok:true, data:{patterns:[], exceptions:[]}});},
  sbRestGet:function(){return Promise.resolve({ok:false, status:404, error:'missing'});},
  apiGetCached:async function(){return {success:false};},
  Intl:Intl,
  Date:Date,
  Number:Number,
  String:String,
  Math:Math,
  JSON:JSON,
  isFinite:isFinite,
  Promise:Promise
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

assert.strictEqual(sandbox.schedIsoDate(sandbox.schedMondayOf(new Date(2026,8,24))), '2026-09-21');
assert.strictEqual(sandbox.schedIsoDate(sandbox.schedMondayOf(new Date(2026,8,21))), '2026-09-21');
assert.strictEqual(sandbox.schedIsoDate(sandbox.schedMondayOf(new Date(2026,8,27))), '2026-09-21');
assert.strictEqual(sandbox.schedWeekdayFromIso('2026-09-21'), 1);
assert.strictEqual(sandbox.schedWeekdayFromIso('2026-09-27'), 7);
assert.strictEqual(sandbox.schedAddDays('2026-09-21', 7), '2026-09-28');
assert.strictEqual(sandbox.schedFormatHours(4), '4h');
assert.strictEqual(sandbox.schedFormatHours(4.5), '4.5h');

sandbox.schedApplyPayload({
  schedule_patterns:[
    {client_id:'ada', weekday:1, usual_aide_id:'a1', hours:'4', is_active:true},
    {client_id:'ada', weekday:2, usual_aide_id:'a1', hours:4, is_active:false}
  ],
  schedule_exceptions:[
    {client_id:'ada', on_date:'2026-09-23', kind:'call_off', aide_id:'a1', hours:4, note:'sick', is_active:true}
  ]
});
assert.strictEqual(sandbox.schedUsual.length, 1, 'inactive usual pattern is skipped');
assert.strictEqual(sandbox.schedExceptions.length, 1);
assert.strictEqual(sandbox.schedExceptions[0].kind, 'call_off');

sandbox.allClients=[{id:'ada', name:'Ada Client'},{id:'bea', name:'Bea Client'}];
sandbox.loadedAidesList=[{id:'a1', username:'sara', name:'Sara'}];
sandbox.schedWeekStart='2026-09-21';
sandbox.schedUsual=[{client_id:'ada', weekday:1, usual_aide_id:'a1', hours:4, note:''}];
sandbox.schedExceptions=[
  {client_id:'ada', on_date:'2026-09-23', aide_id:'a1', hours:4, note:'sick', kind:'call_off'},
  {client_id:'bea', on_date:'2026-09-22', aide_id:'a1', hours:3, note:'', kind:'exception'}
];
sandbox.schedFilterOpen=false;
sandbox.schedFilterCalloff=false;
const allRows=sandbox.schedBuildRows();
assert.strictEqual(allRows.length, 2);
assert.strictEqual(allRows[0].hide, false);
const mon=allRows[0].cells[0];
const tue=allRows[0].cells[1];
const wed=allRows[0].cells[2];
assert.strictEqual(mon.state, 'usual');
assert.strictEqual(sandbox.schedCellText(mon), 'Sara 4h');
assert.strictEqual(tue.state, 'open');
assert.strictEqual(sandbox.schedCellText(tue), '');
assert.strictEqual(wed.state, 'calloff');
assert.strictEqual(sandbox.schedCellText(wed), 'Sara 4h');
assert.strictEqual(allRows[1].cells[1].state, 'exception');
assert.strictEqual(sandbox.schedCellText(allRows[1].cells[1]), 'Sara 3h');

sandbox.schedFilterOpen=true;
sandbox.schedFilterCalloff=false;
const openRows=sandbox.schedBuildRows().filter(function(r){return !r.hide;});
assert.ok(openRows.length===2, 'both clients have an open day');
assert.strictEqual(openRows[0].cells[0].shrunk, true, 'staffed Monday shrinks when Open is on');
assert.strictEqual(openRows[0].cells[1].shrunk, false, 'open Tuesday stays');
assert.strictEqual(openRows[0].cells[2].shrunk, true, 'call-off shrinks under the Open filter');

sandbox.schedFilterOpen=false;
sandbox.schedFilterCalloff=true;
const callRows=sandbox.schedBuildRows();
assert.strictEqual(callRows[0].hide, false);
assert.strictEqual(callRows[1].hide, true, 'Bea has no call-off');
assert.strictEqual(callRows[0].cells[2].shrunk, false);
assert.strictEqual(callRows[0].cells[0].shrunk, true);

sandbox.schedFilterOpen=true;
sandbox.schedFilterCalloff=true;
const both=sandbox.schedBuildRows();
assert.strictEqual(both[0].hide, false);
assert.strictEqual(both[1].hide, false, 'Bea stays because Tuesday is open');
assert.strictEqual(both[0].cells[0].shrunk, true);
assert.strictEqual(both[0].cells[1].shrunk, false);
assert.strictEqual(both[0].cells[2].shrunk, false);
assert.strictEqual(both[1].cells[1].shrunk, true, 'reassigned cell shrinks when it is not a problem');

sandbox.schedFilterOpen=false;
sandbox.schedFilterCalloff=false;
sandbox.schedAceLive=false;
sandbox.schedPaint();
assert.ok(els.schedBody.innerHTML.includes('Sara 4h'), 'grid shows aide and hours');
assert.ok(els.schedBody.innerHTML.includes('is-calloff'), 'call-off cell class');
assert.ok(els.schedBody.innerHTML.includes('>Open<')||els.schedBody.innerHTML.includes('sched-open">Open'), 'empty cell reads Open');
assert.ok(els.schedHead.innerHTML.includes('Mon')&&els.schedHead.innerHTML.includes('Sun'), 'day headers');
assert.strictEqual(els.schedWeekLabel.textContent, 'Sep 21 – Sep 27, 2026');
assert.ok(/evercare_sched_v1/.test(els.schedSourceNote.textContent), 'stub status');

sandbox.schedFilterCalloff=true;
els.schedSearch.value='Bea';
sandbox.schedJumpClient();
assert.strictEqual(sandbox.schedJumpId, 'bea');
assert.strictEqual(sandbox.schedFilterCalloff, false, 'search reveals a filtered-out row');
assert.ok(els.schedBody.innerHTML.includes('is-jump'), 'matching row is marked');
assert.ok(els.schedBody.innerHTML.indexOf('Bea Client')>=0);

(async function main(){
assert.strictEqual(sandbox.schedCanEdit(), true);
sandbox.currentAdminRole='Scheduler';
assert.strictEqual(sandbox.schedCanEdit(), true);
sandbox.currentAdminRole='Nurse';
assert.strictEqual(sandbox.schedCanEdit(), false);
sandbox.schedEditor={mode:'usual', clientId:'ada', weekday:1};
const before=mem[sandbox.SCHED_STUB_KEY];
await sandbox.schedSavePanel();
assert.ok(toasts.some(function(t){return /Admin and Scheduler/.test(t);}), 'Nurse cannot save');
assert.strictEqual(mem[sandbox.SCHED_STUB_KEY], before);

sandbox.currentAdminRole='Scheduler';
sandbox.schedAceLive=false;
sandbox.schedUsual=[];
sandbox.schedExceptions=[];
sandbox.schedEditor={mode:'usual'};
els.schedClientSel.value='ada';
els.schedWeekdaySel.value='1';
els.schedAideSel.value='a1';
els.schedHours.value='4';
els.schedNote.value='usual week';
await sandbox.schedSaveUsualFromForm();
assert.strictEqual(sandbox.schedUsual.length, 1);
assert.strictEqual(sandbox.schedUsual[0].usual_aide_id, 'a1');
assert.strictEqual(sandbox.schedUsual[0].hours, 4);
const stored=JSON.parse(mem.evercare_sched_v1);
assert.strictEqual(stored.usual.length, 1);
assert.ok(!rpc.some(function(c){return c.name==='upsert_schedule_pattern';}), 'stub save does not hit Ace');

sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
els.schedAideSel.value='a1';
els.schedHours.value='4';
els.schedCalloff.checked=true;
els.schedNote.value='sick';
await sandbox.schedSaveExceptionFromForm();
assert.strictEqual(sandbox.schedUsual.length, 1, 'cell edit does not rebuild the usual week');
assert.strictEqual(sandbox.schedExceptions.length, 1);
assert.strictEqual(sandbox.schedExceptions[0].kind, 'call_off');
assert.strictEqual(sandbox.schedCellFor('ada','2026-09-23',3).state, 'calloff');
assert.strictEqual(sandbox.schedCellFor('ada','2026-09-21',1).state, 'usual');

sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedClearPanel();
assert.strictEqual(sandbox.schedExceptions.length, 0);
assert.strictEqual(sandbox.schedCellFor('ada','2026-09-23',3).state, 'open');
assert.strictEqual(sandbox.schedFindUsual('ada',1).hours, 4, 'clearing an exception leaves the usual pattern');

delete mem.evercare_sched_v1;
rpc.length=0;
sandbox.schedAceLive=true;
sandbox.schedUsual=[];
sandbox.schedExceptions=[];
var officeAide='11111111-1111-4111-8111-111111111111';
sandbox.loadedAidesList=[{id:officeAide, username:'sara', name:'Sara'}];
sandbox.readSbSession=function(){return {access_token:'office'};};
sandbox.sbRestRpc=function(name, body){
  rpc.push({name:name, body:body});
  if(name==='list_schedule_week')return Promise.resolve({ok:true, data:{patterns:[], exceptions:[]}});
  return Promise.resolve({ok:true, data:{ok:true}});
};
sandbox.schedEditor={mode:'usual'};
els.schedClientSel.value='ada';
els.schedWeekdaySel.value='3';
els.schedAideSel.value=officeAide;
els.schedHours.value='6';
els.schedNote.value='';
await sandbox.schedSaveUsualFromForm();
const patternCall=rpc.find(function(c){return c.name==='upsert_schedule_pattern';});
assert.ok(patternCall, 'office save uses upsert_schedule_pattern');
assert.strictEqual(patternCall.body.p_client_id, 'ada');
assert.strictEqual(patternCall.body.p_weekday, 3);
assert.strictEqual(patternCall.body.p_usual_aide_id, officeAide);
assert.strictEqual(patternCall.body.p_hours, 6);
assert.strictEqual(mem.evercare_sched_v1, undefined, 'live save does not write the stub');
assert.ok(rpc.some(function(c){return c.name==='list_schedule_week'&&c.body.p_week_start==='2026-09-21';}));

sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
els.schedAideSel.value='';
els.schedHours.value='';
els.schedCalloff.checked=false;
els.schedNote.value='uncovered';
await sandbox.schedSaveExceptionFromForm();
const exCall=rpc.filter(function(c){return c.name==='upsert_schedule_exception';}).pop();
assert.strictEqual(exCall.body.p_kind, 'open');
assert.strictEqual(exCall.body.p_on_date, '2026-09-23');
assert.strictEqual(exCall.body.p_aide_id, null);

console.log('admin-schedule-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
