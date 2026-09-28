#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-float-hide1b'), 'remi-float-hide1b marker');
assert.ok(html.includes('data-remi-float-hide1b="v=remi-float-hide1b"'), 'data attr');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-hide1b">'), 'hide1b meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-hide1">'), 'prior hide1 meta stays');
assert.ok(html.includes('<!-- remi float hide1b 2026-09-27 v=remi-float-hide1b admin-build 2026-09-27-remi-float-hide1b'), 'comment');
assert.ok(html.includes("var REMI_FLOAT_HIDE1B_MARKER='v=remi-float-hide1b'"), 'script marker');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll stays after hide1');
['v=remi-float-hide1','v=remi-float-noshow1','v=remi-payroll1','v=coverage-simple1','v=nosvc-reason-draft1','v=hold-clear1','v=hold-autosave1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'marker stays ' + mark);
});

function slice(startMark, endMark){
  const start = html.indexOf(startMark);
  const end = html.indexOf(endMark);
  assert.ok(start > 0 && end > start, startMark);
  return html.slice(start, end);
}

const noshowSrc = slice('// remi float noshow1 v=remi-float-noshow1', '// end remi float noshow1 v=remi-float-noshow1');
const hideSrc = slice('// remi float hide1 v=remi-float-hide1', '// end remi float hide1 v=remi-float-hide1');
const ideasSrc = slice('// remi ideas763 v=remi-ideas763', '// end remi ideas763 v=remi-ideas763');
const hide1bSrc = slice('// remi float hide1b v=remi-float-hide1b', '// end remi float hide1b v=remi-float-hide1b');

assert.ok(noshowSrc.includes('<span class="remi-fn-chip">Float pool</span>'), 'noshow source still has the old Float pool chip');
assert.ok(hideSrc.includes('Float pool UI removed from Remi.'), 'hide1 source still explains the removed block');
assert.ok(ideasSrc.includes('>Blast float pool<'), 'ideas763 source still says Blast float pool');
assert.ok(!hide1bSrc.includes('<span class="remi-fn-chip">Float pool</span>'), 'hide1b does not paint a Float pool chip');
assert.ok(!hide1bSrc.includes('<div class="remi-fn-label">Float pool</div>'), 'hide1b does not paint a Float pool section');
assert.ok(hide1bSrc.includes('admin_blast_cover_request'), 'blast rpc stays named');
assert.ok(!hide1bSrc.includes("sbRestRpc('admin_blast_cover_request'"), 'hide1b does not replace the blast call');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(hide1bSrc), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(hide1bSrc), 'no Quo or SMS');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'coverage blast stays');
assert.ok(!simple.includes('remi-float-hide1b'), 'coverage-simple1 block is unchanged');
assert.ok(html.includes('id="coverSimpleBlastGate"'), 'who can cover blast gate');
assert.ok(html.includes('id="coverSimpleBlastGateNote">Confirm before this blast sends. Not yet writes nothing.'), 'send chat blast gate note');
assert.ok(html.includes('onclick="coverSimpleBlastGateConfirm()"'), 'gate confirm stays on the panel');
assert.ok(html.includes('onclick="coverSimpleBlastGateCancel()"'), 'gate not yet stays on the panel');

