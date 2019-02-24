"use strict";function _toConsumableArray(e){return _arrayWithoutHoles(e)||_iterableToArray(e)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}function _arrayWithoutHoles(e){if(Array.isArray(e)){for(var n=0,t=new Array(e.length);n<e.length;n++)t[n]=e[n];return t}}var $ngine={cache:{},interpolate:function(e,n,t,r){t=void 0===t?0:t;var i=e.indexOf("${");if(i<0)return e;t+=e.substr(0,i).split("\n").length;var o=0,a=!1,l=null,c=0,u=["'",'"'],s=null,d=i,f=0,g=function(){var n=e[m];if(c++,null!=(l=null==l?u.find(function(e){return e==n}):u.find(function(e){return e==n})?null:l))return"continue";if("{"==n&&a&&o++,"{"!=n||a||f++,a="$"==n,"}"==n&&0==f){if(0==(o=Math.max(0,o-1)))return s=e.substr(i+2,c-3),d=i+3+s.length,"break"}else"}"==n&&(f=Math.max(0,f-1))};e:for(var m=i;m<e.length;m++){switch(g()){case"continue":continue;case"break":break e}}if(!s)return e.toString();var p=e.substr(0,i)+n(s,t,r)+e.substr(d);return $ngine.interpolate(p,n,t,r).toString()},reload:function(e){var n="function"==typeof $ngine.cache[e].model?function(n){$ngine.cache[e].model(n)}:function(n){n($ngine.cache[e].model)};$ngine.render($ngine.cache[e].url,n,function(n,t){var r=$ngine.cache[e].elements[0],i=document.createElement("div");r.parentNode.insertBefore(i,r);for(var o=0;o<$ngine.cache[e].elements.length;o++)$ngine.cache[e].elements[o].remove();$ngine.apply(i,t,n)})},apply:function(e,n,t){if(void 0!==e&&null!=e)if(e.outerHTML){e.innerHTML=t,$ngine.cache[n].elements=[];for(var r=0;r<e.childNodes.length;r++)$ngine.cache[n].elements.push(e.childNodes[r]);for(var i=0;i<$ngine.cache[n].elements.length;i++){var o=$ngine.cache[n].elements[i];o.remove(),e.parentNode.insertBefore(o,e)}e.remove()}else{var a=document.createElement("div");a.innerHTML="\x3c!--8a002e27-eca8-4fdc-9b1b-41d2c1468d5f--\x3e";var l=e.parentNode;l.replaceChild(a,e),l.innerHTML=l.innerHTML.replace("<div>"+a.innerHTML+"</div>",t)}else console.log("unable to ngine.apply:",n)},eval:function(e,n,t){var r=t.model,i=t.url;try{var o=Object.keys(r),a=Object.keys(r).map(function(e){return r[e]});o.push("render"),a.push(function(e,n){return n=void 0===n?t.getModel:n,$ngine.render(e,n,function(e,n){var t=document.getElementById(n);$ngine.apply(t,n,e)},t)});var l="function("+o.join(",")+"){ return ("+e+") }";return Function('"use strict";return ('+l+")")().apply(void 0,_toConsumableArray(a))}catch(t){return console.log({message:t.message,expression:e,line:n,file:i,exception:t}),'{{  "'+t.message+'"  }}'}},render:function(e,n,t,r){var i=1e5+Math.floor(1e5*Math.random())+"_"+(new Date).getTime(),o=new XMLHttpRequest;return o.addEventListener("load",function(i){var o=i.target.responseText,a=i.target.id,l=r&&r.model?function(e){e(r.model)}:"function"==typeof n?function(e){n(e)}:function(e){e(n)};$ngine.cache[a]={url:e,elements:[],model:n},l(function(n){var r={url:e,model:n,getModel:l,cache:{},id:a};n._ngine_template_id_=a,n._ngine_template_url_=e;for(var i=$ngine.interpolate(o,$ngine.eval,0,r).toString(),c=function e(n){if(void 0===n)return[];if("function"==typeof n)return[n];if("string"==typeof n){if("#"==n[0])return[document.getElementById(n.substr(1))];if("."==n[0]){for(var t=[],r=document.getElementsByClassName(n.substr(1)),i=0;i<r.length;i++)t.push(r[i]);return t}for(var o=[],a=document.getElementsByTagName(n),l=0;l<a.length;l++)o.push(a[l]);return o}if(Array.isArray(n))return[].concat.apply([],n.map(e));console.log("invalid ngine.render callback:",n)}(t),u=0;u<c.length;u++){var s=c[u];if("function"!=typeof s){s.innerHTML="";var d=document.createElement("div");s.append(d),$ngine.apply(d,a,i)}else s(i,a)}})}),o.id=i,o.open("GET",e),o.send(),'<div id="'+i+'">loading..</div>'}};
