'use strict';

// Every node test loads this first. A request to the legacy apps-script host throws.
var APPS_HOST = 'script.' + 'google.com';

function appsHostBlocked(url){
  return String(url == null ? '' : url).indexOf(APPS_HOST) >= 0;
}

function rejectAppsHost(url){
  if(!appsHostBlocked(url))return false;
  var err = new Error('blocked apps host');
  err.name = 'AppsHostBlocked';
  throw err;
}

function wrapFetch(fn){
  return function(url){
    rejectAppsHost(url);
    if(typeof fn === 'function')return fn.apply(this, arguments);
    return Promise.reject(new Error('fetch is not available'));
  };
}

var wrappedFetch = wrapFetch(typeof global.fetch === 'function' ? global.fetch : null);
Object.defineProperty(global, 'fetch', {
  configurable: true,
  enumerable: true,
  get: function(){return wrappedFetch;},
  set: function(fn){wrappedFetch = wrapFetch(fn);}
});

if(typeof XMLHttpRequest === 'function' && XMLHttpRequest.prototype && typeof XMLHttpRequest.prototype.open === 'function'){
  var xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    rejectAppsHost(url);
    return xhrOpen.apply(this, arguments);
  };
}

function wrapBeacon(fn){
  return function(url, data){
    rejectAppsHost(url);
    if(typeof fn === 'function')return fn.call(this, url, data);
    return false;
  };
}

try{
  if(typeof navigator !== 'undefined' && navigator){
    var beacon = typeof navigator.sendBeacon === 'function' ? navigator.sendBeacon.bind(navigator) : null;
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: wrapBeacon(beacon)
    });
  }
}catch(e){}

module.exports = {appsHostBlocked: appsHostBlocked};
