#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(root, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

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

assert.ok(html.includes("var GEO1='GEO1'"), 'GEO1 marker');
assert.ok(html.includes('GEO1_MARKER'), 'GEO1 marker name');
assert.ok(html.includes('?v=geo1'), 'cache tag');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays');
const firstMeta = html.slice(html.indexOf('<meta name="admin-build"'), html.indexOf('<meta name="admin-build"') + 90);
assert.ok(firstMeta.includes('2026-09-27-remi-float-hide1b'), 'first admin-build meta stays');
assert.ok(html.includes('id="clientPinRow"'), 'home pin row');
assert.ok(html.includes('Set pin from a visit'), 'pin button');
assert.ok(html.includes('admin_list_client_visit_gps'), 'list rpc');
assert.ok(html.includes('admin_set_client_pin_from_visit'), 'set rpc');
assert.ok(html.includes('admin_timesheet_gps_distances'), 'distance rpc');
assert.ok(html.includes('showLocationDistance'), 'distance opener');
assert.ok(!html.includes('showLocationMap'), 'map opener is gone');
assert.ok(!html.includes('id="mapContainer"'), 'map box is gone');
assert.ok(!html.includes('id="geocodeResult"'), 'outside lookup result is gone');
assert.ok(html.includes('Pin on file'), 'list badge');
assert.ok(html.includes('No client pin yet. Set one from a verified visit (Client > Home pin).'));
assert.ok(html.includes('Address changed. The old pin was cleared. Set a new pin from the next verified visit.'));

const saveSrc = extractFn(html, 'async function saveClient()');
assert.ok(saveSrc, 'saveClient');
assert.ok(!/\blat\b/.test(saveSrc) && !/\blng\b/.test(saveSrc), 'saveClient does not send coordinates');
const writeSrc = extractFn(html, 'function sbClientWriteBody(payload, isCreate)');
assert.ok(writeSrc && !/\blat\b/.test(writeSrc) && !/\blng\b/.test(writeSrc), 'write body does not send coordinates');
const remiSrc = extractFn(html, 'function remiSecClientPayload(client, address)');
assert.ok(remiSrc && !/\blat\b/.test(remiSrc) && !/\blng\b/.test(remiSrc), 'remi address payload does not send coordinates');
const commitSrc = extractFn(html, 'async function remiSecCommit(action)');
assert.ok(commitSrc && !/\blat\b/.test(commitSrc) && !/\blng\b/.test(commitSrc), 'remi address write does not send coordinates');
const select = (html.match(/var SB_CLIENT_SELECT='([^']+)'/) || [])[1];
assert.ok(select.includes('pin_source') && select.includes('pin_set_at') && select.includes('pin_day') && select.includes('pin_timesheet_id'), 'client read selects pin columns');
assert.ok(select.includes('pin_set_by') && select.includes('pin_accuracy_m'), 'client read selects the rest of the pin columns');
assert.ok(!/pin_source\s*:/.test(writeSrc), 'pin columns are not written');
assert.ok(extractFn(html, 'function geo1WithTimeout()').includes('10000'), 'rpc abort is 10 seconds');
assert.ok(extractFn(html, 'async function geo1ListVisitPins()').includes('geo1OfficeCanPin'), 'list is role gated');
assert.ok(extractFn(html, 'async function showLocationDistance(dayIndex)').includes('admin_timesheet_gps_distances'), 'distance uses the rpc');

const banned = [
  ['nomi', 'natim'].join(''),
  ['open', 'street', 'map'].join(''),
  ['tile', '.osm'].join(''),
  ['leaf', 'let'].join('')
];
const hits = [];
function walk(dir){
  fs.readdirSync(dir, {withFileTypes:true}).forEach(function(ent){
    if(ent.name === '.git' || ent.name === 'node_modules')return;
    const full = path.join(dir, ent.name);
    if(ent.isDirectory()){walk(full);return;}
    if(!ent.isFile())return;
    let buf;
    try{buf = fs.readFileSync(full);}catch(e){return;}
    if(buf.indexOf(0) >= 0)return;
    const text = buf.toString('utf8').toLowerCase();
    banned.forEach(function(word){
      if(text.indexOf(word) >= 0)hits.push(path.relative(root, full) + ':' + word);
    });
  });
}
walk(root);
assert.deepStrictEqual(hits, [], 'vendor names stay at 0');

