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

assert.ok(html.includes('v=bcast1'), 'bcast1 marker');
assert.ok(html.includes('v=nursespd2'), 'nursespd2 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-sched1m">'), 'admin-build meta');
assert.ok(html.includes('v=nursenb1'), 'nursenb1 marker stays');
assert.ok(html.includes('v=sched1'), 'schedule marker stays');
assert.ok(html.includes('v=warmoff1'), 'warmoff1 marker stays');
assert.ok(html.includes('v=adminpw1'), 'adminpw1 marker stays');
assert.ok(html.includes("sbRestRpc('list_schedule_week'"), 'schedule week RPC stays');
assert.ok(html.includes("sbRestRpc('list_new_client_intakes'"), 'nurse completes RPC stays');
assert.ok(html.includes("sbRestRpc('get_active_broadcast'"), 'get_active_broadcast RPC');
assert.ok(html.includes("sbRestRpc('send_broadcast'"), 'send_broadcast RPC');
assert.ok(html.includes("sbRestRpc('clear_broadcast'"), 'clear_broadcast RPC');
assert.ok(html.includes('p_message'), 'send body uses p_message');
assert.ok(!/broadcast.*SHEETS_URL|SHEETS_URL.*broadcast|action:'.*broadcast/i.test(html), 'no Sheets /exec action for broadcast');

const sendBroadcast = extractFn(html, 'async function sendBroadcast()') || extractFn(html, 'function sendBroadcast()');
const clearBroadcast = extractFn(html, 'async function clearBroadcast()') || extractFn(html, 'function clearBroadcast()');
const renderBroadcastPreview = extractFn(html, 'function renderBroadcastPreview()');
const loadActiveBroadcast = extractFn(html, 'async function loadActiveBroadcast()');
const paint = extractFn(html, 'function bcastPaintPreview(msg)');
const fromRpc = extractFn(html, 'function bcastActiveFromRpc(got)');
const localPaint = extractFn(html, 'function renderBroadcastPreviewLocal()');
assert.ok(sendBroadcast && clearBroadcast && renderBroadcastPreview && loadActiveBroadcast && paint && fromRpc && localPaint, 'broadcast helpers missing');

assert.ok(sendBroadcast.includes('evercareSbEnabled()'), 'send gates on cut');
assert.ok(sendBroadcast.includes("sbRestRpc('send_broadcast'"), 'send uses Ace RPC');
assert.ok(sendBroadcast.includes('p_message'), 'send passes p_message');
assert.ok(sendBroadcast.includes("localStorage.setItem('broadcast_msg'"), 'rollback still sets localStorage');
assert.ok(sendBroadcast.indexOf('evercareSbEnabled') < sendBroadcast.indexOf("localStorage.setItem('broadcast_msg'"),
  'localStorage set only after cut-OFF branch');

assert.ok(clearBroadcast.includes("sbRestRpc('clear_broadcast'"), 'clear uses Ace RPC');
assert.ok(clearBroadcast.includes("localStorage.removeItem('broadcast_msg'"), 'rollback still clears localStorage');

assert.ok(loadActiveBroadcast.includes("sbRestRpc('get_active_broadcast'"), 'load uses get_active_broadcast');
assert.ok(renderBroadcastPreview.includes('loadActiveBroadcast()'), 'preview loads Ace when cut on');
assert.ok(renderBroadcastPreview.includes('renderBroadcastPreviewLocal()'), 'preview keeps local rollback');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const schedSrc = html.slice(schedStart, schedEnd);
assert.ok(schedStart > 0 && schedEnd > schedStart, 'schedule block stays');
assert.ok(!/get_active_broadcast|send_broadcast|clear_broadcast/.test(schedSrc), 'schedule block untouched by broadcast');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];

function harness(opts){
  const mem = Object.assign({}, opts.storage || {});
  const rpc = [];
  const toasts = [];
  const alerts = [];
  const els = {
    broadcastMsg: {value: opts.msg || ''},
    broadcastPreview: {innerHTML: ''}
  };
  const box = {
    els: els,
    rpc: rpc,
    toasts: toasts,
    alerts: alerts,
    mem: mem,
    sbOn: opts.sbOn !== false,
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    document: {getElementById: function(id){return els[id] || null;}},
    evercareSbEnabled: function(){return !!box.sbOn;},
    showTempMsg: function(msg, color){toasts.push({msg:msg, color:color});},
    alert: function(msg){alerts.push(String(msg));},
    sbRestRpc: async function(name, body){
      rpc.push({name:name, body:body});
      if(typeof box.nextRpc === 'function')return box.nextRpc(name, body);
      return box.nextRpc || {ok:true, data:{ok:true, success:true, data:null}};
    },
    nextRpc: null
  };
  vm.createContext(box);
  vm.runInContext([
    paint,
    fromRpc,
    localPaint,
    loadActiveBroadcast,
    sendBroadcast,
    clearBroadcast,
    renderBroadcastPreview
  ].join('\n'), box);
  return box;
}

