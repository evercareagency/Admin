/* pages-cache-fresh1 network-first documents. admin-sched-chat-push1 opens Messages on notificationclick. No cache. No address-bar version query. */
'use strict';

self.addEventListener('install', function(){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
});

function pagesCacheFresh1IsNav(request){
  if(!request||request.method!=='GET')return false;
  var url='';
  try{url=String(request.url||'');}catch(e){url='';}
  if(url&&url.indexOf('http')!==0)return false;
  if(request.mode==='navigate')return true;
  if(request.destination==='document')return true;
  return false;
}

self.addEventListener('fetch', function(event){
  if(!pagesCacheFresh1IsNav(event.request))return;
  event.respondWith(fetch(event.request, {cache:'no-store'}));
});

function adminSchedChatPush1Hash(payload){
  payload=payload||{};
  var parts=[];
  var aide=String(payload.aide_id||payload.aideId||'').trim();
  var fromRole=String(payload.from_role||payload.fromRole||payload.from||payload.sender||'').trim().toLowerCase();
  var thread=String(payload.thread_id||payload.threadId||'').trim();
  var deep=String(payload.deep_link||payload.deepLink||'');
  function take(key){
    var m=deep.match(new RegExp('[?&]'+key+'=([^&]+)'));
    return m?decodeURIComponent(m[1]):'';
  }
  if(!aide)aide=take('aide_id');
  if(!fromRole)fromRole=String(take('from_role')||take('from')||'').toLowerCase();
  if(!thread)thread=take('thread_id');
  var from='';
  if(fromRole==='remi'||fromRole==='from_remi')from='remi';
  else if(fromRole==='aide'||fromRole==='from_aide')from='aide';
  else from=fromRole;
  if(aide)parts.push('aide_id='+encodeURIComponent(aide));
  if(from)parts.push('from='+encodeURIComponent(from));
  if(thread)parts.push('thread_id='+encodeURIComponent(thread));
  return '#aidechat'+(parts.length?('?'+parts.join('&')):'');
}

self.addEventListener('push', function(event){
  var payload={};
  try{payload=event.data?event.data.json():{};}
  catch(e){
    var text='';
    try{text=event.data?event.data.text():'';}catch(e2){text='';}
    payload={body:text};
  }
  var title=String(payload.title||'EverCare');
  var body=String(payload.body||payload.preview||'New message');
  event.waitUntil(self.registration.showNotification(title, {
    body:body,
    tag:String(payload.tag||'aide-remi-messages'),
    data:payload
  }));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var payload=(event.notification&&event.notification.data)||{};
  var hash=adminSchedChatPush1Hash(payload);
  event.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list){
    var i;
    for(i=0;i<list.length;i++){
      var client=list[i];
      if(!client)continue;
      try{client.postMessage({type:'admin-sched-chat-push1-open', payload:payload});}catch(e){}
      if(client.focus)return client.focus();
    }
    var url=new URL('index.html'+hash, self.registration.scope).href;
    return self.clients.openWindow(url);
  }));
});
