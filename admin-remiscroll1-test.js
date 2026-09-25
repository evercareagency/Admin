#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remiscroll1'), 'remiscroll1 marker');
assert.ok(html.includes('admin-build 2026-09-25-remiscroll1'), 'remiscroll1 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiscroll1">'), 'remiscroll1 meta');
assert.ok(html.includes('<!-- phone scroll lock 2026-09-25 v=remiscroll1 admin-build 2026-09-25-remiscroll1'), 'remiscroll1 comment');
assert.ok(html.indexOf('<meta name="admin-build" content="2026-09-25-remiscroll1">') > html.indexOf('<!-- phone scroll lock 2026-09-25 v=remiscroll1'), 'remiscroll1 meta stays with the remiscroll1 note');
['v=remi1','v=phonezoom1','v=eca-copilot1','v=navedit1','v=coveraide1b','v=layoutA1','v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remi1">'), 'remi1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-phonezoom1">'), 'phonezoom1 meta stays');
assert.ok(html.includes('Co-pilot stays closed until Mo opens it'), 'phonezoom1 closed-until-open note stays');

const note = html.slice(html.indexOf('v=remiscroll1'), html.indexOf('<!-- remi 2026-09-25 v=remi1'));
assert.ok(/overflow-x hidden/.test(note) && /overscroll-behavior-x none/.test(note) && /touch-action pan-y/.test(note), 'note names the root lock');
assert.ok(/\.sched-scroll/.test(note) && /\.nav-edit-bottom/.test(note), 'note names the local scrollers that stay');
assert.ok(!/reset_aide_temp_password|auth\.updateUser|rotate password|admin_create_aide/i.test(note), 'remiscroll1 note does not reseal Auth');

