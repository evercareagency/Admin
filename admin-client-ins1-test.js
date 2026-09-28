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

assert.ok(html.includes('v=client-ins1'), 'client-ins1 marker');
assert.ok(html.includes('data-client-ins1="v=client-ins1"'), 'client-ins1 data attr');
assert.ok(html.includes('<!-- client insurance tint 2026-09-27 v=client-ins1 admin-build 2026-09-27-client-ins1'), 'client-ins1 comment');
assert.ok(html.includes('GHOST-CLIENT-INS1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE'), 'Ace CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes("var CLIENT_INS1_MARKER='v=client-ins1'"), 'script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-chat1'), 'first admin-build is remi-payroll1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-client-ins1"') < html.indexOf('content="2026-09-27-remi-ideas763"'), 'ideas763 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-remi-ideas763"') < html.indexOf('content="2026-09-27-remi-float-noshow1"'), 'float-noshow1 stays after ideas763');
assert.ok(html.indexOf('content="2026-09-27-remi-float-noshow1"') < html.indexOf('content="2026-09-27-remi-proof1"'), 'remi-proof1 stays after float');
['v=remi-ideas763','v=remi-float-noshow1','v=clienthrs1a','v=clienthrs1b','v=clienthrs1c','v=clienthrs1d','v=sched1','v=coverage-simple1','v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=remi-cm-email1','v=remiface1','v=vapid1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-ideas763">'), 'ideas763 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-noshow1">'), 'float-noshow1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-proof1">'), 'remi-proof1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1a">'), 'clienthrs1a meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1b">'), 'clienthrs1b meta stays');
assert.ok(html.includes('<!-- remi job receipts 2026-09-27 v=remi-proof1'), 'remi-proof1 comment untouched');
assert.ok(html.includes('--caresource:#6B2D8B'), 'CareSource hex');
assert.ok(html.includes('--passport:#E6B800'), 'Passport hex');
assert.ok(html.includes('--anthem:#1E6BB8'), 'Anthem hex');
assert.ok(html.includes('--molina:#C62828'), 'Molina hex');
assert.ok(html.includes('--buckeye:#1B8A3E'), 'Buckeye hex');
assert.ok(html.includes('admin_list_insurance_plans'), 'catalog rpc');
assert.ok(html.includes('admin_update_client_insurance'), 'edit rpc');
assert.ok(html.includes('p_insurance_plan'), 'optional add arg');
assert.ok(html.includes('p_weekly_authorized_hours'), 'hours arg stays');
assert.ok(html.includes('id="clientInsChips"'), 'chip picker');
assert.ok(html.includes('id="clientInsLegend"'), 'client legend');
assert.ok(html.includes('id="schedInsLegend"'), 'schedule legend');
assert.ok(html.includes('>CareSource<') && html.includes('>Passport<') && html.includes('>Anthem<') && html.includes('>Molina<') && html.includes('>Buckeye<'), 'five plan labels');

const select = (html.match(/var SB_CLIENT_SELECT='([^']+)'/) || [])[1];
assert.ok(select.includes('insurance_plan'), 'client list selects insurance_plan');
assert.ok(select.includes('weekly_authorized_hours'), 'hours column stays on the select');

const modal = html.slice(html.indexOf('id="clientModal"'), html.indexOf('id="locationMapModal"'));
assert.ok(modal.includes('id="clientInsurancePlan"'), 'hidden plan value');
assert.ok(modal.indexOf('clientWeeklyHours') < modal.indexOf('Assigned Aides'), 'hours stay above Assigned Aides');
assert.ok(modal.indexOf('Verify Address') < modal.indexOf('clientWeeklyHours'), 'verify address stays above hours');
assert.ok(modal.includes('Optional. Blank is fine for an older client.'), 'null plan is allowed');
assert.ok(!modal.includes('Member ID'), 'member id is not on this tip');

const insFns = html.slice(html.indexOf('function sbClientInsState()'), html.indexOf('function sbClientWriteBody'));
assert.ok(!/reset_aide_temp_password|admin_set_role_password|\bQuo\b|twilio|send_sms/.test(insFns), 'no auth reseal and no SMS in the insurance write');
const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
assert.ok(!html.slice(schedStart, schedEnd).includes('list_schedule_week_slots'), 'single-slot block does not switch RPCs');