const SHIFT = '55555555-5555-4555-8555-555555555555';
const DEVON = '44444444-4444-4444-8444-444444444441';
const LINA = '44444444-4444-4444-8444-444444444442';
const SARA = '44444444-4444-4444-8444-444444444443';
const JAMAL = '44444444-4444-4444-8444-444444444444';
const AISHA = '44444444-4444-4444-8444-444444444446';
const GHOST = '44444444-4444-4444-8444-444444444447';
const MARIA = '44444444-4444-4444-8444-444444444445';
const RESCUE = '66666666-6666-4666-8666-666666666666';
const RANK = {
  success: true,
  ok: true,
  hide_float_ui: true,
  float_pool: [{rank: 9, aide_id: GHOST, name: 'ShouldNotPaint', same_day_yes_30d: 3, miles: 1, is_float: true}],
  float_count: 1,
  open_shift_id: SHIFT,
  client_name: 'Bowlax',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  assigned_aide_id: MARIA,
  ranked: [
    {rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true},
    {rank: 2, aide_id: LINA, name: 'Lina', same_day_yes_30d: 6, miles: 3, is_float: true},
    {rank: 3, aide_id: SARA, name: 'Sara', same_day_yes_30d: 4, miles: 1.8, is_float: true}
  ],
  rest: [
    {rank: 4, aide_id: JAMAL, name: 'Jamal', same_day_yes_30d: 0, miles: 5.2, is_float: false},
    {rank: 5, aide_id: AISHA, name: 'Aisha', same_day_yes_30d: 0, miles: 4.4, is_float: false}
  ]
};
const ONLY_POOL = {
  client_name: 'Bowlax',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  ranked: [],
  rest: [],
  float_pool: [{rank: 1, aide_id: GHOST, name: 'PoolYes', same_day_yes_30d: 3, miles: 1, is_float: true}]
};
const REST_MIXED = {
  client_name: 'Bowlax',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  ranked: [],
  rest: [
    {rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true},
    {rank: 2, aide_id: LINA, name: 'Lina', same_day_yes_30d: 6, miles: 3, is_float: true},
    {rank: 12, aide_id: JAMAL, name: 'Jamal', same_day_yes_30d: 0, miles: 5.2, is_float: false},
    {rank: 13, aide_id: AISHA, name: 'Aisha', same_day_yes_30d: 0, miles: 4.4, is_float: false}
  ],
  aides: [
    {rank: 8, aide_id: SARA, name: 'Sara', same_day_yes_30d: 4, miles: 1.8, is_float: true}
  ],
  float_pool: [
    {rank: 9, aide_id: GHOST, name: 'PoolYes', same_day_yes_30d: 2, miles: 1, is_float: true},
    {rank: 20, aide_id: '44444444-4444-4444-8444-444444444448', name: 'PoolZero', same_day_yes_30d: 0, miles: 9, is_float: true}
  ]
};
const ALL_REST = {
  client_name: 'Bowlax',
  ranked: [],
  rest: [{rank: 4, aide_id: JAMAL, name: 'Jamal', same_day_yes_30d: 0, miles: 5.2, is_float: false}],
  float_pool: []
};
const ALL_YES = {
  client_name: 'Bowlax',
  ranked: [],
  rest: [{rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true}],
  float_pool: []
};
const PROBE_A = '44444444-4444-4444-8444-444444444461';
const PROBE_B = '44444444-4444-4444-8444-444444444462';
const PROBE_C = '44444444-4444-4444-8444-444444444463';
const PROBE_SHOT = {
  client_name: 'ProbeHold HC1kgaxcu',
  shift_start: '2026-09-28T12:00:00.000Z',
  shift_end: '2026-09-28T16:00:00.000Z',
  ranked: [],
  float_pool: [],
  hide_float_ui: true,
  any_is_float: false,
  float_count: 0,
  rest: [
    {rank: 1, aide_id: PROBE_A, name: 'CancelAide kcbipc', same_day_yes_30d: 0, is_float: true},
    {rank: 2, aide_id: PROBE_B, name: 'Fh1Devon kd302d', same_day_yes_30d: 0, is_float: false},
    {rank: 3, aide_id: PROBE_C, name: 'RestAide zero', same_day_yes_30d: 0, is_float: false}
  ]
};
const LIVE_REST = {
  client_name: 'ProbeHold HC1kgaxcu',
  hide_float_ui: true,
  float_pool: [],
  float_count: 0,
  any_is_float: false,
  ranked: [],
  rest: [1, 2, 3, 4].map(function(n){
    return {rank: n, aide_id: '44444444-4444-4444-8444-44444444447' + n, name: 'LiveRest ' + n, same_day_yes_30d: 0, is_float: false};
  })
};
const PROBE_SHADOW = {
  client_name: 'ProbeHold HC1kgaxcu',
  shift_start: '2026-09-28T12:00:00.000Z',
  shift_end: '2026-09-28T16:00:00.000Z',
  ranked: [],
  rest: [{rank: 1, aide_id: PROBE_B, name: 'Fh1Devon kd302d', same_day_yes_30d: 0, is_float: false}],
  aides: [{rank: 1, aide_id: PROBE_B, name: 'Fh1Devon kd302d', same_day_yes_30d: 8, miles: 2.1, is_float: false}],
  float_pool: []
};
const RESCUE_CARD = {
  id: RESCUE,
  status: 'pending',
  client_name: 'Bowlax',
  assigned_aide_id: MARIA,
  assigned_aide_name: 'Maria',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  grace_minutes: 20,
  ranked: [{rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true}]
};