assert.ok(/html\{[^}]*overflow-x:hidden;overflow-x:clip;overscroll-behavior-x:none;touch-action:pan-y/.test(html), 'html locks horizontal overscroll');
assert.ok(/body\{[^}]*overflow-x:hidden;overflow-x:clip;overscroll-behavior-x:none;touch-action:pan-y/.test(html), 'body locks horizontal overscroll');
assert.ok(html.includes('.sched-scroll,.nav-edit-bottom,.ts-sheet,.table-wrap,#tab_coverage .cover-list,.card > [style*="overflow-x:auto"]{overflow-x:auto;'), 'local scrollers keep overflow-x auto');
assert.ok(html.includes('touch-action:pan-x pan-y;overscroll-behavior-x:contain'), 'local scrollers keep pan-x');
assert.ok(html.includes('.side-nav{flex:none;flex-direction:row;overflow-x:auto;overflow-y:hidden;') && html.includes('touch-action:pan-x pan-y;overscroll-behavior-x:contain'), 'phone side nav keeps pan-x');
assert.ok(!html.includes('#tab_schedule .sched-scroll{max-width:calc(100vw'), 'schedule scroller is not sized from 100vw');
assert.ok(html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip label stays');
assert.ok(html.includes('assets/remi-corner-chip.png?v=remi1'), 'Remi chip face stays');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function inside(inner, outer, pad){
  pad = pad || 1;
  return inner.left >= outer.left - pad && inner.right <= outer.right + pad && inner.top >= outer.top - pad && inner.bottom <= outer.bottom + pad && inner.width > 8 && inner.height > 8;
}

async function drag(page, x1, y1, x2, y2){
  const session = await page.target().createCDPSession();
  await session.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:x1, y:y1}]});
  const steps = 8;
  for(let i = 1; i <= steps; i++){
    await session.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:x1 + (x2 - x1) * i / steps, y:y1 + (y2 - y1) * i / steps}]});
  }
  await session.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remiscroll1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMISCROLL_SHOTS || '/opt/cursor/artifacts';
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
    await page.goto('http://127.0.0.1:'+port+'/index.html', {waitUntil:'domcontentloaded', timeout:20000});
    const boot = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      var htmlCs = getComputedStyle(document.documentElement);
      var bodyCs = getComputedStyle(document.body);
      return {
        sheetHidden: !!(sheet && sheet.hidden),
        adminActive: document.getElementById('adminScreen').classList.contains('active'),
        fabVisible: !!(fab && fab.getClientRects().length),
        htmlOx: htmlCs.overflowX,
        bodyOx: bodyCs.overflowX,
        htmlOb: htmlCs.overscrollBehaviorX,
        bodyTa: bodyCs.touchAction,
        scrollX: window.scrollX
      };
    });
    assert.strictEqual(boot.sheetHidden, true, 'Remi sheet stays closed on login');
    assert.strictEqual(boot.adminActive, false, 'login is desk-first, not a Remi screen');
    assert.strictEqual(boot.fabVisible, false, 'Remi chip stays off the login screen');
    assert.strictEqual(boot.htmlOx, 'clip', boot.htmlOx);
    assert.strictEqual(boot.bodyOx, 'clip', boot.bodyOx);
    assert.strictEqual(boot.htmlOb, 'none', boot.htmlOb);
    assert.strictEqual(boot.bodyTa, 'pan-y', boot.bodyTa);
    assert.strictEqual(boot.scrollX, 0, 'login is not shifted sideways');

    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
      var cards = '';
      for(var i = 0; i < 8; i++){
        cards += '<article class="ts-card"><div class="ts-card-top"><strong>Aide '+i+'</strong></div><div class="ts-card-sub">Client '+i+' · Week of Sep '+(7+i)+'</div><div class="ts-card-meta"><span class="ts-card-hrs">'+(12+i)+' hrs</span></div></article>';
      }
      document.getElementById('tsCards').innerHTML = cards;
    });
    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const framed = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      }
      var top = document.querySelector('#adminScreen .shell-top');
      var fab = document.getElementById('copilotFab');
      var doc = document.scrollingElement;
      return {
        top: box(top),
        fab: box(fab),
        viewW: window.innerWidth,
        scrollX: window.scrollX,
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        sheetHidden: document.getElementById('copilotSheet').hidden,
        label: fab.getAttribute('aria-label')
      };
    });
    assert.ok(framed.viewW <= 400 && framed.viewW >= 380, 'phone width '+framed.viewW);
    assert.strictEqual(framed.scrollX, 0);
    assert.ok(framed.scrollW <= framed.clientW + 1, 'document is not wider than the phone');
    assert.ok(Math.abs(framed.top.left) <= 1, 'header starts at the left edge');
    assert.ok(Math.abs(framed.top.right - framed.viewW) <= 1, 'header ends at the right edge');
    assert.strictEqual(framed.sheetHidden, true, 'desk does not auto-open Remi');
    assert.strictEqual(framed.label, 'Remi');
    assert.ok(inside(framed.fab, {left:0, top:0, right:framed.viewW, bottom:844}), 'Remi chip is on the phone');
    await page.screenshot({path: path.join(shotDir, 'remiscroll1-phone-framed.png')});

    const leftBefore = framed.top.left;
    await drag(page, 200, 620, 200, 280);
    await drag(page, 320, 240, 40, 240);
    const after = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      }
      var top = document.querySelector('#adminScreen .shell-top');
      var fab = document.getElementById('copilotFab');
      var doc = document.scrollingElement;
      return {
        top: box(top),
        fab: box(fab),
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        viewW: window.innerWidth,
        sheetHidden: document.getElementById('copilotSheet').hidden
      };
    });
    assert.ok(after.scrollY > 40, 'vertical swipe scrolls the page '+after.scrollY);
    assert.strictEqual(after.scrollX, 0, 'side swipe does not shift the page');
    assert.ok(Math.abs(after.top.left - leftBefore) <= 1, 'header stays on the left edge');
    assert.ok(Math.abs(after.top.right - after.viewW) <= 1, 'header stays on the right edge');
    assert.ok(after.scrollW <= after.clientW + 1, 'document stays as wide as the phone');
    assert.strictEqual(after.sheetHidden, true, 'scrolling does not open Remi');
    assert.ok(inside(after.fab, {left:0, top:0, right:after.viewW, bottom:844}), 'Remi chip stays on screen after scroll');
    await page.screenshot({path: path.join(shotDir, 'remiscroll1-phone-after-scroll.png')});

    const pixels = await page.evaluate(function(){
      var img = document.querySelector('#copilotFab .remi-chip-face');
      var canvas = document.createElement('canvas');
      var w = img.naturalWidth;
      var h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      function at(x, y){
        var p = ctx.getImageData(x, y, 1, 1).data;
        return {r:p[0], g:p[1], b:p[2], a:p[3]};
      }
      var spots = [at(w/2, Math.round(h*0.18)), at(Math.round(w*0.22), Math.round(h*0.30)), at(Math.round(w*0.78), Math.round(h*0.42))];
      var neon = 0;
      spots.forEach(function(p){
        if(p.a > 200 && (p.b > 80 || p.r > 90) && !(p.r > 235 && p.g > 235 && p.b > 235))neon++;
      });
      return {neon:neon, spots:spots};
    });
    assert.ok(pixels.neon >= 2, 'Remi chip keeps neon colors '+JSON.stringify(pixels.spots));

    await page.evaluate(function(){
      window.scrollTo(0, 0);
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
      document.getElementById('tab_schedule').classList.add('active');
      window.schedPaint = function(){};
      var sc = document.getElementById('schedScroll');
      sc.hidden = false;
      document.getElementById('schedHead').innerHTML = '<th class="sched-client-h">Client</th>'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(d){return '<th>'+d+'</th>';}).join('');
      var rows = '';
      for(var i = 0; i < 4; i++){
        rows += '<tr><td class="sched-name">Client '+i+'</td>'+['a','b','c','d','e','f','g'].map(function(){return '<td class="sched-slot"><button class="sched-cell" type="button">Open</button></td>';}).join('')+'</tr>';
      }
      document.getElementById('schedBody').innerHTML = rows;
    });
    const schedBox = await page.evaluate(function(){
      var sc = document.getElementById('schedScroll');
      var r = sc.getBoundingClientRect();
      var cs = getComputedStyle(sc);
      return {top:r.top, left:r.left, width:r.width, height:r.height, sw:sc.scrollWidth, cw:sc.clientWidth, ox:cs.overflowX, ta:cs.touchAction};
    });
    assert.strictEqual(schedBox.ox, 'auto', schedBox.ox);
    assert.ok(schedBox.ta.indexOf('pan-x') >= 0, schedBox.ta);
    assert.ok(schedBox.sw > schedBox.cw + 40, 'week board is wider than the phone');
    assert.ok(schedBox.left >= -1 && schedBox.left + schedBox.width <= 391, 'week scroller stays inside the phone');
    await drag(page, Math.min(340, schedBox.left + schedBox.width - 24), schedBox.top + 48, schedBox.left + 24, schedBox.top + 48);
    const schedMoved = await page.evaluate(function(){
      var sc = document.getElementById('schedScroll');
      var doc = document.scrollingElement;
      return {scrollLeft: sc.scrollLeft, scrollX: window.scrollX, scrollW: doc.scrollWidth, clientW: doc.clientWidth};
    });
    assert.ok(schedMoved.scrollLeft > 20, 'week board still scrolls sideways '+schedMoved.scrollLeft);
    assert.strictEqual(schedMoved.scrollX, 0, 'week swipe does not shift the page');
    assert.ok(schedMoved.scrollW <= schedMoved.clientW + 1, 'week board does not widen the page');

    await page.evaluate(function(){
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
      document.getElementById('tab_more').classList.add('active');
      navEditOpen();
    });
    await page.waitForSelector('#navEditBottom', {visible:true});
    const edit = await page.evaluate(function(){
      var row = document.querySelector('.nav-edit-bottom');
      var cs = getComputedStyle(row);
      var probe = document.createElement('div');
      probe.setAttribute('data-probe', '1');
      probe.style.cssText = 'flex:0 0 640px;height:12px;';
      row.appendChild(probe);
      row.scrollLeft = 80;
      var got = row.scrollLeft;
      probe.remove();
      return {ox: cs.overflowX, ta: cs.touchAction, scrollLeft: got};
    });
    assert.strictEqual(edit.ox, 'auto', edit.ox);
    assert.ok(edit.ta.indexOf('pan-x') >= 0, edit.ta);
    assert.ok(edit.scrollLeft > 20, 'edit-tabs row can still scroll sideways '+edit.scrollLeft);
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remiscroll1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