(async function(){
  // Cut ON: tab load → get_active_broadcast; preview from data.message
  {
    const box = harness({sbOn:true});
    box.nextRpc = {ok:true, data:{ok:true, success:true, data:{message:'Storm delay — stay home'}}};
    await box.loadActiveBroadcast();
    assert.strictEqual(box.rpc.length, 1);
    assert.strictEqual(box.rpc[0].name, 'get_active_broadcast');
    assert.ok(box.rpc[0].body && typeof box.rpc[0].body === 'object' && !Array.isArray(box.rpc[0].body));
    assert.deepStrictEqual(Object.keys(box.rpc[0].body), []);
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('Storm delay — stay home') >= 0);
    assert.ok(!Object.prototype.hasOwnProperty.call(box.mem, 'broadcast_msg'), 'cut ON load does not write localStorage');
  }

  // Cut ON: get returns data null → empty preview
  {
    const box = harness({sbOn:true});
    box.nextRpc = {ok:true, data:{ok:true, success:true, data:null}};
    await box.loadActiveBroadcast();
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('No active alert') >= 0);
  }

  // Cut ON: send → send_broadcast {p_message}; preview from returned data; toast; no localStorage
  {
    const box = harness({sbOn:true, msg:'  Flood warning  '});
    box.nextRpc = {ok:true, data:{ok:true, success:true, data:{message:'Flood warning'}}};
    await box.sendBroadcast();
    assert.strictEqual(box.rpc.length, 1);
    assert.strictEqual(box.rpc[0].name, 'send_broadcast');
    assert.strictEqual(box.rpc[0].body.p_message, 'Flood warning');
    assert.deepStrictEqual(Object.keys(box.rpc[0].body), ['p_message']);
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('Flood warning') >= 0);
    assert.strictEqual(box.toasts.length, 1);
    assert.ok(box.toasts[0].msg.indexOf('Alert sent') >= 0);
    assert.ok(!Object.prototype.hasOwnProperty.call(box.mem, 'broadcast_msg'), 'cut ON send drops localStorage.setItem');
  }

  // Cut ON: clear → clear_broadcast {}; preview empty; no localStorage
  {
    const box = harness({sbOn:true, msg:'old', storage:{broadcast_msg:'stale'}});
    box.nextRpc = {ok:true, data:{ok:true, success:true, data:null}};
    await box.clearBroadcast();
    assert.strictEqual(box.rpc.length, 1);
    assert.strictEqual(box.rpc[0].name, 'clear_broadcast');
    assert.ok(box.rpc[0].body && typeof box.rpc[0].body === 'object' && !Array.isArray(box.rpc[0].body));
    assert.deepStrictEqual(Object.keys(box.rpc[0].body), []);
    assert.strictEqual(box.els.broadcastMsg.value, '');
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('No active alert') >= 0);
    assert.strictEqual(box.mem.broadcast_msg, 'stale', 'cut ON clear does not touch localStorage key');
    assert.ok(box.toasts[0].msg.indexOf('cleared') >= 0);
  }

  // Cut ON: renderBroadcastPreview kicks loadActiveBroadcast
  {
    const box = harness({sbOn:true});
    let called = 0;
    box.loadActiveBroadcast = async function(){called++;};
    box.renderBroadcastPreview();
    assert.strictEqual(called, 1);
  }

  // Rollback: localStorage path exactly as today
  {
    const box = harness({sbOn:false, msg:'Local only alert'});
    await box.sendBroadcast();
    assert.strictEqual(box.rpc.length, 0);
    assert.strictEqual(box.mem.broadcast_msg, 'Local only alert');
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('Local only alert') >= 0);
    await box.clearBroadcast();
    assert.ok(!Object.prototype.hasOwnProperty.call(box.mem, 'broadcast_msg'));
    assert.strictEqual(box.els.broadcastMsg.value, '');
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('No active alert') >= 0);
  }

  // Rollback preview does not call Ace
  {
    const box = harness({sbOn:false, storage:{broadcast_msg:'From disk'}});
    box.renderBroadcastPreview();
    assert.strictEqual(box.rpc.length, 0);
    assert.ok(box.els.broadcastPreview.innerHTML.indexOf('From disk') >= 0);
  }

  // Empty send alerts and does not RPC
  {
    const box = harness({sbOn:true, msg:'   '});
    await box.sendBroadcast();
    assert.strictEqual(box.rpc.length, 0);
    assert.deepStrictEqual(box.alerts, ['Please enter a message.']);
  }

  // Send failure surfaces Ace error, no success toast
  {
    const box = harness({sbOn:true, msg:'Nope'});
    box.nextRpc = {ok:false, error:'office only'};
    await box.sendBroadcast();
    assert.strictEqual(box.toasts.length, 1);
    assert.ok(box.toasts[0].msg.indexOf('office only') >= 0);
    assert.ok(box.toasts[0].color.indexOf('danger') >= 0 || box.toasts[0].color === 'var(--danger)');
  }

  console.log('admin-broadcast-sb-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