function element(){
  return {hidden:false, disabled:false, value:'', textContent:'', innerHTML:'', style:{}};
}
const els = {};
function getEl(id){
  if(!els[id])els[id] = element();
  return els[id];
}
const calls = [];
let confirmBox = null;
const toasts = [];
const sandbox = {
  calls: calls,
  currentAdminRole: 'Admin',
  allClients: [],
  currentRec: null,
  DAYS: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  FT_PER_MI: 5280,
  EVERCARE_ORG_ID: 'org-test',
  GEO1_PIN_CLEARED: 'Address changed. The old pin was cleared. Set a new pin from the next verified visit.',
  geo1VisitPoints: [],
  geo1PinBusy: false,
  geo1ListClientId: '',
  document: {getElementById: getEl},
  AbortController: AbortController,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Number: Number,
  String: String,
  Math: Math,
  Object: Object,
  Array: Array,
  JSON: JSON,
  Promise: Promise,
  isFinite: isFinite,
  Date: Date,
  showTempMsg: function(msg){toasts.push(String(msg));},
  showSharedConfirm: function(title, fn, label){confirmBox = {title:title, fn:fn, label:label};},
  openModal: function(id){sandbox.opened = id;},
  cacheInvalidate: function(action){sandbox.invalidated = action;},
  renderClients: function(){sandbox.refreshed = true;},
  sbRestRpc: async function(name, body, signal){
    calls.push({name:name, body:body, signal:signal});
    if(sandbox.rpc)return sandbox.rpc(name, body, signal);
    return {ok:false, network:true, error:'down'};
  }
};
const names = [
  'function sbActiveLinks(rows)',
  'function sbAsJsonObject(v)',
  'function sbRpcNode(data)',
  'function sbUuid(v)',
  'function sbCoord(v)',
  'function sbOrgId()',
  'function sbClientWriteBody(payload, isCreate)',
  'function sbMapClient(row)',
  'function resolveDistanceMiles(d)',
  'function formatDistanceMiles(d)',
  'function dayHasDistance(d)',
  'function gpsDistanceUi(d)',
  'function formatAdminDate(val)',
  'function formatTimesheetDayLabel(val)',
  'function geo1OfficeCanPin()',
  'function geo1HasCoords(c)',
  'function geo1AddressKey(s)',
  'function geo1AddressChanged(before, after)',
  'function geo1ClearLocalPin(c)',
  'function geo1FormatWhen(raw)',
  'function geo1PinStatusText(c)',
  'function geo1PhoneGpsMessage(kind)',
  'function geo1PinErrorCopy(code, message)',
  'function geo1VisitReasonCopy(reason)',
  'function geo1FeetWords(ft)',
  'function geo1Esc(s)',
  'function geo1WithTimeout()',
  'function geo1Node(got)',
  'function geo1ReadRpc(got)',
  'function geo1PinSay(text)',
  'function geo1PaintPin(c)',
  'function geo1LocLabel(d)',
  'function geo1LocCell(d, dayIndex, withButton)',
  'function geo1DistanceCopy(pack, dayKey)',
  'function geo1StoredDistanceCopy(d)',
  'function geo1PaintDistance(copy)',
  'function geo1FindClient(id)',
  'function geo1ApplyPin(clientId, node, visitDate)',
  'function geo1PaintVisits(points, hasPin)',
  'async function geo1ListVisitPins()',
  'async function geo1ChooseVisit(index, replace)',
  'async function showLocationDistance(dayIndex)'
];
const src = names.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing '+sig);
  return fn;
}).join('\n');
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const clientId = '11111111-1111-4111-8111-111111111111';
const sheetId = '22222222-2222-4222-8222-222222222222';
const created = sandbox.sbClientWriteBody({name:'Ada Cole', address:'1 Main', lat:'41.5', lng:'-81.6', pin_source:'manual', pin_set_at:'2026-10-01'}, true);
assert.ok(!Object.prototype.hasOwnProperty.call(created, 'lat'));
assert.ok(!Object.prototype.hasOwnProperty.call(created, 'lng'));
assert.ok(!Object.prototype.hasOwnProperty.call(created, 'pin_source'));
assert.strictEqual(created.name, 'Ada Cole');
assert.strictEqual(created.address, '1 Main');
const updated = sandbox.sbClientWriteBody({name:'Ada Cole', address:'9 Oak', lat:'', lng:''}, false);
assert.strictEqual(updated.name, 'Ada Cole');
assert.strictEqual(updated.address, '9 Oak');
assert.deepStrictEqual(Object.keys(updated).sort(), ['address', 'name']);

