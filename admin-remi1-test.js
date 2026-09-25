#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi1'), 'remi1 marker');
assert.ok(html.includes('admin-build 2026-09-25-remi1'), 'remi1 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remi1">'), 'remi1 meta');
assert.ok(html.includes('<!-- remi 2026-09-25 v=remi1 admin-build 2026-09-25-remi1'), 'remi1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 70).includes('2026-09-25-remi1'), 'remi1 is the current admin-build meta');
['v=phonezoom1','v=eca-copilot1','v=navedit1','v=coveraide1b','v=layoutA1','v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('Co-pilot stays closed until Mo opens it'), 'phonezoom1 closed-until-open note stays');

const remiNote = html.slice(html.indexOf('v=remi1'), html.indexOf('v=phonezoom1'));
assert.ok(!/reset_aide_temp_password|auth\.updateUser|rotate password|admin_create_aide/i.test(remiNote), 'remi1 note does not reseal Auth');

const nurseAt = html.indexOf('id="nurseScreen"');
const fabAt = html.indexOf('id="copilotFab"');
assert.ok(fabAt > 0 && fabAt < nurseAt, 'Remi chip sits in the Admin screen');
assert.strictEqual(html.indexOf('id="copilotFab"', nurseAt), -1, 'Nurse screen has no Remi chip');
assert.strictEqual(html.indexOf('remi-corner-chip', nurseAt), -1, 'Nurse screen has no Remi art');
const nurseHtml = html.slice(nurseAt, html.indexOf('id="isResultsModal"'));
assert.ok(!nurseHtml.includes('copilotOpenRadar') && !nurseHtml.includes('aria-label="Remi"') && !nurseHtml.includes('remi-chip'), 'Nurse home has no Remi entry');

const admin = html.slice(html.indexOf('id="adminScreen"'), nurseAt);
assert.ok(admin.includes('aria-label="Remi"'), 'chip aria-label is Remi');
assert.ok(admin.includes('class="remi-chip-pill">Remi</span>'), 'chip pill says Remi');
assert.ok(admin.includes('id="copilotTitle">Remi</h2>'), 'sheet title is Remi');
assert.ok(admin.includes('assets/remi-corner-chip.png?v=remi1'), 'chip face is the circular portrait');
assert.ok(admin.includes('data-layout-roles="Admin Scheduler"') && admin.includes('id="copilotFab"'), 'Remi is Admin and Scheduler');
assert.ok(!admin.includes('>Co-pilot<'), 'Admin screen has no Co-pilot label');
assert.ok(html.includes("title.textContent='Remi'"), 'radar paints the Remi title');
assert.ok(!html.includes("title.textContent='Co-pilot'"), 'radar no longer paints Co-pilot');

const script = html.slice(html.indexOf('// v=eca-copilot1 Admin desk co-pilot'));
assert.ok(!script.includes('Co-pilot'), 'desk AI copy says Remi');
assert.ok(script.includes('admin_log_copilot_choice') && script.includes('admin_list_radar_signals') && script.includes('admin_get_quiet_hours'), 'brain RPC names stay');
assert.ok(!/reset_aide_temp_password|auth\.updateUser|admin_create_aide/.test(script.slice(0, script.indexOf('// Live Ace office RPCs'))), 'Remi desk does not reseal Auth');
assert.ok(html.includes('#copilotFab .remi-chip-face') && html.includes('background:transparent'), 'chip face is the image, not a solid fill');
assert.ok(fs.existsSync(path.join(__dirname, 'assets/remi-corner-chip.png')), 'chip png is in assets');

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

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_SHOTS || '/opt/cursor/artifacts';
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
      var admin = document.getElementById('adminScreen');
      return {
        sheetHidden: !!(sheet && sheet.hidden),
        adminActive: admin.classList.contains('active'),
        fabVisible: !!(fab && fab.getClientRects().length)
      };
    });
    assert.strictEqual(boot.sheetHidden, true, 'Remi sheet stays closed on login');
    assert.strictEqual(boot.adminActive, false, 'login is desk-first, not a Remi screen');
    assert.strictEqual(boot.fabVisible, false, 'Remi chip stays off the login screen');

    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
    });
    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const desk = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      }
      var fab = document.getElementById('copilotFab');
      var img = fab.querySelector('.remi-chip-face');
      var pill = fab.querySelector('.remi-chip-pill');
      var sheet = document.getElementById('copilotSheet');
      var bg = getComputedStyle(fab).backgroundColor;
      var imgBg = getComputedStyle(img).backgroundColor;
      return {
        fab: box(fab),
        img: box(img),
        pill: box(pill),
        viewW: window.innerWidth,
        viewH: window.innerHeight,
        label: fab.getAttribute('aria-label'),
        pillText: pill.textContent,
        src: img.getAttribute('src'),
        sheetHidden: sheet.hidden,
        bg: bg,
        imgBg: imgBg,
        natural: {w: img.naturalWidth, h: img.naturalHeight}
      };
    });
    assert.ok(desk.viewW <= 400, 'phone width');
    assert.strictEqual(desk.label, 'Remi');
    assert.strictEqual(desk.pillText, 'Remi');
    assert.ok(desk.src.indexOf('remi-corner-chip.png') >= 0, desk.src);
    assert.strictEqual(desk.sheetHidden, true, 'desk does not auto-open Remi');
    assert.ok(desk.natural.w >= 64 && desk.natural.h >= 64, 'chip image loaded');
    assert.ok(inside(desk.fab, {left:0, top:0, right:desk.viewW, bottom:desk.viewH}), 'chip is on the phone');
    assert.ok(desk.fab.left > desk.viewW * 0.55, 'chip floats to the right');
    assert.ok(desk.fab.top > desk.viewH * 0.55, 'chip floats toward the lower corner');
    assert.ok(!/255,\s*255,\s*255/.test(desk.bg), 'chip button is not a white fill');
    assert.ok(!/255,\s*255,\s*255/.test(desk.imgBg), 'chip image is not a white fill');

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
      var spots = [at(w/2, Math.round(h*0.18)), at(Math.round(w*0.22), Math.round(h*0.30)), at(Math.round(w*0.78), Math.round(h*0.42)), at(w/2, Math.round(h*0.78))];
      var white = 0;
      var neon = 0;
      spots.forEach(function(p){
        if(p.a > 200 && p.r > 235 && p.g > 235 && p.b > 235)white++;
        if(p.a > 200 && (p.b > 80 || p.r > 90) && !(p.r > 235 && p.g > 235 && p.b > 235))neon++;
      });
      return {spots:spots, white:white, neon:neon};
    });
    assert.strictEqual(pixels.white, 0, 'chip samples are not a white wipe ' + JSON.stringify(pixels.spots));
    assert.ok(pixels.neon >= 3, 'chip keeps the neon city colors ' + JSON.stringify(pixels.spots));
    await page.screenshot({path: path.join(shotDir, 'remi1-desk-chip.png')});

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTitle', {visible:true});
    const open = await page.evaluate(function(){
      var title = document.getElementById('copilotTitle');
      var sheet = document.getElementById('copilotSheet');
      var on = document.getElementById('copilotQuietOn');
      return {
        title: title.textContent,
        hidden: sheet.hidden,
        quiet: !!(on && on.checked),
        onText: document.querySelector('.copilot-quiet-on') ? document.querySelector('.copilot-quiet-on').textContent : ''
      };
    });
    assert.strictEqual(open.hidden, false, 'tap opens the sheet');
    assert.strictEqual(open.title, 'Remi', open.title);
    assert.strictEqual(open.quiet, true, 'Quiet hours stays On');
    assert.ok(/On/.test(open.onText), open.onText);
    await page.screenshot({path: path.join(shotDir, 'remi1-sheet-open.png')});

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var sheet = document.getElementById('copilotSheet');
      var nurse = document.getElementById('nurseScreen');
      var text = nurse.innerText || '';
      return {
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none' && !fab.hidden),
        sheetHidden: sheet.hidden,
        nurseActive: nurse.classList.contains('active'),
        mentionsRemi: /\bRemi\b/.test(text)
      };
    });
    assert.strictEqual(nurse.nurseActive, true, 'nurse home is showing');
    assert.strictEqual(nurse.fabVisible, false, 'Nurse has no Remi chip');
    assert.strictEqual(nurse.sheetHidden, true, 'Nurse does not get the Remi sheet');
    assert.strictEqual(nurse.mentionsRemi, false, 'Nurse home copy has no Remi');

    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'sched@evercare.test';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      showTab('timesheets');
    });
    const sched = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      return {visible: !!(fab && !fab.hidden && fab.getClientRects().length), label: fab.getAttribute('aria-label')};
    });
    assert.strictEqual(sched.visible, true, 'Scheduler still gets the Remi chip');
    assert.strictEqual(sched.label, 'Remi');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remi1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
