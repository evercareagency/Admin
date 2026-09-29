/* pages-cache-fresh1. Admin shell only. No push. Do not cache index.html. */
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