const plansSrc = html.slice(html.indexOf('var CLIENT_INS_PLANS='), html.indexOf(';', html.indexOf('var CLIENT_INS_PLANS=')) + 1);
const names = [
  'function clientInsPack(row)',
  'function sbClientHoursState()',
  'function sbClientHoursValue(payload)',
  'function sbClientHoursColumnMissing(got)',
  'function sbClientHoursRpcMissing(got)',
  'function sbClientHoursRpcBodies(payload)',
  'function sbClientDeskPayload(payload)',
  'function sbClientDeskBody(payload)',
  'function sbCoord(v)',
  'function sbOrgId()',
  'function sbClientWriteBody(payload, isCreate)',
  'async function sbPatchClientHours(id, hours)',
  'function sbClientInsState()',
  'function sbClientInsPlan(payload)',
  'function sbClientInsColumnMissing(got)',
  'function sbClientInsRpcMissing(got)',
  'function sbClientInsDenied(got, err)',
  'async function sbUpdateClientInsurance(id, plan)',
  'async function sbAdminUpdateClient(payload)',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed)',
  'async function sbRestRpc(fnName, body)',
  'function sbFilterQuery(pairs)',
  'function sbAuthErrorMessage(data,status)',
  'function readSbSession()',
  'function sbActiveLinks(rows)',
  'function sbMapClient(row)',
  'function sbFirstRow(data)',
  'function sbRpcNode(data)',
  'function sbRpcError(node)',
  'function sbAsJsonObject(v)',
  'async function sbTrySaveClientDesk(payload)',
  'function sbAssignedNames(payload)',
  'async function clientInsLoadPlans()',
  'function schedInsPack(row)',
  'function schedEsc(s)',
  'function schedAttr(s)',
  'function schedInsNameHtml(name, pack)'
];
const src = plansSrc + '\n' + names.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