const mapped = sandbox.sbMapClient({
  id: clientId, name:'Ada Cole', address:'1 Main', is_active:true, lat:41.5, lng:-81.6,
  pin_source:'visit_gps', pin_set_at:'2026-10-06T15:00:00Z', pin_day:'1', pin_timesheet_id:sheetId,
  pin_accuracy_m:18, pin_set_by:'office', assignments:[]
});
assert.strictEqual(mapped.pin_source, 'visit_gps');
assert.strictEqual(mapped.pin_day, '1');
assert.strictEqual(mapped.pin_timesheet_id, sheetId);
assert.strictEqual(mapped.lat, 41.5);
assert.strictEqual(sandbox.geo1PinStatusText(mapped), '📍 Pin set from visit on 10/06/2026');
assert.strictEqual(sandbox.geo1PinStatusText({pin_source:'manual', lat:1, lng:2}), '📍 Pin set manually');
assert.strictEqual(sandbox.geo1PinStatusText({lat:1, lng:2}), '📍 Pin on file');
assert.strictEqual(sandbox.geo1PinStatusText({lat:'', lng:''}), 'No pin yet. Set one from a verified visit.');
assert.strictEqual(sandbox.geo1AddressChanged('123 Main St.', '123 main st'), false);
assert.strictEqual(sandbox.geo1AddressChanged('123 Main St.', '9 Oak'), true);
assert.strictEqual(sandbox.geo1PhoneGpsMessage('denied'), 'Location is off for this site. Turn on Location in Settings, then come back home and tap Continue.');
assert.strictEqual(sandbox.geo1PhoneGpsMessage('1'), 'Location is off for this site. Turn on Location in Settings, then come back home and tap Continue.');
assert.strictEqual(sandbox.geo1PhoneGpsMessage('rough'), 'Location is rough. Step near a window and tap Continue again.');
assert.strictEqual(sandbox.geo1PhoneGpsMessage('timeout'), "Couldn't get your location. Check that Location is on and tap Continue again.");
assert.strictEqual(sandbox.geo1PhoneGpsMessage('3'), "Couldn't get your location. Check that Location is on and tap Continue again.");

const errors = [
  ['42501', 'forbidden: admin/scheduler only', 'Only Admin or Scheduler can set a pin.'],
  ['42501', 'forbidden: office only', 'Only Admin or Scheduler can set a pin.'],
  ['42501', 'permission denied for function', 'Only Admin or Scheduler can set a pin.'],
  ['22023', 'no phone gps for that day', 'That visit has no phone location.'],
  ['22023', 'phone gps too inaccurate (over 100 m)', "That visit's location was too rough (over 100 m). Pick another visit."],
  ['22023', 'visit failed the location check (verified=false)', "That visit was saved away from the client's pin."],
  ['22023', 'visit not verified: aide and client signatures required for that day', 'Pick a visit with both signatures.'],
  ['22023', 'timesheet is not for this client', "Couldn't use that visit."],
  ['22023', 'no visit saved for that day', "Couldn't use that visit."],
  ['22023', 'p_day must be a day key (0-6)', "Couldn't use that visit."],
  ['22023', 'phone gps out of range', "Couldn't use that visit."],
  ['22023', 'org required', "Couldn't use that visit."],
  ['P0002', 'client not found', 'Not found. Refresh and try again.'],
  ['P0002', 'timesheet not found', 'Not found. Refresh and try again.']
];
errors.forEach(function(row){
  const copy = sandbox.geo1PinErrorCopy(row[0], row[1]);
  assert.strictEqual(copy.text, row[2], row[1]);
  assert.ok(copy.text.indexOf(row[1]) < 0 || row[2] === row[1]);
});
assert.strictEqual(sandbox.geo1PinErrorCopy('22023', 'client already has a pin (pass p_replace=true to replace)').replace, true);
assert.strictEqual(sandbox.geo1VisitReasonCopy('missing_signatures'), 'Pick a visit with both signatures.');
assert.strictEqual(sandbox.geo1VisitReasonCopy('gps_too_inaccurate'), "That visit's location was too rough (over 100 m). Pick another visit.");
assert.strictEqual(sandbox.geo1VisitReasonCopy('failed_location_check'), "That visit was saved away from the client's pin.");
assert.strictEqual(sandbox.geo1VisitReasonCopy('gps_out_of_range'), "Couldn't use that visit.");

