#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-phone-rail1'), 'remi-phone-rail1 marker');
assert.ok(html.includes('data-remi-phone-rail1="v=remi-phone-rail1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-phone-rail1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-phone-rail1">'), 'meta');
assert.ok(html.includes('<!-- remi phone rail 2026-09-27 v=remi-phone-rail1 admin-build 2026-09-27-remi-phone-rail1'), 'comment');
assert.ok(html.includes("var REMI_PHONE_RAIL1_MARKER='v=remi-phone-rail1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-PHONE-RAIL1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace NO CALLABLE'), 'no Ace callable');
assert.ok(html.includes('MERGE HOLD. Do not claim LIVE. Do not squash-merge.'), 'merge hold');
assert.ok(html.includes('id="bottomNav"'), 'bottom nav id');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(html.includes('class="remi-phone-rail"'), 'phone sheet class');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-phone-rail1-v1.sql')), 'no SQL patch');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-list-az1'), 'first admin-build is list-az1');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-remi-phone-rail1"'), 'this tip stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-remi-phone-rail1"') < html.indexOf('content="2026-09-27-compliance-bulk1"'), 'compliance-bulk1 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll stays after cover-unselect1');
['v=remi-chat1','v=remi-float-hide1','v=tabbar-8','v=remi-payroll1','v=aide-office-vis1','v=msg-dense1','v=list-az1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-tabbar-8">'), 'tabbar-8 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-chat1">'), 'remi-chat1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-msg-dense1">'), 'msg-dense1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-office-vis1">'), 'aide-office-vis1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-hide1">'), 'remi-float-hide1 meta stays');

const phoneCssStart = html.indexOf('/* v=remi-phone-rail1');
const phoneCssEnd = html.indexOf('/* v=remi-notes1');
assert.ok(phoneCssStart > 0 && phoneCssEnd > phoneCssStart, 'phone rail css block');
const phoneCss = html.slice(phoneCssStart, phoneCssEnd);
assert.ok(phoneCss.includes('@media(max-width:899px)'), 'phone query');
assert.ok(phoneCss.includes('top:64px'), 'sheet starts below the header');
assert.ok(phoneCss.includes('bottom:calc(72px + env(safe-area-inset-bottom, 0px))'), 'sheet stops above the tab bar');
assert.ok(phoneCss.includes('inset:auto'), 'phone sheet is not inset 0');
assert.ok(!/inset:\s*0/.test(phoneCss), 'phone block does not use inset 0');
assert.ok(html.includes('#copilotSheet{left:auto;right:0;width:min(440px,100vw);box-shadow:-12px 0 30px rgba(26,39,68,.18);}'), 'desktop right rail stays');

const railStart = html.indexOf('// remi phone rail1 v=remi-phone-rail1');
const railEnd = html.indexOf('// end remi phone rail1 v=remi-phone-rail1');
assert.ok(railStart > 0 && railEnd > railStart, 'rail script block');
const railSrc = html.slice(railStart, railEnd);
assert.ok(railSrc.includes('function remiPhoneRail1NavReserve'), 'nav reserve helper');
assert.ok(!/sbRestRpc|fetch\(|CREATE TABLE|reset_aide_temp_password|mossier|twilio/.test(railSrc), 'no RPC, SQL, Auth, or SMS');

const note = html.slice(html.indexOf('<!-- remi phone rail 2026-09-27'), html.indexOf('<meta name="admin-build" content="2026-09-27-remi-phone-rail1">'));
assert.ok(/No SQL/.test(note), 'note says no SQL');
assert.ok(/No Auth reseal/.test(note), 'note says no Auth reseal');
assert.ok(/No Quo\/SMS/.test(note), 'note says no Quo');
assert.ok(/MM\/DD\/YYYY/.test(note), 'dates stay MM/DD/YYYY');

const nurseAt = html.indexOf('id="nurseScreen"');
const fabAt = html.indexOf('id="copilotFab"');
assert.ok(fabAt > 0 && fabAt < nurseAt, 'Remi chip sits in the Admin screen');
assert.strictEqual(html.indexOf('id="copilotFab"', nurseAt), -1, 'Nurse screen has no Remi chip');

const navStart = html.indexOf('id="bottomNav"');
const nav = html.slice(navStart, html.indexOf('</nav>', navStart));
assert.ok(nav.includes('data-tabbar-8="v=tabbar-8"'), 'tabbar-8 stays on the nav');
assert.ok(nav.includes('id="nav_more"'), 'More stays on the bar');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start > 0, sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + sig);
}

