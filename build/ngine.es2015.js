"use strict";

var _this = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*! Ngine v1.0.0 | (c) Christian Westman | GNU General Public License v3.0 | https://github.com/creamdog/ngine */
window.$ngine = {
  cache: {},
  version: 'dev',
  state: {
    ready: false,
    queue: []
  },
  settings: {
    disableCache: false
  },
  loadConfig: function loadConfig(url) {
    window.$ngine.state.ready = false;
    $ngine.load(url, function (result) {
      if (_typeof(result) == 'object') {
        var settings = $ngine.parseConfig(result);

        for (var key in settings) {
          $ngine.settings[key] = settings[key];
        }
      }

      window.$ngine.state.ready = true;

      for (var i = 0; i < $ngine.state.queue.length; i++) {
        var action = $ngine.state.queue[i];
        action.func.apply(_this, action.args);
      }
    }, 0, true, true);
  },
  parseConfig: function parseConfig(obj) {
    var assign = function assign(a, b) {
      for (var key in b) {
        a[key] = b[key];
      }

      return a;
    };

    var config = assign({}, obj);

    if (_typeof(config.whitelist) == 'object') {
      var whitelist = [];

      for (var key in config.whitelist) {
        var expr = new RegExp(key, 'ig');
        var localConfig = assign({}, config.whitelist[key]);
        localConfig.str = key;
        localConfig.expr = expr;
        whitelist.push(localConfig);
      }

      whitelist.sort(function (a, b) {
        return a.str.localeCompare(b.str);
      });
      config.whitelist = whitelist.reverse();
    }

    return config;
  },
  getUrlSettings: function getUrlSettings(url, defaultSettings) {
    if (Array.isArray($ngine.settings.whitelist)) {
      var matches = $ngine.settings.whitelist.filter(function (item) {
        return url.match(item.expr) != null;
      });

      if (matches.length == 0) {
        throw {
          message: 'url: ' + url + ' does not match any whitelist entry defined in ngine.json'
        };
      } //console.log('config match', url, matches);


      return matches[0];
    }

    return defaultSettings;
  },
  interpolate: function interpolate(str, evalFunc, line, state, n) {
    n = typeof n == 'undefined' ? 0 : n;
    line = typeof line == 'undefined' ? 0 : line;
    var start = 0;
    line = line + str.substr(0, start).split('\n').length;
    var depth = -1;
    var dflag = false;
    var hit = false;
    var strChr = null;
    var stresc = [];
    var strings = ["'", '"', '`'];
    var chunk = null;
    var stop = start;
    var brackets = 0;

    var _loop = function _loop() {
      var c = str[i];
      strChr = strChr == null ? strings.filter(function (a) {
        return a == c;
      })[0] : c == strChr ? null : strChr;

      if (strings.filter(function (a) {
        return a == c;
      })[0]) {
        if (stresc[stresc.length - 1] == c) {
          stresc.pop();
        } else {
          stresc.push(c);
        }
      }

      if (c == '{' && dflag) {
        start = !hit ? i : start;

        if (hit) {
          depth++;
          brackets++;
        }

        hit = true;
      }

      if (c == '{' && !dflag && hit) brackets++;
      dflag = c == '$';

      if (c == '}' && brackets == 0 && hit && Math.max(0, depth - 1) == 0) {
        depth = Math.max(0, depth - 1);

        if (depth == 0 && hit) {
          chunk = str.substr(start + 1, i - start - 1);
          stop = start + chunk.length + 2;
          return "break";
        }
      } else if (c == '}') {
        depth = Math.max(0, depth - 1);
        brackets = Math.max(0, brackets - 1);
      }
    };

    for (var i = start; i < str.length; i++) {
      var _ret = _loop();

      if (_ret === "break") break;
    }

    if (!chunk) {
      //console.log('no chunk:', 'n:', n, 'start:',start, 'hit:', hit, 'brackets:', brackets, 'depth:', depth, str.replace('\n', ''));
      return str.toString();
    } //const strChr = stresc.length > 0 ? stresc[stresc.length-1] : null;


    chunk = $ngine.interpolate(chunk, evalFunc, line, state, n + 1);
    chunk = strChr != null && n > 0 ? strChr + '+ ( ' + chunk + ' ) +' + strChr : chunk;
    if (n > 0) return $ngine.interpolate(str.substr(0, start - 1) + chunk + str.substr(stop), evalFunc, line, state, n + 1); //console.log('eval', chunk);

    var t = str.substr(0, start - 1) + evalFunc(chunk, line, state) + str.substr(stop);
    return $ngine.interpolate(t, evalFunc, line, state).toString();
  },
  load: function load(url, callback, id, asModel, overrideCache) {
    var settings = $ngine.getUrlSettings(url, $ngine.settings);
    var req = new XMLHttpRequest();

    url = function (url) {
      var a = document.createElement('a');
      a.href = url;
      var params = a.href.split('?')[1] ? a.href.split('?')[1].split('&') : [];
      var cacheBuster = ['_ngine_cache_buster=' + $ngine.version + new Date().getTime() + (1000 + Math.floor(Math.random() * 1000))];
      params = settings.disableCache || overrideCache === true ? params.concat(cacheBuster) : params;
      params = params.filter(function (param) {
        return param.split('=')[0] != '_ngine_model';
      });
      var queryString = params ? '?' + params.join('&') : '';
      var location = a.protocol || a.protocol.length > 0 ? a : window.location;
      return location.protocol + '//' + (location.host + '/' + a.pathname).replace('//', '/') + queryString;
    }(url); //console.log(url);


    req.addEventListener('load', function (req) {
      var contentType = req.target.getResponseHeader('content-type') || '';

      var payload = function () {
        var data = req.target.status == 404 ? '{ "error" : "404 not found \'' + url + '\' " }' : req.target.responseText;
        data = contentType.indexOf('application/json') >= 0 ? JSON.parse(data) : data;
        return data;
      }();

      var id = req.target.id;
      return callback(payload, id, url);
    });
    req.addEventListener('error', function (a, b, c) {
      console.log(a, b, c);
    });
    req.id = id;
    req.open('GET', url);
    req.send();
  },
  reload: function reload(id) {
    var model = $ngine.cache[id].model;
    var getModel = typeof model == 'function' ? function (c) {
      model(c);
    } : typeof model == 'string' ? function (c) {
      $ngine.load(model, c, id, true);
    } : function (c) {
      c(model);
    };
    $ngine.render($ngine.cache[id].url, getModel, function (result, newId) {
      var t = $ngine.cache[id].elements[0];

      for (var i = 0; i < $ngine.cache[id].elements.length; i++) {
        if (typeof t.parentNode != 'undefined' && t.parentNode != null) break;
        t = $ngine.cache[id].elements[i];
      }

      var target = document.createElement('div');
      t.parentNode.insertBefore(target, t);

      for (var i = 0; i < $ngine.cache[id].elements.length; i++) {
        var e = $ngine.cache[id].elements[i];
        if (e.parentNode) e.parentNode.removeChild(e);
      }

      $ngine.apply(target, newId, result);
    });
  },
  apply: function apply(target, id, result) {
    if (typeof target == 'undefined' || target == null) {
      console.log('unable to ngine.apply:', id);
      return;
    }

    if (target.outerHTML) {
      target.innerHTML = result;
      $ngine.cache[id].elements = [];

      for (var i = 0; i < target.childNodes.length; i++) {
        $ngine.cache[id].elements.push(target.childNodes[i]);
      }

      for (var _i = 0; _i < $ngine.cache[id].elements.length; _i++) {
        var node = $ngine.cache[id].elements[_i];
        node.parentNode.removeChild(node);
        target.parentNode.insertBefore(node, target);
      }

      target.parentNode.removeChild(target); // eval all scripts

      var scripts = $ngine.cache[id].elements.filter(function (element) {
        return element.nodeName == 'SCRIPT';
      });
      var externalScripts = scripts.filter(function (script) {
        return script.getAttribute('src') != null;
      });
      var embeddedScripts = scripts.filter(function (script) {
        return script.innerHTML.trim().length > 0;
      });
      var counter = externalScripts.length;

      var deferLoader = function (counter, embeddedScripts) {
        return function () {
          counter--;

          if (counter <= 0) {
            embeddedScripts.forEach(function (e) {
              e.parentNode.removeChild(e);
              var n = document.createElement('script');
              n.setAttribute('type', 'text/javascript');
              n.innerHTML = e.innerHTML;
              document.body.appendChild(n);
            });
          }
        };
      }(counter, embeddedScripts);

      if (counter == 0) deferLoader();
      externalScripts.forEach(function (e) {
        e.parentNode.removeChild(e);
        var n = document.createElement('script');
        n.setAttribute('src', e.getAttribute('src'));
        n.setAttribute('type', 'text/javascript');
        n.addEventListener('load', deferLoader);
        document.body.appendChild(n);
      });
    } else {
      var tmp = document.createElement('div');
      tmp.innerHTML = '<!--8a002e27-eca8-4fdc-9b1b-41d2c1468d5f-->';
      var ObjParent = target.parentNode;
      ObjParent.replaceChild(tmp, target);
      $ngine.cache[id].elements = [tmp];
      ObjParent.innerHTML = ObjParent.innerHTML.replace('<div>' + tmp.innerHTML + '</div>', result);
    }
  },
  util: {
    string: {
      flatten: function flatten(str) {
        var strEsc = false;
        var out = '';
        var quot = ['"', "'", '`'];
        var esc = undefined;

        for (var i = 0; i < str.length; i++) {
          var c = str[i];
          strEsc = strEsc && c == '`' ? false : c == '`' ? true : strEsc;
          esc = typeof esc == 'undefined' ? quot[quot.indexOf(c)] : esc == quot[quot.indexOf(c)] ? undefined : esc;

          if (c == '\r') {//out += '\\r';
          } else if (c == '\n' && typeof esc != 'undefined') {
            out += '\\n';
          } else if (c == '`') {
            out += '"';
          } else if (c == '"' && strEsc) {
            out += '\\"';
          } else {
            out += c;
          }
        } //console.log('flattened', out);


        return out;
      }
    }
  },
  eval: function _eval(expression, line, state) {
    var model = function () {
      var obj = {};

      if (_typeof($ngine.settings.env) == 'object') {
        for (var key in $ngine.settings.env) {
          obj[key] = $ngine.settings.env[key];
        }
      }

      var env = {
        model: state.model,
        model_url: state.model_url,
        _ngine_template_instance_id_: state.id,
        _ngine_template_url_: state.template_url,
        _ngine_model_url_: state.model_url,
        _ngine_version_: $ngine.version
      };

      for (var key in env) {
        obj[key] = env[key];
      }

      return obj;
    }(); //console.log(model);


    var url = state.url;
    expression = $ngine.util.string.flatten(expression); //console.log(expression);

    var transformFunctions = {
      '!': function _(str) {
        return str.replace(/[&]/ig, '&amp;').replace(/[<]/ig, '&lt;').replace(/[>]/ig, '&gt;').replace(/\$/ig, '&#36;');
      },
      'e': function e(str) {
        return encodeURIComponent(str);
      },
      'd': function d(str) {
        return decodeURIComponent(str);
      },
      'U': function U(str) {
        return str.toUpperCase();
      },
      'l': function l(str) {
        return str.toLowerCase();
      }
    };

    var transforms = function (expression) {
      if (expression.trim().indexOf(':') != 0 || expression.trim().indexOf(';') < 0) return [];
      var transforms = expression.substr(1, expression.trim().indexOf(';') - 1);
      return transforms.split('');
    }(expression);

    expression = transforms.length > 0 ? expression.substr(expression.trim().indexOf(';') + 1) : expression;
    console.log('options', transforms);

    try {
      var keys = Object.keys(model);
      var params = Object.keys(model).map(function (key) {
        return model[key];
      });
      keys.push('render');
      params.push(function (url, model) {
        var settings = $ngine.getUrlSettings(url, $ngine.settings);
        model = typeof model == 'undefined' && typeof settings.model != 'undefined' ? settings.model : model; //console.log(url, settings, model);

        var useState = typeof model == 'undefined';
        model = typeof model == 'undefined' ? state.getModel : model; //console.log(url, model);

        return $ngine.render(url, model, function (result, id) {
          var target = document.getElementById(id);
          $ngine.apply(target, id, result);
        }, useState ? state : undefined);
      });
      var obj = 'function(' + keys.join(',') + '){ return (' + expression + ') }'; //console.log('eval', obj);

      var transform = function transform(str, list) {
        if (list.length == 0) return str;
        var key = list.shift();
        var func = transformFunctions[key];

        if (typeof func != 'function') {
          return '{{ ngine: unknown transform "' + key + '" }}';
        }

        return transform(func(str), list);
      };

      var result = transform(Function('"use strict";return (' + obj + ')')().apply(void 0, _toConsumableArray(params)), transforms); //console.log('result', result);

      return result;
    } catch (e) {
      console.log({
        message: e.message,
        expression: expression,
        line: line,
        file: url,
        exception: e
      });
      return '{{  "' + e.message + '"  }}';
    }
  },
  navigate: function navigate(url, model, callback) {
    if (!$ngine.state.ready) {
      return $ngine.state.queue.push({
        func: $ngine.navigate,
        args: arguments
      });
    } //console.log(url, model, callback);


    if (!$ngine.state.hashchange) {
      $ngine.state.hashchange = true;

      var func = function func() {
        if (window.location.hash.indexOf('#!') != 0) return;
        var url = window.location.hash.substr(2);
        var params = url.split('?')[1] ? url.split('?')[1].split('&') : [];
        var url_model = params.map(function (param) {
          return param.split('=')[0] == '_ngine_model' ? decodeURIComponent(param.split('=')[1]) : null;
        }).filter(function (model) {
          return model != null;
        }).map(function (model) {
          return model && model[0] == '{' ? JSON.parse(model) : model;
        })[0];
        var model = $ngine.cache[url] ? $ngine.cache[url].model : url_model ? url_model : undefined;
        var callback = $ngine.cache[url] ? $ngine.cache[url].callback : undefined;
        $ngine.render(url, model, callback);
      };

      window.addEventListener("hashchange", func, false);

      if (window.location.hash.indexOf('#!') == 0) {
        return func();
      }
    }

    $ngine.cache[url] = {
      model: model,
      callback: callback
    };

    url = function (url) {
      if (typeof model == 'undefined') return url;
      var params = url.split('?')[1] ? url.split('?')[1].split('&') : [];
      url = url.split('?')[0];
      var smodel = _typeof(model) == 'object' ? JSON.stringify(model) : model;
      params = params.concat(['_ngine_model=' + encodeURIComponent(smodel)]);
      var queryString = params ? '?' + params.join('&') : '';
      return url + queryString;
    }(url);

    window.location.hash = '#!' + url;
  },
  render: function render(url, model, callback, state) {
    if (!$ngine.state.ready) {
      return $ngine.state.queue.push({
        func: $ngine.render,
        args: arguments
      });
    }

    var settings = $ngine.getUrlSettings(url, $ngine.settings);
    model = typeof model == 'undefined' && typeof settings.model != 'undefined' ? settings.model : model;
    callback = typeof callback == 'undefined' && typeof settings.target != 'undefined' ? settings.target : callback; //console.log(url, settings, model, callback);

    var id = 100000 + Math.floor(Math.random() * 100000) + '_' + new Date().getTime();
    var getTemplate = typeof url == 'function' ? function (callback) {
      return url(function (template) {
        return callback(template, id);
      });
    } : function (callback) {
      return $ngine.load(url, callback, id);
    };
    var getModel = state && state.getModel ? state.getModel : typeof model == 'function' ? function (c) {
      model(c);
    } : typeof model == 'string' ? function (c) {
      $ngine.load(model, c, id, true);
    } : function (c) {
      c(model);
    };
    getTemplate(function (template, id, template_url) {
      $ngine.cache[id] = {
        url: url,
        elements: [],
        model: model
      }; //console.log(url, template);

      getModel(function (model, _, model_url) {
        //console.log('model', model);
        model = typeof model == 'undefined' ? {} : model;
        var state = {
          url: url,
          model: model,
          model_url: model_url,
          getModel: getModel,
          cache: {},
          id: id,
          template_url: template_url
        };
        var compiled = $ngine.interpolate(template, $ngine.eval, 0, state).toString();
        callback = typeof callback == 'undefined' ? 'body' : callback;

        var evalCallbackTargets = function evalCallbackTargets(callback) {
          if (typeof callback == 'undefined') return [];
          if (typeof callback == 'function') return [callback];

          if (typeof callback == 'string') {
            if (callback[0] == '#') {
              return [document.getElementById(callback.substr(1))];
            } else if (callback[0] == '.') {
              var tmp = [];
              var elms = document.getElementsByClassName(callback.substr(1));

              for (var i = 0; i < elms.length; i++) {
                tmp.push(elms[i]);
              }

              return tmp;
            } else {
              var _tmp = [];

              var _elms = document.getElementsByTagName(callback);

              for (var _i2 = 0; _i2 < _elms.length; _i2++) {
                _tmp.push(_elms[_i2]);
              }

              return _tmp;
            }
          } else if (Array.isArray(callback)) {
            return [].concat.apply([], callback.map(evalCallbackTargets));
          } else {
            console.log('invalid ngine.render callback:', callback);
          }
        };

        var targets = evalCallbackTargets(callback);

        for (var i = 0; i < targets.length; i++) {
          var target = targets[i];

          if (typeof target == 'function') {
            target(compiled, id);
            continue;
          }

          target.innerHTML = '';
          var compositeTarget = document.createElement('div');
          target.appendChild(compositeTarget);
          $ngine.apply(compositeTarget, id, compiled);
        }
      });
    });
    return '<span id="' + id + '">loading..</span>';
  }
};
window.$ngine.loadConfig('ngine.json');

window.$ngine.version = "0.5.10";