const near = sandbox.geo1DistanceCopy({
  ok:true, client_has_pin:true, aide_home_distance_ft:10560,
  days:[{day:'1', has_gps:true, within_500ft:true, distance_ft:120, accuracy_m:12}]
}, '1');
assert.strictEqual(near.banner, "✅ At the client's home: 120 ft (±12 m)");
assert.strictEqual(near.extra, "Aide's home is 2.00 mi from this client.");
const far = sandbox.geo1DistanceCopy({
  ok:true, client_has_pin:true, days:[{day:'2', has_gps:true, within_500ft:false, distance_ft:5280, accuracy_m:40}]
}, 2);
assert.strictEqual(far.banner, "❌ 1.00 mi from the client's pin");
assert.strictEqual(far.extra, '');
const noPin = sandbox.geo1DistanceCopy({ok:true, client_has_pin:false, days:[{day:'0', has_gps:true, within_500ft:false, distance_ft:10}]}, '0');
assert.strictEqual(noPin.banner, 'No client pin yet. Set one from a verified visit (Client > Home pin).');
const noGps = sandbox.geo1DistanceCopy({ok:true, client_has_pin:true, days:[{day:'3', has_gps:false}]}, '3');
assert.strictEqual(noGps.banner, 'No phone location saved for this day.');
const stored = sandbox.geo1StoredDistanceCopy({verified:true, distanceFt:2640});
assert.strictEqual(stored, "✅ At the client's home: 0.50 mi");
const label = sandbox.geo1LocCell({lat:1, lng:2, accuracyM:12, verified:true, distanceFt:200}, 1, true);
assert.ok(label.indexOf('📍 GPS saved') === 0, label);
assert.ok(label.indexOf('showLocationDistance(1)') > 0, label);
assert.ok(label.indexOf('📍 View') > 0, label);
const oldLabel = sandbox.geo1LocCell({location:'100 Example Ave', verified:false, distanceMi:0.4}, 0, false);
assert.ok(oldLabel.indexOf('100 Example Ave') > 0);
assert.ok(oldLabel.indexOf('showLocationDistance') < 0);