const sandbox = {document:{getElementById:function(){return null;}}, window:{innerHeight:844, getComputedStyle:function(){return {display:'block', visibility:'visible'};}}};
vm.createContext(sandbox);
vm.runInContext(extractFn(html, 'function remiPhoneRail1NavReserve'), sandbox);
const reserve = sandbox.remiPhoneRail1NavReserve;
const full = reserve({offsetTop:0, height:844}, {top:786, bottom:844, height:58});
assert.strictEqual(full, 58, 'visible tab bar is reserved');
const underKeys = reserve({offsetTop:0, height:420}, {top:786, bottom:844, height:58});
assert.strictEqual(underKeys, 0, 'a tab bar under the keyboard is not in the visual viewport');
const partial = reserve({offsetTop:0, height:800}, {top:786, bottom:844, height:58});
assert.strictEqual(partial, 14, 'only the visible slice of the tab bar is reserved');
const pinned = Math.max(200, Math.round(844 - full));
assert.ok(pinned + 0 <= 786 + 1, 'pinned sheet bottom stays at or above the tab bar');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function overlaps(a, b){
  return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-phone-rail1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_PHONE_RAIL1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
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
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=remi-phone-rail1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
    });
    await page.waitForSelector('#copilotFab', {visible:true, timeout:15000});
    await page.waitForSelector('#bottomNav', {visible:true});
    const closed = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      return {hidden: sheet.hidden, marker: REMI_PHONE_RAIL1_MARKER};
    });
    assert.strictEqual(closed.hidden, true, 'sheet stays closed until the chip is tapped');
    assert.strictEqual(closed.marker, 'v=remi-phone-rail1');

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotSheet:not([hidden])', {visible:true});
    await page.waitForFunction(function(){
      return document.getElementById('copilotTitle') && /Remi/.test(document.getElementById('copilotTitle').textContent || '');
    });
    const phone = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {top:r.top, right:r.right, bottom:r.bottom, left:r.left, width:r.width, height:r.height};
      }
      var sheet = document.getElementById('copilotSheet');
      var nav = document.getElementById('bottomNav');
      var header = document.querySelector('#adminScreen .shell-top');
      var closeBtn = document.getElementById('copilotCloseBtn');
      var nr = nav.getBoundingClientRect();
      var hr = header.getBoundingClientRect();
      var hitNav = document.elementFromPoint(nr.left + nr.width / 2, nr.top + nr.height / 2);
      var hitHeader = document.elementFromPoint(hr.left + Math.min(80, hr.width / 2), hr.top + hr.height / 2);
      var cs = getComputedStyle(sheet);
      return {
        sheet: box(sheet),
        nav: box(nav),
        header: box(header),
        close: box(closeBtn),
        viewH: window.innerHeight,
        viewW: window.innerWidth,
        hitNavId: hitNav && (hitNav.id || hitNav.closest && (hitNav.closest('#bottomNav') ? 'bottomNav' : '')),
        hitHeaderInShell: !!(hitHeader && header.contains(hitHeader)),
        radius: cs.borderTopLeftRadius,
        inset: cs.top + ' ' + cs.right + ' ' + cs.bottom + ' ' + cs.left,
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(phone.fullPage, false, 'Remi is not a full-page tab');
    assert.strictEqual(phone.viewW, 390);
    assert.ok(phone.sheet.top >= phone.header.bottom - 1, 'sheet starts at or below the header ' + JSON.stringify(phone));
    assert.ok(phone.sheet.bottom <= phone.nav.top + 1, 'sheet stops at or above #bottomNav ' + JSON.stringify(phone));
    assert.ok(!overlaps(phone.sheet, phone.nav), 'phone sheet does not cover #bottomNav ' + JSON.stringify(phone));
    assert.ok(!overlaps(phone.sheet, phone.header), 'phone sheet does not cover the desk header ' + JSON.stringify(phone));
    assert.ok(phone.sheet.height < phone.viewH - 40, 'sheet is not a full-viewport takeover ' + phone.sheet.height);
    assert.strictEqual(phone.hitNavId, 'bottomNav', 'tab bar is the hit target ' + phone.hitNavId);
    assert.strictEqual(phone.hitHeaderInShell, true, 'desk header stays the hit target');
    assert.ok(parseFloat(phone.radius) >= 12, 'sheet reads as a sheet ' + phone.radius);
    assert.ok(phone.close.height >= 32 && phone.close.top >= phone.sheet.top - 1 && phone.close.bottom <= phone.sheet.bottom + 1, 'Close stays inside the sheet ' + JSON.stringify(phone.close));
    await page.screenshot({path: path.join(shotDir, 'remi-phone-rail1-phone-open.png')});

    await page.click('#copilotCloseBtn');
    await page.waitForFunction(function(){return document.getElementById('copilotSheet').hidden;});
    const afterClose = await page.evaluate(function(){
      var nav = document.getElementById('bottomNav');
      var fab = document.getElementById('copilotFab');
      return {
        sheetHidden: document.getElementById('copilotSheet').hidden,
        navVisible: !!(nav && nav.getClientRects().length),
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none' && !fab.hidden)
      };
    });
    assert.strictEqual(afterClose.sheetHidden, true, 'Close dismisses the sheet');
    assert.strictEqual(afterClose.navVisible, true, 'tab bar stays after Close');
    assert.strictEqual(afterClose.fabVisible, true, 'corner chip returns');

    await page.setViewport({width:1280, height:800, isMobile:false, hasTouch:false, deviceScaleFactor:1});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      copilotOpenRadar();
    });
    await page.waitForSelector('#copilotSheet:not([hidden])', {visible:true});
    const desk = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var r = sheet.getBoundingClientRect();
      var cs = getComputedStyle(sheet);
      return {
        width: r.width,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        viewW: window.innerWidth,
        viewH: window.innerHeight,
        radius: cs.borderTopLeftRadius
      };
    });
    assert.ok(desk.width <= 440.5, 'desktop rail stays at most 440px ' + desk.width);
    assert.ok(desk.left > 200, 'desktop rail is not a full-width takeover ' + desk.left);
    assert.ok(Math.abs(desk.right - desk.viewW) <= 2, 'desktop rail stays on the right ' + desk.right);
    assert.ok(desk.top <= 2 && desk.bottom >= desk.viewH - 2, 'desktop rail stays full height');
    assert.ok(parseFloat(desk.radius) < 8, 'desktop rail is not the phone sheet ' + desk.radius);
    await page.screenshot({path: path.join(shotDir, 'remi-phone-rail1-desktop-rail.png')});

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var sheet = document.getElementById('copilotSheet');
      return {
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none' && !fab.hidden),
        sheetHidden: sheet.hidden,
        roleOk: copilotRoleOk()
      };
    });
    assert.strictEqual(nurse.fabVisible, false, 'Nurse has no Remi chip');
    assert.strictEqual(nurse.sheetHidden, true, 'Nurse has no open Remi sheet');
    assert.strictEqual(nurse.roleOk, false, 'Nurse cannot open Remi');
    console.log('admin-remi-phone-rail1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remi-phone-rail1 unit ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