function titles(card){
  const chips = [];
  const labels = [];
  const chipRe = /<span class="remi-fn-chip[^"]*">([^<]*)<\/span>/g;
  const labelRe = /<div class="remi-fn-label">([^<]*)<\/div>/g;
  let m;
  while ((m = chipRe.exec(card))) chips.push(m[1]);
  while ((m = labelRe.exec(card))) labels.push(m[1]);
  return {chips: chips, labels: labels};
}

function runSlice(){
  const sandbox = {
    currentAdminRole: 'Admin',
    copilotView: 'coverage',
    console: console,
    Intl: Intl,
    Date: Date,
    JSON: JSON,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    isFinite: isFinite,
    setInterval: function(){return 0;},
    clearInterval: function(){}
  };
  vm.createContext(sandbox);
  const coverStub = [
    'async function coverSimpleSendBlast(){',
    '  if(typeof sbRestRpc==="function")return sbRestRpc("admin_blast_cover_request", {p_open_shift_id:"probe", p_aide_ids:["aide"], p_address_mode:"area"});',
    '  return {ok:true, sent:true};',
    '}'
  ].join('\n');
  vm.runInContext(noshowSrc + '\n' + hideSrc + '\n' + ideasSrc + '\n' + coverStub + '\n' + hide1bSrc, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_FLOAT_HIDE1B_MARKER, 'v=remi-float-hide1b');
  assert.strictEqual(sandbox.remiFloatHide1Split.__remiFloatHide1b, 1);
  assert.strictEqual(sandbox.remiFloat1Paint.__remiFloatHide1b, 1);
  assert.strictEqual(sandbox.remiIdeas763WhyHtml.__remiFloatHide1b, 1);
  assert.strictEqual(sandbox.coverSimpleSendBlast.__remiFloatHide1b, 1);

  const split = sandbox.remiFloatHide1Split(RANK);
  assert.strictEqual(split.hide_float_ui, true);
  assert.strictEqual(split.float_pool.length, 0);
  assert.strictEqual(split.ranked.length, 3);
  assert.strictEqual(split.ranked[0].name, 'Devon');
  assert.strictEqual(split.ranked[0].is_float, false);
  assert.ok(split.ranked.concat(split.rest).every(function(row){return row.is_float === false;}));
  assert.ok(!split.ranked.concat(split.rest).some(function(row){return row.name === 'ShouldNotPaint';}));
  assert.strictEqual(RANK.ranked[0].is_float, true, 'paint does not mutate the rank payload');

  const poolOnly = sandbox.remiFloatHide1Split(ONLY_POOL);
  assert.strictEqual(poolOnly.hide_float_ui, true);
  assert.strictEqual(poolOnly.float_pool.length, 0);
  assert.strictEqual(poolOnly.ranked.length, 1, 'same-day yes float_pool row is promoted when ranked is empty');
  assert.strictEqual(poolOnly.ranked[0].name, 'PoolYes');
  assert.strictEqual(poolOnly.ranked[0].is_float, false);
  assert.strictEqual(poolOnly.rest.length, 0);
  assert.strictEqual(ONLY_POOL.float_pool[0].is_float, true, 'promotion does not mutate the payload');

  const mixed = sandbox.remiFloatHide1Split(REST_MIXED);
  assert.strictEqual(mixed.hide_float_ui, true);
  assert.strictEqual(mixed.float_pool.length, 0);
  assert.strictEqual(mixed.ranked.map(function(row){return row.name;}).join('|'), 'Devon|Lina|Sara|PoolYes');
  assert.strictEqual(mixed.rest.map(function(row){return row.name;}).join('|'), 'Jamal|Aisha|PoolZero');
  assert.strictEqual(mixed.ranked.every(function(row){return row.is_float === false;}), true);
  assert.ok(mixed.ranked.concat(mixed.rest).every(function(row){return row.is_float === false;}));

  sandbox.remiFloat1Rank = RANK;
  sandbox.remiFloat1ShiftId = SHIFT;
  sandbox.copilotView = 'coverage';
  sandbox.remiFloat1SeedPicked(RANK);
  const chosen = sandbox.remiFloat1ChosenIds();
  assert.ok(chosen.indexOf(DEVON) >= 0, 'ranked aide is still a blast choice');
  assert.ok(chosen.indexOf(JAMAL) >= 0, 'rest aide is still a blast choice');
  assert.ok(chosen.indexOf(GHOST) < 0, 'ignored float_pool aide is not blasted');
  assert.ok(chosen.indexOf(MARIA) < 0, 'assignee is not a blast choice');

  const card = sandbox.remiFloat1FloatHtml();
  const painted = titles(card);
  assert.strictEqual(painted.chips.join('|'), 'Open shift');
  assert.ok(painted.labels.indexOf('Ranked \u00b7 same-day yes / 30d') >= 0, painted.labels.join('|'));
  assert.ok(painted.labels.indexOf('Rest of list') >= 0, painted.labels.join('|'));
  assert.ok(painted.chips.indexOf('Float pool') < 0, 'chip title is not Float pool');
  assert.ok(painted.labels.indexOf('Float pool') < 0, 'section title is not Float pool');
  assert.ok(card.indexOf('Float pool') < 0, card);
  assert.ok(card.indexOf('>Float pool<') < 0, card);
  assert.ok(card.indexOf('>Float<') < 0, card);
  assert.ok(card.indexOf('remi-fn-tag') < 0, card);
  assert.ok(card.indexOf('Devon') >= 0, card);
  assert.ok(card.indexOf('Jamal') >= 0, card);
  assert.ok(card.indexOf('ShouldNotPaint') < 0, card);
  assert.ok(card.indexOf('>Confirm blast<') >= 0, card);
  assert.ok(card.indexOf('data-remi-float-hide1b="v=remi-float-hide1b"') >= 0, card);
  assert.ok(card.indexOf('Coverage still ranks aides.') >= 0, card);

  sandbox.remiFloat1Rank = ONLY_POOL;
  sandbox.remiFloat1ShiftId = SHIFT;
  const poolCard = sandbox.remiFloat1FloatHtml();
  const poolTitles = titles(poolCard);
  assert.ok(poolTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') >= 0, poolCard);
  assert.ok(poolTitles.labels.indexOf('Rest of list') < 0, 'ranked-only is ok when every aide is ranked-eligible');
  assert.ok(poolCard.indexOf('Float pool') < 0, poolCard);
  assert.ok(poolCard.indexOf('PoolYes') >= 0, poolCard);

  sandbox.remiFloat1Rank = REST_MIXED;
  const mixedCard = sandbox.remiFloat1FloatHtml();
  const mixedTitles = titles(mixedCard);
  assert.ok(mixedTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') >= 0, 'same-day yes aides must paint a Ranked section');
  assert.ok(mixedTitles.labels.indexOf('Rest of list') >= 0, mixedCard);
  assert.ok(!(mixedTitles.labels.length === 1 && mixedTitles.labels[0] === 'Rest of list'), mixedCard);
  assert.ok(mixedCard.indexOf('Float pool') < 0, mixedCard);
  assert.ok(mixedCard.indexOf('Devon') >= 0 && mixedCard.indexOf('Jamal') >= 0, mixedCard);
  assert.ok(mixedCard.indexOf('Ranked \u00b7 same-day yes / 30d') < mixedCard.indexOf('Devon'), 'Devon paints under the Ranked title');
  assert.ok(mixedCard.indexOf('Devon') < mixedCard.indexOf('Rest of list'), 'same-day yes aides are not left in Rest');
  assert.ok(mixedCard.indexOf('Rest of list') < mixedCard.indexOf('Jamal'), mixedCard);

  sandbox.remiFloat1Rank = ALL_REST;
  const restOnly = sandbox.remiFloat1FloatHtml();
  const restTitles = titles(restOnly);
  assert.ok(restTitles.labels.indexOf('Rest of list') >= 0, restOnly);
  assert.ok(restTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') < 0, 'rest-only is ok when nobody has a same-day yes');
  assert.ok(restOnly.indexOf('Float pool') < 0, restOnly);

  sandbox.remiFloat1Rank = ALL_YES;
  const yesOnly = sandbox.remiFloat1FloatHtml();
  const yesTitles = titles(yesOnly);
  assert.ok(yesTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') >= 0, yesOnly);
  assert.ok(yesTitles.labels.indexOf('Rest of list') < 0, yesOnly);
  assert.ok(yesOnly.indexOf('Float pool') < 0, yesOnly);

  sandbox.remiFloat1Rank = PROBE_SHOT;
  sandbox.remiFloat1ShiftId = SHIFT;
  const probeCard = sandbox.remiFloat1FloatHtml();
  const probeTitles = titles(probeCard);
  assert.strictEqual(probeTitles.chips.join('|'), 'Open shift');
  assert.ok(probeTitles.labels.indexOf('Rest of list') >= 0, probeCard);
  assert.ok(probeTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') < 0, '0 same-day yes is Rest-only even if is_float was true');
  assert.ok(probeCard.indexOf('Float pool') < 0, probeCard);
  assert.ok(probeCard.indexOf('remi-fn-tag') < 0, probeCard);
  assert.ok(probeCard.indexOf('CancelAide kcbipc') >= 0, probeCard);

  sandbox.remiFloat1Rank = LIVE_REST;
  const liveCard = sandbox.remiFloat1FloatHtml();
  const liveTitles = titles(liveCard);
  const liveSplit = sandbox.remiFloatHide1Split(LIVE_REST);
  assert.strictEqual(liveSplit.ranked.length, 0);
  assert.strictEqual(liveSplit.rest.length, 4);
  assert.strictEqual(liveSplit.float_pool.length, 0);
  assert.strictEqual(liveSplit.hide_float_ui, true);
  assert.ok(liveSplit.rest.every(function(row){return row.is_float === false;}));
  assert.strictEqual(liveTitles.chips.join('|'), 'Open shift');
  assert.ok(liveTitles.labels.indexOf('Rest of list') >= 0, liveCard);
  assert.ok(liveTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') < 0, liveCard);
  assert.ok(liveCard.indexOf('Float pool') < 0, liveCard);

  sandbox.remiFloat1Rank = PROBE_SHADOW;
  const shadowCard = sandbox.remiFloat1FloatHtml();
  const shadowTitles = titles(shadowCard);
  assert.ok(shadowTitles.labels.indexOf('Ranked \u00b7 same-day yes / 30d') >= 0, shadowCard);
  assert.ok(shadowTitles.labels.indexOf('Rest of list') < 0, 'a higher same-day yes on aides must leave Rest');
  assert.ok(shadowCard.indexOf('8 same-day yes') >= 0, shadowCard);
  assert.ok(shadowCard.indexOf('Float pool') < 0, shadowCard);
  sandbox.remiFloat1Rank = RANK;

  const legacy = '<span class="remi-fn-chip">Float pool</span><div class="remi-fn-label">Float pool</div><span class="remi-fn-tag">Float</span><button>Blast float pool</button><p>Ranked aides \u2014 no separate Float pool block. Float pool UI removed from Remi.</p><div class="remi-fn-gone">No \u201cFloat pool\u201d chip</div>';
  const scrubbed = sandbox.remiFloatHide1bScrub(legacy);
  const scrubTitles = titles(scrubbed);
  assert.strictEqual(scrubTitles.chips.join('|'), 'Open shift');
  assert.ok(scrubTitles.labels.indexOf('Float pool') < 0);
  assert.ok(scrubbed.indexOf('>Blast float pool<') < 0);
  assert.ok(scrubbed.indexOf('>Confirm blast<') >= 0);
  assert.ok(scrubbed.indexOf('remi-fn-tag') < 0);
  assert.ok(scrubbed.indexOf('remi-fn-gone') < 0);

  sandbox.copilotView = 'receipts';
  assert.strictEqual(sandbox.remiFloat1FloatHtml(), '');
  sandbox.copilotView = 'payroll';
  assert.strictEqual(sandbox.remiFloat1FloatHtml(), '');
  sandbox.copilotView = 'coverage';

  sandbox.remiPayroll1Stats = function(report){return report.stats || {};};
  sandbox.remiPayroll1FormatNext = function(){return 'Wed 10/07/2026 8:00 AM ET';};
  sandbox.remiPayroll1Mdy = function(iso){
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[2] + '/' + m[3] + '/' + m[1] : '';
  };
  sandbox.remiPayroll1Report = {
    start_date: '2026-09-14',
    end_date: '2026-09-27',
    start_date_display: '09/14/2026',
    end_date_display: '09/27/2026',
    stats: {aides: 3, paid_hours: 96.5, covers: 4}
  };
  sandbox.remiPayroll1Start = '2026-09-14';
  sandbox.remiPayroll1End = '2026-09-27';
  const glance = sandbox.remiFloatHide1GlanceHtml();
  assert.ok(glance.indexOf('Float pool block removed') >= 0, 'receipts glance keeps its removed-block line');

  const rescueHtml = sandbox.remiFloat1NoshowHtml(RESCUE_CARD);
  assert.ok(rescueHtml.indexOf('>Confirm<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Dismiss<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('no Float pool UI') >= 0, 'no-show note stays');
  assert.ok(rescueHtml.indexOf('Devon') >= 0, rescueHtml);

  sandbox.remiIdeas763Why = {client_name: 'Bowlax', window_label: '1:00–5:00 PM'};
  sandbox.remiIdeas763Attempts = [];
  sandbox.remiIdeas763Dismissed = false;
  const why = sandbox.remiIdeas763WhyHtml();
  assert.ok(why.indexOf('>Confirm blast<') >= 0, why);
  assert.ok(why.indexOf('>Blast float pool<') < 0, why);
  assert.ok(why.indexOf('Why open') >= 0, why);

  const toasts = [];
  sandbox.showTempMsg = function(text){toasts.push(text);};
  sandbox.remiIdeas763Toast('Float pool blasted. Nothing was assigned.');
  sandbox.remiIdeas763Toast('Could not rank the float pool.');
  sandbox.remiIdeas763Toast('Could not blast the float pool.');
  sandbox.remiIdeas763Toast('No float aides to blast.');
  assert.strictEqual(toasts.join('|'), [
    'Blast sent. Nothing was assigned.',
    'Could not rank aides.',
    'Could not send the blast.',
    'No aides to blast.'
  ].join('|'));

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'admin_rank_float_pool_aides')return {ok: true, data: RANK};
    if(name === 'admin_blast_cover_request')return {ok: true, data: {success: true, blast_count: (body.p_aide_ids || []).length, assigned: false}};
    return {ok: false, error: 'unexpected ' + name, status: 500};
  };
  const chatAsked = await sandbox.coverSimpleSendBlast();
  assert.strictEqual(chatAsked.gated, true);
  assert.strictEqual(chatAsked.sent, false);
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request';}), 'first Send chat blast does not call Ace');
  const chatHeld = sandbox.coverSimpleBlastGateCancel();
  assert.strictEqual(chatHeld.cancelled, true);
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request';}), 'Not yet on Send chat blast writes nothing');
  await sandbox.coverSimpleSendBlast();
  const chatSent = await sandbox.coverSimpleBlastGateConfirm();
  assert.strictEqual(chatSent.ok, true);
  assert.strictEqual(rpc.filter(function(row){return row.name === 'admin_blast_cover_request';}).length, 1, 'gate Confirm sends the chat blast once');
  rpc.length = 0;

  const ranked = await sandbox.remiFloat1LoadRank(SHIFT);
  assert.strictEqual(ranked.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_rank_float_pool_aides');
  const asked = await sandbox.remiFloat1ConfirmBlast();
  assert.strictEqual(asked.gated, true);
  assert.strictEqual(asked.sent, false);
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request';}), 'first blast tap does not call Ace');
  const gateCard = sandbox.remiFloat1FloatHtml();
  assert.ok(gateCard.indexOf('Confirm before this blast sends. Not yet writes nothing.') >= 0, gateCard);
  assert.ok(gateCard.indexOf('data-remi-float-act="blast-go">Confirm<') >= 0, gateCard);
  assert.ok(gateCard.indexOf('>Not yet<') >= 0, gateCard);
  assert.ok(gateCard.indexOf('>Cancel<') >= 0, gateCard);
  assert.ok(gateCard.indexOf('Edit list') >= 0, gateCard);
  assert.ok(gateCard.indexOf('Float pool') < 0, gateCard);
  assert.ok(gateCard.indexOf('>Confirm blast<') < 0, gateCard);
  const held = sandbox.remiFloatHide1bGateCancel();
  assert.strictEqual(held.cancelled, true);
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request';}), 'Not yet writes nothing');
  const closed = sandbox.remiFloat1FloatHtml();
  assert.ok(closed.indexOf('>Confirm blast<') >= 0, closed);
  assert.ok(closed.indexOf('Confirm before this blast sends') < 0, closed);
  const askedAgain = await sandbox.remiFloat1ConfirmBlast();
  assert.strictEqual(askedAgain.gated, true);
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request';}));
  const blasted = await sandbox.remiFloatHide1bGateConfirm();
  assert.strictEqual(blasted.ok, true);
  const blast = rpc.filter(function(row){return row.name === 'admin_blast_cover_request';}).pop();
  assert.ok(blast, 'gate Confirm uses admin_blast_cover_request');
  assert.strictEqual(rpc.filter(function(row){return row.name === 'admin_blast_cover_request';}).length, 1);
  assert.strictEqual(blast.body.p_address_mode, 'area');
  assert.ok(blast.body.p_aide_ids.indexOf(DEVON) >= 0);
  assert.ok(blast.body.p_aide_ids.indexOf(JAMAL) >= 0);
  assert.ok(blast.body.p_aide_ids.indexOf(GHOST) < 0);
  assert.ok(blast.body.p_aide_ids.indexOf(MARIA) < 0);

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurseRank = await sandbox.remiFloat1LoadRank(SHIFT);
  assert.strictEqual(nurseRank.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse does not call Ace');
  sandbox.sbRestRpc = async function(){
    return {ok: false, status: 42501, error: '42501 is_scheduler_office'};
  };
  sandbox.currentAdminRole = 'Admin';
  const denied = await sandbox.remiFloat1Rpc('admin_blast_cover_request', {});
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(denied.status, 42501);

  console.log('admin-remi-float-hide1b unit ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