(async function(){
getEl('editClientId').value = clientId;
sandbox.currentAdminRole = 'Nurse';
calls.length = 0;
toasts.length = 0;
await sandbox.geo1ListVisitPins();
assert.strictEqual(calls.length, 0, 'Nurse does not list visits');
assert.strictEqual(getEl('clientPinNote').textContent, 'Only Admin or Scheduler can set a pin.');
assert.ok(toasts[0].indexOf('Only Admin or Scheduler can set a pin.') === 0);
sandbox.geo1PaintPin({id:clientId, lat:1, lng:2});
assert.strictEqual(getEl('clientPinActions').hidden, true, 'Nurse pin controls stay hidden');
assert.strictEqual(getEl('clientPinStatus').textContent, '📍 Pin on file');

sandbox.currentAdminRole = 'Scheduler';
sandbox.geo1PaintPin({id:clientId, address:'1 Main'});
assert.strictEqual(getEl('clientPinActions').hidden, false, 'Scheduler sees pin controls');
assert.strictEqual(getEl('clientPinBtn').hidden, false);
assert.strictEqual(getEl('clientPinStatus').textContent, 'No pin yet. Set one from a verified visit.');
sandbox.rpc = function(name){
  if(name === 'admin_list_client_visit_gps'){
    return {ok:true, data:{
      ok:true, client_has_pin:true, pin_source:'visit_gps',
      points:[
        {timesheet_id:sheetId, day:'0', date:'2026-10-01', reason:'no_gps', eligible:false, lat:41.5, lng:-81.6},
        {timesheet_id:sheetId, day:'1', date:'2026-10-06', accuracy_m:80, distance_ft_to_pin:400, eligible:false, reason:'missing_signatures', lat:41.5, lng:-81.6},
        {timesheet_id:sheetId, day:'2', date:'2026-10-07', accuracy_m:18, distance_ft_to_pin:90, eligible:true, reason:null, lat:41.499, lng:-81.611}
      ]
    }};
  }
  return {ok:false, data:{code:'22023', message:'client already has a pin (pass p_replace=true to replace)'}, error:'client already has a pin (pass p_replace=true to replace)'};
};
calls.length = 0;
await sandbox.geo1ListVisitPins();
assert.strictEqual(calls.length, 1);
assert.strictEqual(calls[0].name, 'admin_list_client_visit_gps');
assert.strictEqual(calls[0].body.p_client_id, clientId);
assert.deepStrictEqual(Object.keys(calls[0].body), ['p_client_id']);
assert.ok(calls[0].signal, 'list passes an abort signal');
const listHtml = getEl('clientPinVisits').innerHTML;
assert.ok(listHtml.indexOf('10/06/2026') > 0, listHtml);
assert.ok(listHtml.indexOf('10/07/2026') > 0, listHtml);
assert.ok(listHtml.indexOf('10/01/2026') < 0, 'a visit with no phone location is not listed');
assert.ok(listHtml.indexOf('is-off') > 0, listHtml);
assert.ok(listHtml.indexOf('Pick a visit with both signatures.') > 0, listHtml);
assert.ok(listHtml.indexOf('41.499') < 0 && listHtml.indexOf('-81.611') < 0, 'coordinates stay off the screen');
assert.ok(listHtml.indexOf('Use this visit') > 0);

sandbox.allClients = [{id:clientId, name:'Ada Cole', address:'1 Main', lat:41.5, lng:-81.6, pin_source:'visit_gps'}];
calls.length = 0;
confirmBox = null;
await sandbox.geo1ChooseVisit(1, false);
assert.strictEqual(calls.length, 1);
assert.strictEqual(calls[0].name, 'admin_set_client_pin_from_visit');
assert.strictEqual(calls[0].body.p_client_id, clientId);
assert.strictEqual(calls[0].body.p_timesheet_id, sheetId);
assert.strictEqual(calls[0].body.p_day, '2');
assert.strictEqual(calls[0].body.p_replace, false);
assert.deepStrictEqual(Object.keys(calls[0].body).sort(), ['p_client_id','p_day','p_replace','p_timesheet_id']);
assert.ok(!Object.prototype.hasOwnProperty.call(calls[0].body, 'lat'));
assert.strictEqual(confirmBox.title, 'Replace the current pin?');
assert.strictEqual(confirmBox.label, 'Replace');
sandbox.rpc = function(name, body){
  assert.strictEqual(body.p_replace, true);
  return {ok:true, data:{
    ok:true, success:true, marker:'geo1', pin_source:'visit_gps', pin_set_at:'2026-10-07T18:00:00Z',
    pin_day:'2', pin_timesheet_id:sheetId, pin_accuracy_m:18, lat:41.499, lng:-81.611, visit_date:'2026-10-07'
  }};
};
await sandbox.geo1ChooseVisit(1, true);
assert.strictEqual(sandbox.invalidated, 'get_clients');
assert.strictEqual(getEl('clientPinStatus').textContent, '📍 Pin set from visit on 10/07/2026');
assert.strictEqual(getEl('clientPinNote').textContent, 'Pin set from that visit.');
assert.ok(getEl('clientPinStatus').textContent.indexOf('41.499') < 0);
assert.strictEqual(sandbox.allClients[0].pin_source, 'visit_gps');

sandbox.currentAdminRole = 'Admin';
calls.length = 0;
sandbox.rpc = function(){
  return {ok:false, aborted:true, error:'aborted'};
};
await sandbox.geo1ListVisitPins();
assert.strictEqual(getEl('clientPinNote').textContent, 'That took too long. Try again.');
assert.ok(toasts.join('\n').indexOf('aborted') < 0);
sandbox.rpc = function(){
  return {ok:false, network:true, error:'Failed to fetch postgres JWT'};
};
await sandbox.geo1ListVisitPins();
assert.strictEqual(getEl('clientPinNote').textContent, "Couldn't reach the desk. Try again.");
assert.ok(getEl('clientPinNote').textContent.indexOf('Failed to fetch') < 0);
assert.ok(getEl('clientPinNote').textContent.indexOf('postgres') < 0);

sandbox.currentRec = {id:'sheet-old', clientName:'Ada Cole', days:{1:{verified:false, distanceFt:5280, location:'old label'}}};
calls.length = 0;
await sandbox.showLocationDistance(1);
assert.strictEqual(calls.length, 0, 'an old cached record does not call the network');
assert.strictEqual(sandbox.opened, 'locationMapModal');
assert.strictEqual(getEl('mapModalTitle').textContent, 'Visit location');
assert.strictEqual(getEl('mapStatusBanner').textContent, "❌ 1.00 mi from the client's pin");

sandbox.currentAdminRole = 'Nurse';
sandbox.currentRec = {id:sheetId, days:{1:{lat:1, lng:2, accuracyM:12}}};
sandbox.rpc = function(){
  return {ok:true, data:{ok:true, client_has_pin:true, aide_home_distance_ft:2640, days:[{day:'1', has_gps:true, within_500ft:true, distance_ft:80, accuracy_m:9}]}};
};
calls.length = 0;
await sandbox.showLocationDistance(1);
assert.strictEqual(calls.length, 1, 'Nurse can read distance');
assert.strictEqual(calls[0].name, 'admin_timesheet_gps_distances');
assert.strictEqual(calls[0].body.p_timesheet_id, sheetId);
assert.deepStrictEqual(Object.keys(calls[0].body), ['p_timesheet_id']);
assert.strictEqual(getEl('mapStatusBanner').textContent, "✅ At the client's home: 80 ft (±9 m)");
assert.strictEqual(getEl('visitDistanceExtra').textContent, "Aide's home is 0.50 mi from this client.");

console.log('admin-geo1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