function harness(route){
  const calls = [];
  const box = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    SB_CLIENT_SELECT: select,
    fetch: function(url, init){
      calls.push({url:String(url), init:init||{}});
      const res = route(String(url), init||{});
      return Promise.resolve({
        ok: res.ok !== false && (res.status||200) < 400,
        status: res.status||200,
        text: function(){return Promise.resolve(res.raw==null?'':res.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    Date: Date,
    Object: Object,
    Array: Array,
    Number: Number,
    isFinite: isFinite,
    encodeURIComponent: encodeURIComponent
  };
  vm.createContext(box);
  vm.runInContext(src, box);
  box.readSbSession = function(){return {access_token:'office-jwt'};};
  return {box:box, calls:calls};
}

const idle = harness(function(){return {status:500, raw:'{}'};}).box;
assert.strictEqual(idle.clientInsPack({}).plan, '', 'missing plan is blank');
assert.strictEqual(idle.clientInsPack({insurance_plan:null}).plan, '', 'null plan is blank');
assert.strictEqual(idle.clientInsPack({insurance_plan:'CareSource'}).plan, 'caresource', 'key is case-insensitive');
assert.strictEqual(idle.clientInsPack({insurance_plan:'caresource'}).color, '#6B2D8B');
assert.strictEqual(idle.clientInsPack({insurance_plan:'passport'}).color, '#E6B800');
assert.strictEqual(idle.clientInsPack({insurance_plan:'anthem'}).color, '#1E6BB8');
assert.strictEqual(idle.clientInsPack({insurance_plan:'molina'}).label, 'Molina');
assert.strictEqual(idle.clientInsPack({insurance_plan:'buckeye'}).color, '#1B8A3E');
assert.strictEqual(idle.clientInsPack({insurance_plan:'aetna'}).plan, '', 'unknown key is not a plan');
assert.strictEqual(idle.clientInsPack({insurance_plan:'molina', insurance_color:'#112233', insurance_label:'Molina Health'}).color, '#112233');
assert.strictEqual(idle.clientInsPack({insurance_plan:'molina', insurance_color:'#112233', insurance_label:'Molina Health'}).label, 'Molina Health');
assert.strictEqual(idle.sbClientInsPlan({weekly_authorized_hours:40}), undefined, 'hours payload does not invent a plan');
assert.strictEqual(idle.sbClientInsPlan({insurance_plan:null}), null, 'explicit null clears');
assert.strictEqual(idle.sbClientInsPlan({insurance_plan:'Passport'}), 'passport');
assert.strictEqual(idle.sbClientInsPlan({insurance_plan:'nope'}), undefined, 'invalid key is omitted');

const hoursOnly = idle.sbClientHoursRpcBodies({firstName:'Helen', lastName:'Vargas', address:'418 Oak', weekly_authorized_hours:40});
assert.strictEqual(hoursOnly[0].p_weekly_authorized_hours, 40);
assert.ok(!Object.prototype.hasOwnProperty.call(hoursOnly[0], 'p_insurance_plan'), 'hours body does not gain insurance by itself');

const mapped = idle.sbMapClient({id:'c1', name:'Helen Vargas', address:'418 Oak', is_active:true, weekly_authorized_hours:40, insurance_plan:'caresource', assignments:[]});
assert.strictEqual(mapped.weekly_authorized_hours, 40);
assert.strictEqual(mapped.insurance_plan, 'caresource');
assert.strictEqual(mapped.insurance_color, '#6B2D8B');
assert.strictEqual(mapped.insurance_label, 'CareSource');
const legacy = idle.sbMapClient({id:'c2', name:'Irene Walsh', address:'1', is_active:true, insurance_plan:null, assignments:[]});
assert.strictEqual(legacy.insurance_plan, null);
assert.strictEqual(legacy.insurance_color, null);
const bare = idle.sbMapClient({id:'c3', name:'Old', address:'1', is_active:true, assignments:[]});
assert.ok(!Object.prototype.hasOwnProperty.call(bare, 'insurance_plan'), 'a row without the column does not invent a plan');

const tint = idle.schedInsNameHtml('Helen Vargas', idle.schedInsPack({insurance_plan:'caresource', insurance_color:'#6B2D8B', insurance_label:'CareSource'}));
assert.ok(tint.includes('ins-caresource') && tint.includes('#6B2D8B') && tint.includes('Helen Vargas') && tint.includes('CareSource'));
const muted = idle.schedInsNameHtml('Irene Walsh', idle.schedInsPack({insurance_plan:null}));
assert.strictEqual(muted, 'Irene Walsh', 'legacy name stays plain');

(async function(){
  const clientId = '11111111-1111-4111-8111-111111111111';
  const added = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('/rpc/admin_add_client')>0){
      assert.strictEqual(body.p_weekly_authorized_hours, 40, 'hours arg preserved');
      assert.strictEqual(body.p_insurance_plan, 'caresource');
      return {status:200, raw:JSON.stringify({success:true, ok:true, marker:'client-ins1', client_id:clientId, insurance_plan:'caresource', insurance_label:'CareSource', insurance_color:'#6B2D8B', weekly_authorized_hours:40, first_name:'Helen', last_name:'Vargas'})};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected '+url})};
  });
  const created = await added.box.sbTrySaveClientDesk({
    firstName:'Helen', lastName:'Vargas', name:'Helen Vargas', address:'418 Oak St', weekly_authorized_hours:40, insurance_plan:'caresource'
  });
  assert.strictEqual(created.ok, true, created.error||'add');
  assert.strictEqual(created.hoursOnWire, true);
  assert.strictEqual(created.mapped.insurance_plan, 'caresource');
  assert.strictEqual(created.mapped.insurance_color, '#6B2D8B');
  assert.strictEqual(added.calls.length, 1, 'live insurance arg does not fall through');

  const plain = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('/rpc/admin_add_client')>0){
      assert.ok(!Object.prototype.hasOwnProperty.call(body, 'p_insurance_plan'), 'omitted plan stays off the wire');
      assert.strictEqual(body.p_weekly_authorized_hours, 27);
      return {status:200, raw:JSON.stringify({id:clientId, first_name:'Ada', last_name:'Cole', weekly_authorized_hours:27})};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const noPlan = await plain.box.sbTrySaveClientDesk({
    firstName:'Ada', lastName:'Cole', name:'Ada Cole', address:'1 Main', weekly_authorized_hours:27
  });
  assert.strictEqual(noPlan.ok, true);
  assert.strictEqual(plain.calls.length, 1);

  const edited = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('/rpc/admin_update_client_insurance')>0){
      assert.strictEqual(body.p_client_id, clientId);
      assert.strictEqual(body.p_insurance_plan, 'molina');
      return {status:200, raw:JSON.stringify({success:true, insurance_plan:'molina', insurance_label:'Molina', insurance_color:'#C62828'})};
    }
    if(init.method==='PATCH'){
      assert.ok(!Object.prototype.hasOwnProperty.call(body, 'insurance_plan'), 'name patch stays separate');
      return {status:200, raw:JSON.stringify([{id:clientId, name:body.name, address:body.address}])};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected '+url})};
  });
  const updated = await edited.box.sbAdminUpdateClient({
    id:clientId, name:'Helen Vargas', address:'418 Oak', lat:'', lng:'', insurance_plan:'molina'
  });
  assert.strictEqual(updated.success, true, updated.error||'edit');
  assert.strictEqual(updated.data.insurance_plan, 'molina');
  assert.strictEqual(updated.data.insurance_color, '#C62828');
  assert.ok(edited.calls.some(function(c){return c.url.indexOf('admin_update_client_insurance')>0;}));

  const nurse = harness(function(url, init){
    if(url.indexOf('/rpc/admin_update_client_insurance')>0){
      return {status:403, ok:false, raw:JSON.stringify({code:'42501', message:'permission denied for function admin_update_client_insurance'})};
    }
    if(init.method==='PATCH'){
      const body = JSON.parse(init.body||'{}');
      if(Object.prototype.hasOwnProperty.call(body, 'insurance_plan')){
        return {status:500, ok:false, raw:JSON.stringify({message:'nurse must not patch'})};
      }
      return {status:200, raw:JSON.stringify([{id:clientId, name:'Helen Vargas', address:'418 Oak'}])};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const denied = await nurse.box.sbAdminUpdateClient({
    id:clientId, name:'Helen Vargas', address:'418 Oak', lat:'', lng:'', insurance_plan:'buckeye'
  });
  assert.strictEqual(denied.success, false);
  assert.ok(!nurse.calls.some(function(c){
    if(c.init.method!=='PATCH')return false;
    return Object.prototype.hasOwnProperty.call(JSON.parse(c.init.body||'{}'), 'insurance_plan');
  }), '42501 does not fall through to PATCH');

  const fallback = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('/rpc/admin_update_client_insurance')>0){
      return {status:404, ok:false, raw:JSON.stringify({code:'PGRST202', message:'Could not find the function public.admin_update_client_insurance'})};
    }
    if(init.method==='PATCH' && Object.prototype.hasOwnProperty.call(body, 'insurance_plan')){
      assert.strictEqual(body.insurance_plan, null);
      return {status:200, raw:JSON.stringify([{id:clientId, name:'Helen Vargas', address:'418 Oak', insurance_plan:null}])};
    }
    if(init.method==='PATCH')return {status:200, raw:JSON.stringify([{id:clientId, name:'Helen Vargas', address:'418 Oak'}])};
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const cleared = await fallback.box.sbAdminUpdateClient({
    id:clientId, name:'Helen Vargas', address:'418 Oak', lat:'', lng:'', insurance_plan:null
  });
  assert.strictEqual(cleared.success, true, cleared.error||'clear');
  assert.strictEqual(cleared.data.insurance_plan, null);

  const catalog = harness(function(url){
    if(url.indexOf('/rpc/admin_list_insurance_plans')>0){
      return {status:200, raw:JSON.stringify({success:true, marker:'client-ins1', plans:[
        {key:'caresource', label:'CareSource', color:'#6B2D8B'},
        {key:'passport', label:'Passport', color:'#E6B800'},
        {key:'anthem', label:'Anthem', color:'#1E6BB8'},
        {key:'molina', label:'Molina', color:'#C62828'},
        {key:'buckeye', label:'Buckeye', color:'#1B8A3E'}
      ]})};
    }
    return {status:500, ok:false, raw:'{}'};
  });
  const plans = await catalog.box.clientInsLoadPlans();
  assert.strictEqual(plans.length, 5);
  assert.strictEqual(plans[0].key, 'caresource');
  assert.strictEqual(plans[4].color, '#1B8A3E');

  console.log('admin-client-ins1-test: ok');
  if(process.env.CLIENT_INS1_SKIP_BROWSER==='1')return;
  await runBrowser();
})().catch(function(err){
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
    console.log('admin-client-ins1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.CLIENT_INS1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url||'/').split('?')[0]);
    const rel = urlPath==='/'?'index.html':urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type':types[ext]||'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  const errors = [];
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    async function boot(width, height){
      await page.setViewport({width:width, height:height, isMobile:width<700, hasTouch:width<700, deviceScaleFactor:1});
      await page.goto('http://127.0.0.1:'+port+'/index.html?v=client-ins1', {waitUntil:'domcontentloaded', timeout:20000});
      await page.evaluate(function(){
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('adminScreen').classList.add('active');
        document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
        currentAdminRole = 'Admin';
      });
    }
    async function shot(name){
      await page.screenshot({path:path.join(shotDir, name), type:'png'});
    }
    await boot(390, 844);
    const addPhone = await page.evaluate(function(){
      showAddClientModal();
      clientInsPick('caresource');
      var bg = document.getElementById('clientModal');
      var field = document.getElementById('clientInsField');
      if(bg && field){
        bg.scrollTop = 0;
        var top = field.getBoundingClientRect().top - bg.getBoundingClientRect().top;
        bg.scrollTop = Math.max(0, top - 12);
      }
      var chip = document.querySelector('#clientInsChips .ins-chip.is-on');
      var style = chip ? getComputedStyle(chip) : null;
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.querySelector('[data-client-ins1]').getAttribute('data-client-ins1'),
        selected: document.getElementById('clientInsurancePlan').value,
        label: chip ? chip.textContent : '',
        border: style ? style.borderTopColor : '',
        hoursAbove: document.getElementById('clientWeeklyHours').compareDocumentPosition(document.getElementById('assignAidesList')) === Node.DOCUMENT_POSITION_FOLLOWING
      };
    });
    assert.strictEqual(addPhone.build, '2026-09-27-remi-chat1');
    assert.strictEqual(addPhone.marker, 'v=client-ins1');
    assert.strictEqual(addPhone.selected, 'caresource');
    assert.ok(/CareSource/.test(addPhone.label));
    assert.strictEqual(addPhone.hoursAbove, true);
    await shot('client-ins1-add-phone.png');

    await boot(1280, 900);
    await page.evaluate(function(){
      showAddClientModal();
      clientInsPick('caresource');
    });
    await shot('client-ins1-add-desktop.png');

    const clients = [
      {id:'h1', name:'Helen Vargas', address:'418 Oak St, Columbus', insurance_plan:'caresource', insurance_label:'CareSource', insurance_color:'#6B2D8B', assignedAides:['devon'], lat:'1', lng:'2'},
      {id:'j1', name:'James Okonkwo', address:'Dayton', insurance_plan:'passport', assignedAides:['maria']},
      {id:'r1', name:'Ruth Feldman', address:'Cleveland', insurance_plan:'anthem', assignedAides:['lina']},
      {id:'c1', name:'Carlos Mendez', address:'Toledo', insurance_plan:'molina', assignedAides:['sara']},
      {id:'d1', name:'Dorothy Price', address:'Akron', insurance_plan:'buckeye', assignedAides:['devon']},
      {id:'i1', name:'Irene Walsh', address:'Lorain', insurance_plan:null, assignedAides:['maria']}
    ];
    async function showList(){
      return page.evaluate(function(rows){
        document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
        document.getElementById('tab_clients').classList.add('active');
        document.getElementById('clientModal').classList.remove('show');
        allClients = rows.map(function(row){return clientInsPack ? Object.assign({}, row, (function(){
          var pack = clientInsPack(row);
          return {insurance_plan:pack.plan||null, insurance_label:pack.label||null, insurance_color:pack.color||null};
        })()) : row;});
        paintClients();
        var helen = document.querySelector('#clientsContainer .ins-client-head .ins-caresource');
        if(helen)helen = helen.closest('.ins-client-head');
        var irene = document.querySelector('#clientsContainer .ins-client-head .ins-none');
        if(irene)irene = irene.closest('.ins-client-head');
        return {
          helen: helen ? helen.textContent : '',
          irene: irene ? irene.textContent : '',
          legend: document.getElementById('clientInsLegend').textContent
        };
      }, clients);
    }
    await boot(390, 844);
    const listPhone = await showList();
    assert.ok(/Helen Vargas/.test(listPhone.helen));
    assert.ok(/CareSource/.test(listPhone.helen));
    assert.ok(/Irene Walsh/.test(listPhone.irene));
    assert.ok(/No plan/.test(listPhone.irene));
    assert.ok(/Buckeye/.test(listPhone.legend));
    await shot('client-ins1-list-phone.png');
    await boot(1280, 900);
    await showList();
    await shot('client-ins1-list-desktop.png');

    async function showSchedule(){
      return page.evaluate(function(){
        document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
        document.getElementById('tab_schedule').classList.add('active');
        document.getElementById('clientModal').classList.remove('show');
        var week = '2026-09-21';
        function daysFor(clientId, aide, start){
          var days = {};
          for(var n=1;n<=7;n++){
            var on = schedAddDays(week, n-1);
            var slots = n<=5 ? [{
              slot_key:'am', label:'Morning', start_local:start, end_local:'16:00:00', hours:8, pattern_hours:8,
              usual_aide_id:aide, aide_name:aide, sort_order:0, mark:null,
              deep_link:{client_id:clientId, on_date:on, slot_key:'am'}
            }] : [];
            days[String(n)] = {on_date:on, weekday:n, slots:slots};
          }
          return days;
        }
        schedApplySlotWeek({
          week_start:week,
          marker:'client-ins1',
          v:'client-ins1',
          clients:[
            {client_id:'h1', client_name:'Helen Vargas', insurance_plan:'caresource', insurance_label:'CareSource', insurance_color:'#6B2D8B', weekly_authorized_hours:40, days:daysFor('h1','Devon','08:00:00')},
            {client_id:'j1', client_name:'James Okonkwo', insurance_plan:'passport', insurance_label:'Passport', insurance_color:'#E6B800', weekly_authorized_hours:32, days:daysFor('j1','Maria','07:00:00')},
            {client_id:'r1', client_name:'Ruth Feldman', insurance_plan:'anthem', insurance_label:'Anthem', insurance_color:'#1E6BB8', weekly_authorized_hours:40, days:daysFor('r1','Lina','08:00:00')},
            {client_id:'c1', client_name:'Carlos Mendez', insurance_plan:'molina', insurance_label:'Molina', insurance_color:'#C62828', weekly_authorized_hours:24, days:daysFor('c1','Sara','09:00:00')},
            {client_id:'d1', client_name:'Dorothy Price', insurance_plan:'buckeye', insurance_label:'Buckeye', insurance_color:'#1B8A3E', weekly_authorized_hours:20, days:daysFor('d1','Devon','09:00:00')},
            {client_id:'i1', client_name:'Irene Walsh', insurance_plan:null, insurance_label:null, insurance_color:null, weekly_authorized_hours:16, days:daysFor('i1','Maria','08:00:00')}
          ]
        });
        schedSetView('week');
        schedPaint();
        var sc = document.getElementById('schedScroll');
        if(sc && sc.scrollIntoView)sc.scrollIntoView({block:'start'});
        var body = document.getElementById('schedBody').innerHTML;
        var helen = schedFindSlotClient('h1');
        return {
          plan: helen && helen.insurance_plan,
          color: helen && helen.insurance_color,
          tint: body.indexOf('ins-caresource')>=0 && body.indexOf('#6B2D8B')>=0 && body.indexOf('Helen Vargas')>=0,
          passport: body.indexOf('ins-passport')>=0 && body.indexOf('James Okonkwo')>=0,
          legacy: body.indexOf('Irene Walsh')>=0 && body.indexOf('ins-none')<0,
          legend: document.getElementById('schedInsLegend').textContent.indexOf('Molina')>=0
        };
      });
    }
    await boot(390, 844);
    const schedPhone = await showSchedule();
    assert.strictEqual(schedPhone.plan, 'caresource');
    assert.strictEqual(schedPhone.color, '#6B2D8B');
    assert.strictEqual(schedPhone.tint, true);
    assert.strictEqual(schedPhone.passport, true);
    assert.strictEqual(schedPhone.legacy, true, 'null plan stays muted');
    assert.strictEqual(schedPhone.legend, true);
    await shot('client-ins1-schedule-phone.png');
    await boot(1280, 900);
    await showSchedule();
    await shot('client-ins1-schedule-desktop.png');
    assert.deepStrictEqual(errors, [], errors.join('\n'));
    console.log('admin-client-ins1 browser: ok');
  }finally{
    await browser.close();
    await new Promise(function(r){server.close(r);});
  }
}
