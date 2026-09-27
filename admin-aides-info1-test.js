#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=aides-info1'), 'aides-info1 marker');
assert.ok(html.includes('admin-build 2026-09-27-aides-info1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aides-info1">'), 'meta');
assert.ok(html.includes('<!-- aides info cards 2026-09-27 v=aides-info1 admin-build 2026-09-27-aides-info1'), 'comment');
assert.ok(html.includes('GHOST-AIDES-INFO1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace CALLABLE'), 'ace callable');
assert.ok(html.includes('Mo LOOK LOCKED option 1 info cards'), 'locked look');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('mock 01-info-cards'), 'mock name');
assert.ok(html.includes('preferred_language_label'), 'lang field');
assert.ok(html.includes('en|es|ar|sw|zh|ru|uk'), 'lang allowlist');
assert.ok(html.includes('admin_list_aides_info() NOT admin_list_aides'), 'card paint rpc');
assert.ok(html.includes('p_include_deleted true'), 'deleted flag in contract');
assert.ok(html.includes('reset_aide_temp_password') && html.includes('never vs mossier'), 'reset stays the existing path');
assert.ok(html.includes('admin_deactivate_aide'), 'delete rpc');
assert.ok(html.includes('Nurse write is N/A') && html.includes('is_org_admin'), 'nurse read only');
assert.ok(html.includes('Remi is N/A for this marker'), 'remi n/a');
assert.ok(html.includes('No Auth') && html.includes('no Quo') && html.includes('no SMS'), 'no auth quo sms');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-aide-notif-search1'), 'first admin-build is aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-remi-langs1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after remi-langs1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc stays after cover-card-cancel1');
['2026-09-27-login-toast1','2026-09-27-aide-office-vis1','2026-09-27-remi-langs1','2026-09-27-hold-clear1','2026-09-27-sched-time-tap1','2026-09-27-aide-text-chat1','2026-09-27-remi-float-hide1','2026-09-27-tabbar-8','2026-09-27-cover-card-cancel1','2026-09-27-nosvc-reason-draft1','2026-09-27-cover-unselect1','2026-09-27-remi-payroll1','2026-09-27-client-ins1','2026-09-25-aidadel1','2026-09-25-aidecreds1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});
assert.ok(html.includes('v=login-toast1') && html.includes('v=aide-office-vis1') && html.includes('v=remi-langs1') && html.includes('v=hold-clear1') && html.includes('v=sched-time-tap1') && html.includes('v=aide-text-chat1') && html.includes('v=remi-float-hide1') && html.includes('v=tabbar-8') && html.includes('v=cover-card-cancel1') && html.includes('v=nosvc-reason-draft1') && html.includes('v=aidadel1'), 'prior markers stay');
assert.ok(html.includes('data-aides-info1="v=aides-info1"'), 'data attr');
assert.ok(html.includes("var AIDES_INFO1_MARKER='v=aides-info1'"), 'script marker');

const render = extractFn(html, 'async function renderAides(force)');
assert.ok(render.includes('aidesInfo1TryPaint'), 'card paint tries the info list first');
assert.ok(render.includes('Still on temp password'), 'bare-card fallback still paints temp password');
assert.ok(render.includes('badge-ok') && render.includes('Active'), 'bare-card fallback still paints Active');
assert.ok(render.includes('aideActionButtons'), 'bare-card fallback still uses shared actions');
assert.ok(html.includes("sbRestRpc('admin_list_aides', {p_include_deleted:!!includeDeleted})"), 'soft-delete list helper stays admin_list_aides');

const fetchFn = extractFn(html, 'async function aidesInfo1Fetch(includeDeleted)');
assert.ok(fetchFn.includes("sbRestRpc('admin_list_aides_info', {p_include_deleted:!!includeDeleted})"), 'info list body');
assert.ok(!/sbRestRpc\(\s*'admin_list_aides'\s*,/.test(fetchFn), 'card fetch does not call admin_list_aides');
const tipStart = html.indexOf('// v=aides-info1 Mo LOOK LOCKED');
const tipEnd = html.indexOf('// end v=aides-info1');
assert.ok(tipStart > 0 && tipEnd > tipStart, 'tip block bounds');
const tip = html.slice(tipStart, tipEnd);
assert.ok(!/mossier|admin_set_role_password|auth\.updateUser|Quo|twilio|send_sms/.test(tip), 'tip block does not reseal Auth or send SMS');
assert.ok(extractFn(html, 'function aidesInfo1Reset()').includes('confirmResetAideTempPassword'), 'reset uses the existing confirm');
assert.ok(extractFn(html, 'function aidesInfo1Delete()').includes('confirmSoftDeleteAide'), 'delete uses the existing soft-delete confirm');
assert.ok(extractFn(html, 'function aidesInfo1Restore()').includes('confirmRestoreAide'), 'recently deleted keeps Restore');
assert.ok(extractFn(html, 'function aidesInfo1ViewProfile()').includes('aidesInfo1Follow'), 'view profile follows deep_link');
assert.ok(!/sbRestRpc\(/.test(extractFn(html, 'function aidesInfo1Reset()') + extractFn(html, 'function aidesInfo1Delete()')), 'sheet does not invent an rpc');

const names = [
  'function escapeHtml(str)',
  'function escapeAttr(str)',
  'function formatAdminDate(val)',
  'function formatAdminDateCopy(text)',
  'function nciPhoneDigits(s)',
  'function formatPhoneDigits(digits,addTrailing)',
  'function formatUSPhoneDisplay(s)',
  'function aideTruth(v)',
  'function aideDeactivatedStamp(u)',
  'function aideOnDesk(u, desk)',
  'function canManageAides()',
  'function rememberAideRows(list)',
  'function aideEmptyHtml()',
  'function aidesInfo1Unwrap(data)',
  'function aidesInfo1Looks(row)',
  'function aidesInfo1Recognized(data)',
  'async function aidesInfo1Fetch(includeDeleted)',
  'function aidesInfo1Name(row)',
  'function aidesInfo1Initials(row)',
  'function aidesInfo1Phone(row)',
  'function aidesInfo1Lang(row)',
  'function aidesInfo1Clients(row)',
  'function aidesInfo1Tone(raw)',
  'function aidesInfo1Next(row)',
  'function aidesInfo1Creds(row)',
  'function aidesInfo1AsUser(row)',
  'function aidesInfo1Keep(row, desk)',
  'function aidesInfo1Key(user)',
  'function aidesInfo1AvatarColor(name)',
  'function aidesInfo1CardHtml(user)',
  'function aidesInfo1Follow(link)',
  'function aidesInfo1CloseSheet()',
  'function aidesInfo1OpenSheet(key)',
  'function aidesInfo1ViewProfile()',
  'function aidesInfo1Reset()',
  'function aidesInfo1Delete()',
  'function aidesInfo1Restore()',
  'async function aidesInfo1TryPaint(container, force)'
];
const src = [
  "var AIDES_INFO1_MARKER='v=aides-info1';",
  'var AIDES_INFO1_LANGS={en:1,es:1,ar:1,sw:1,zh:1,ru:1,uk:1};',
  "var AIDES_INFO1_AVATARS=['#2a7f7f','#1a2744','#1E6BB8','#1e6060'];",
  'var aidesInfo1ByKey={};',
  'var aidesInfo1Current=null;'
].concat(names.map(function(sig){return extractFn(html, sig);})).join('\n');

function classList(){
  const set = new Set();
  return {add:function(c){set.add(c);}, remove:function(c){set.delete(c);}, contains:function(c){return set.has(c);}, toggle:function(c,on){if(on)set.add(c);else set.delete(c);}};
}
function node(id){
  return {id:id, hidden:true, style:{display:''}, textContent:'', innerHTML:'', classList:classList()};
}
const els = {
  aidesContainer: node('aidesContainer'),
  aideInfoSheet: node('aideInfoSheet'),
  aideInfoSheetTitle: node('aideInfoSheetTitle'),
  aideInfoSheetActions: node('aideInfoSheetActions'),
  tab_schedule: node('tab_schedule'),
  tab_aides: node('tab_aides')
};
els.aidesContainer.hidden = false;
const calls = [];
const toasts = [];
const tabs = [];
const confirms = [];
const box = {
  aideDesk: 'active',
  currentAdminRole: 'Admin',
  loadedAidesList: [],
  allAidesForAssign: [],
  aideLookup: {},
  schedPendingDeepLink: null,
  Date: Date,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  document: {
    getElementById: function(id){return els[id] || null;},
    addEventListener: function(){}
  },
  evercareSbEnabled: function(){return true;},
  showTempMsg: function(msg){toasts.push(msg);},
  showTab: function(tab){tabs.push(tab);},
  confirmResetAideTempPassword: function(un){confirms.push(['reset', un]);},
  confirmSoftDeleteAide: function(un){confirms.push(['delete', un]);},
  confirmRestoreAide: function(un){confirms.push(['restore', un]);},
  aideCredsAfterAides: function(){},
  sbRestRpc: async function(name, body){
    calls.push({name:name, body:JSON.parse(JSON.stringify(body))});
    if(box.mode === 'missing')return {ok:false, status:404, error:'Could not find the function public.admin_list_aides_info'};
    if(box.mode === 'generic')return {ok:true, data:{success:true, data:[]}};
    if(body && body.p_include_deleted){
      return {ok:true, data:{aides:[{
        id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
        username:'oldaide',
        full_name:'Old Aide',
        phone:'2165550100',
        preferred_language_label:'sw',
        clients:[],
        next_status:'open',
        next_label:'Open',
        is_active:false,
        deactivated_at:'2026-09-20T12:00:00.000Z',
        deep_link:{surface:'aides'}
      }]}};
    }
    return {ok:true, data:{aides:[
      {
        id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        username:'jdoe',
        full_name:'Jane Doe',
        initials:'JD',
        phone:'2163775991',
        preferred_language_label:'es',
        clients:[{name:'Bowlax'},{name:'Rivera'},{name:'Bowlax'}],
        next_status:'next',
        next_label:'Next · 2026-09-28',
        is_active:true,
        deep_link:{client_id:'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', on_date:'2026-09-28', slot_key:'default'}
      },
      {
        id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        username:'sokonkwo',
        name:'Sam Okonkwo',
        phone:'2165550142',
        preferred_language_label:'en',
        preferred_language:'es',
        clients:['Chen'],
        next:'open',
        next_label:'Open',
        is_active:true
      },
      {
        id:'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
        username:'malvarez',
        full_name:'Maria Alvarez',
        phone:'4405550199',
        preferred_language_label:'ar',
        clients:[{name:'Patel'}],
        next_status:'warn',
        next_label:'Warn',
        creds_due:'2026-10-15',
        is_active:true,
        deep_link:{surface:'aides'}
      },
      {
        id:'ffffffff-ffff-4fff-8fff-ffffffffffff',
        username:'nolang',
        full_name:'No Lang',
        phone:'2165550111',
        preferred_language_label:'Spanish',
        clients:[],
        next_status:'next',
        next_label:'Next',
        is_active:true
      }
    ]}};
  },
  mode: 'rows'
};
vm.createContext(box);
vm.runInContext(src, box);

(async function(){
  assert.strictEqual(box.aidesInfo1Lang({preferred_language_label:'es'}), 'ES');
  assert.strictEqual(box.aidesInfo1Lang({preferred_language_label:'EN'}), 'EN');
  assert.strictEqual(box.aidesInfo1Lang({preferred_language_label:'Spanish', preferred_language:'es'}), '', 'a non-code label does not fall through to a second chip');
  assert.strictEqual(box.aidesInfo1Lang({preferred_language_label:'Spanish'}), '', 'full language name is not a chip');
  assert.strictEqual(box.aidesInfo1Lang({preferred_language:'fr'}), '', 'fr is outside the allowlist');
  assert.strictEqual(box.aidesInfo1Lang({preferred_language_label:'sw'}), 'SW');
  assert.strictEqual(box.aidesInfo1Creds({creds_due:'2026-10-15'}), 'Creds due 10/15/2026');
  assert.strictEqual(box.aidesInfo1Creds({}), '');
  assert.strictEqual(box.aidesInfo1Next({next_status:'next', next_label:'Next · 2026-09-28'}).tone, 'next');
  assert.strictEqual(box.aidesInfo1Next({next_status:'open'}).label, 'Open');
  assert.strictEqual(box.aidesInfo1Next({next_status:'warn'}).tone, 'warn');
  assert.strictEqual(box.aidesInfo1Initials({initials:'jd', full_name:'Jane Doe'}), 'JD');
  assert.strictEqual(box.aidesInfo1Phone({phone:'2163775991'}), '(216) 377-5991');

  const painted = await box.aidesInfo1TryPaint(els.aidesContainer, true);
  assert.strictEqual(painted, true);
  assert.strictEqual(calls[0].name, 'admin_list_aides_info');
  assert.deepStrictEqual(calls[0].body, {p_include_deleted:false});
  assert.ok(!calls.some(function(c){return c.name === 'admin_list_aides';}), 'card paint did not call admin_list_aides');
  const card = els.aidesContainer.innerHTML;
  assert.ok(card.includes('aide-info-card'), 'info cards');
  assert.ok(card.includes('Jane Doe') && card.includes('>JD<'), 'name and initials');
  assert.ok(card.includes('(216) 377-5991'), 'phone');
  assert.ok(card.includes('>ES<') && card.includes('>EN<') && card.includes('>AR<'), 'one uppercased lang chip each');
  assert.ok(!/>SPANISH</.test(card) && !/>FR</.test(card), 'no chip outside the allowlist');
  assert.strictEqual((card.match(/aide-info-lang/g) || []).length, 3, 'Jane, Sam, and Maria only');
  assert.ok(card.includes('Bowlax') && card.includes('Rivera') && card.includes('Chen') && card.includes('Patel'), 'client chips');
  assert.strictEqual((card.match(/Bowlax/g) || []).length, 1, 'duplicate client chip collapsed');
  assert.ok(card.includes('is-next') && card.includes('is-open') && card.includes('is-warn'), 'next tones');
  assert.ok(card.includes('Next · 09/28/2026'), 'next date is MM/DD/YYYY');
  assert.ok(card.includes('Creds due 10/15/2026'), 'creds due');
  assert.ok(card.includes('No Lang'), 'row with a non-code label still paints');
  const noLang = card.split('No Lang')[1] || '';
  assert.ok(noLang.indexOf('aide-info-lang') < 0 || noLang.indexOf('aide-info-card') < noLang.indexOf('aide-info-lang'), 'Spanish does not paint a chip on that card');

  box.aidesInfo1OpenSheet('jdoe');
  assert.strictEqual(els.aideInfoSheet.hidden, false);
  assert.ok(els.aideInfoSheetActions.innerHTML.indexOf('View profile') < els.aideInfoSheetActions.innerHTML.indexOf('Reset temp password'));
  assert.ok(els.aideInfoSheetActions.innerHTML.indexOf('Reset temp password') < els.aideInfoSheetActions.innerHTML.indexOf('>Delete<'));
  box.aidesInfo1ViewProfile();
  assert.strictEqual(tabs[tabs.length - 1], 'schedule');
  assert.strictEqual(box.schedPendingDeepLink.on_date, '2026-09-28');
  box.aidesInfo1OpenSheet('jdoe');
  box.aidesInfo1Reset();
  box.aidesInfo1OpenSheet('jdoe');
  box.aidesInfo1Delete();
  assert.deepStrictEqual(confirms, [['reset','jdoe'],['delete','jdoe']]);

  box.currentAdminRole = 'Nurse';
  box.aidesInfo1OpenSheet('malvarez');
  assert.ok(els.aideInfoSheetActions.innerHTML.includes('View profile'));
  assert.ok(!els.aideInfoSheetActions.innerHTML.includes('Reset temp password'));
  assert.ok(!els.aideInfoSheetActions.innerHTML.includes('>Delete<'));
  box.aidesInfo1Reset();
  assert.strictEqual(confirms.length, 2, 'nurse reset does not post');

  box.currentAdminRole = 'Scheduler';
  box.aidesInfo1OpenSheet('sokonkwo');
  assert.ok(els.aideInfoSheetActions.innerHTML.includes('Reset temp password'));

  box.currentAdminRole = 'Admin';
  box.aideDesk = 'deleted';
  calls.length = 0;
  const deletedPaint = await box.aidesInfo1TryPaint(els.aidesContainer, true);
  assert.strictEqual(deletedPaint, true);
  assert.deepStrictEqual(calls[0].body, {p_include_deleted:true});
  assert.ok(els.aidesContainer.innerHTML.includes('Old Aide'));
  assert.ok(els.aidesContainer.innerHTML.includes('>SW<'));
  assert.ok(!els.aidesContainer.innerHTML.includes('Jane Doe'));
  box.aidesInfo1OpenSheet('oldaide');
  assert.ok(els.aideInfoSheetActions.innerHTML.includes('Restore'));
  assert.ok(!els.aideInfoSheetActions.innerHTML.includes('Reset temp password'));
  assert.ok(!els.aideInfoSheetActions.innerHTML.includes('>Delete<'));
  box.aidesInfo1Restore();
  assert.deepStrictEqual(confirms[confirms.length - 1], ['restore','oldaide']);

  box.aideDesk = 'active';
  box.mode = 'generic';
  calls.length = 0;
  const fell = await box.aidesInfo1TryPaint(els.aidesContainer, false);
  assert.strictEqual(fell, false, 'unrecognized payload falls back');
  assert.strictEqual(calls[0].name, 'admin_list_aides_info');
  box.mode = 'missing';
  const missing = await box.aidesInfo1TryPaint(els.aidesContainer, false);
  assert.strictEqual(missing, false, 'missing callable falls back');
  console.log('admin-aides-info1-test: unit ok');
})().then(function(){
  return runBrowser();
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-aides-info1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDES_INFO1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const url = (req.url || '/').split('?')[0];
    const rel = url === '/' ? '/index.html' : url;
    const file = path.join(root, decodeURIComponent(rel));
    if(!file.startsWith(root)){res.writeHead(404); res.end('no'); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const calls = [];
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  function arm(page){
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort(); return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue(); return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){req.respond({status:204, headers:cors}); return;}
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let body = {};
      try{body = JSON.parse(req.postData() || '{}');}catch(e){}
      if(rpc)calls.push({rpc:rpc, body:body});
      let payload = {success:true, data:[]};
      if(rpc === 'admin_list_aides'){
        payload = {aides:[{id:'99999999-9999-4999-8999-999999999999', username:'shouldnot', full_name:'Should Not Paint', is_active:true}]};
      }else if(rpc === 'admin_list_aides_info'){
        const deleted = !!(body && body.p_include_deleted);
        payload = {aides: deleted ? [{
          id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
          username:'oldaide',
          full_name:'Old Aide',
          initials:'OA',
          phone:'2165550100',
          preferred_language_label:'sw',
          clients:[{name:'Ng'}],
          next_status:'open',
          next_label:'Open',
          is_active:false,
          deactivated_at:'2026-09-20T15:00:00.000Z',
          deep_link:{surface:'aides'}
        }] : [
          {
            id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
            username:'jdoe',
            full_name:'Jane Doe',
            initials:'JD',
            phone:'2163775991',
            preferred_language_label:'es',
            clients:[{name:'Bowlax'},{name:'Rivera'}],
            next_status:'next',
            next_label:'Next · 2026-09-28',
            is_active:true,
            deep_link:{client_id:'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', on_date:'2026-09-28', slot_key:'default'}
          },
          {
            id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
            username:'sokonkwo',
            full_name:'Sam Okonkwo',
            initials:'SO',
            phone:'2165550142',
            preferred_language_label:'en',
            clients:[{name:'Chen'}],
            next_status:'open',
            next_label:'Open',
            is_active:true,
            deep_link:{surface:'aides'}
          },
          {
            id:'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
            username:'malvarez',
            full_name:'Maria Alvarez',
            initials:'MA',
            phone:'4405550199',
            preferred_language_label:'ar',
            clients:[{name:'Patel'}],
            next_status:'warn',
            next_label:'Warn',
            creds_due:'2026-10-15',
            is_active:true,
            deep_link:{surface:'aides'}
          }
        ]};
      }
      req.respond({status:200, contentType:'application/json', headers:cors, body:JSON.stringify(payload)});
    });
  }
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token:'aides-info1-test',
        refresh_token:'aides-info1-refresh',
        profile:{org_id:'4f97f4d3-6635-4544-904c-6b06aa02d40b', role:'Scheduler'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=aides-info1', {waitUntil:'domcontentloaded', timeout:20000});
    const mark = calls.length;
    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('aides');
    });
    await page.waitForSelector('.aide-info-card', {timeout:8000});
    const paint = await page.evaluate(function(){
      var cards = Array.prototype.map.call(document.querySelectorAll('.aide-info-card'), function(card){
        return {
          name: (card.querySelector('.aide-info-name') || {}).textContent || '',
          initials: (card.querySelector('.aide-info-avatar') || {}).textContent || '',
          phone: (card.querySelector('.aide-info-phone') || {}).textContent || '',
          langs: Array.prototype.map.call(card.querySelectorAll('.aide-info-lang'), function(el){return el.textContent;}),
          clients: Array.prototype.map.call(card.querySelectorAll('.aide-info-client'), function(el){return el.textContent;}),
          next: (card.querySelector('.aide-info-next') || {}).className || '',
          nextText: (card.querySelector('.aide-info-next') || {}).textContent || '',
          creds: (card.querySelector('.aide-info-creds') || {}).textContent || ''
        };
      });
      return {
        cards: cards,
        sentinel: document.getElementById('aidesContainer').innerText.indexOf('Should Not Paint') >= 0,
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(paint.build, '2026-09-27-aide-notif-search1');
    assert.strictEqual(paint.sentinel, false, 'admin_list_aides rows are not the card paint');
    assert.strictEqual(paint.cards.length, 3);
    assert.deepStrictEqual(paint.cards[0].langs, ['ES']);
    assert.deepStrictEqual(paint.cards[1].langs, ['EN']);
    assert.deepStrictEqual(paint.cards[2].langs, ['AR']);
    assert.strictEqual(paint.cards[0].initials, 'JD');
    assert.strictEqual(paint.cards[0].phone, '(216) 377-5991');
    assert.deepStrictEqual(paint.cards[0].clients, ['Bowlax','Rivera']);
    assert.ok(paint.cards[0].next.indexOf('is-next') >= 0);
    assert.ok(paint.cards[1].next.indexOf('is-open') >= 0);
    assert.ok(paint.cards[2].next.indexOf('is-warn') >= 0);
    assert.strictEqual(paint.cards[2].creds, 'Creds due 10/15/2026');
    assert.ok(paint.cards[0].nextText.indexOf('09/28/2026') >= 0);
    const geom = await page.evaluate(function(){
      var card = document.querySelector('.aide-info-card');
      var name = card.querySelector('.aide-info-name');
      var more = card.querySelector('.aide-info-more');
      var nr = name.getBoundingClientRect();
      var mr = more.getBoundingClientRect();
      var cr = card.getBoundingClientRect();
      return {
        overlap: !(mr.bottom < nr.top || mr.top > nr.bottom),
        moreRight: mr.right,
        cardRight: cr.right,
        moreBelowName: mr.top > nr.bottom + 4
      };
    });
    assert.strictEqual(geom.overlap, true, 'ellipsis sits on the name row');
    assert.strictEqual(geom.moreBelowName, false, 'ellipsis is not under the name');
    assert.ok(geom.cardRight - geom.moreRight < 24, 'ellipsis sits on the right edge of the card');
    const infoCalls = calls.slice(mark).filter(function(c){return c.rpc === 'admin_list_aides_info';});
    assert.ok(infoCalls.length >= 1 && infoCalls[0].body.p_include_deleted === false, 'active tab posts p_include_deleted false');
    await page.screenshot({path: path.join(shotDir, 'aides-info1-phone-cards.png')});
    await page.click('.aide-info-card .aide-info-more');
    await page.waitForFunction(function(){
      var sheet = document.getElementById('aideInfoSheet');
      var actions = document.getElementById('aideInfoSheetActions');
      return sheet && !sheet.hidden && actions && /View profile/.test(actions.innerText) && /Reset temp password/.test(actions.innerText) && /Delete/.test(actions.innerText);
    }, {timeout:8000});
    await page.screenshot({path: path.join(shotDir, 'aides-info1-phone-sheet.png')});
    await page.evaluate(function(){aidesInfo1CloseSheet(); setAideDesk('deleted');});
    await page.waitForFunction(function(){
      var text = document.getElementById('aidesContainer').innerText || '';
      return text.indexOf('Old Aide') >= 0 && text.indexOf('Jane Doe') < 0;
    }, {timeout:8000});
    const deletedCall = calls.filter(function(c){return c.rpc === 'admin_list_aides_info' && c.body && c.body.p_include_deleted === true;});
    assert.ok(deletedCall.length >= 1, 'recently deleted posts p_include_deleted true');
    await page.click('.aide-info-card .aide-info-more');
    await page.waitForFunction(function(){
      var actions = document.getElementById('aideInfoSheetActions');
      return actions && /Restore/.test(actions.innerText) && !/Delete/.test(actions.innerText) && !/Reset temp password/.test(actions.innerText);
    }, {timeout:8000});
    await page.evaluate(function(){aidesInfo1CloseSheet();});
    await page.screenshot({path: path.join(shotDir, 'aides-info1-phone-deleted.png')});
    console.log('admin-aides-info1-test: browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
