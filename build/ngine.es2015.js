"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/*! Ngine v1.0.0 | (c) Christian Westman | GNU General Public License v3.0 | https://github.com/creamdog/ngine */
var $ngine = {
  cache: {},
  interpolate: function interpolate(str, evalFunc, line, state, n) {
    //console.log('input:', str, ', n:', n);
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
      strChr = strChr == null ? strings.find(function (s) {
        return s == c;
      }) : c == strChr ? null : strChr;

      if (strings.find(function (s) {
        return s == c;
      })) {
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
  load: function load(url, callback, id) {
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (req) {
      var payload = req.target.status == 404 ? '{ "error" : "404 not found \'' + url + '\' " }' : req.target.responseText;
      var id = req.target.id;
      return callback(payload, id);
    });
    req.id = id;
    req.open('GET', url);
    req.send();
  },
  reload: function reload(id) {
    //const getModel = typeof $ngine.cache[id].model == 'function' ? function(c){$ngine.cache[id].model(c)} : function(c) { c($ngine.cache[id].model); };
    var model = $ngine.cache[id].model;
    var getModel = typeof model == 'function' ? function (c) {
      model(c);
    } : typeof model == 'string' ? function (c) {
      $ngine.load(model, c, id);
    } : function (c) {
      c(model);
    };
    $ngine.render($ngine.cache[id].url, getModel, function (result, newId) {
      var t = $ngine.cache[id].elements[0];
      var target = document.createElement('div');
      t.parentNode.insertBefore(target, t);

      for (var i = 0; i < $ngine.cache[id].elements.length; i++) {
        $ngine.cache[id].elements[i].remove();
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
        node.remove();
        target.parentNode.insertBefore(node, target);
      }

      target.remove();
    } else {
      var tmp = document.createElement('div');
      tmp.innerHTML = '<!--8a002e27-eca8-4fdc-9b1b-41d2c1468d5f-->';
      var ObjParent = target.parentNode;
      ObjParent.replaceChild(tmp, target);
      ObjParent.innerHTML = ObjParent.innerHTML.replace('<div>' + tmp.innerHTML + '</div>', result);
    }
  },
  eval: function _eval(expression, line, state) {
    var model = state.model;
    var url = state.url;

    try {
      var keys = Object.keys(model);
      var params = Object.keys(model).map(function (key) {
        return model[key];
      });
      keys.push('render');
      params.push(function (url, model) {
        var useState = typeof model == 'undefined';
        model = typeof model == 'undefined' ? state.getModel : model; //console.log(url, model);

        return $ngine.render(url, model, function (result, id) {
          var target = document.getElementById(id);
          $ngine.apply(target, id, result);
        }, useState ? state : undefined);
      });
      var obj = 'function(' + keys.join(',') + '){ return (' + expression + ') }'; //console.log('eval', obj);

      return Function('"use strict";return (' + obj + ')')().apply(void 0, _toConsumableArray(params));
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
  render: function render(url, model, callback, state) {
    var id = 100000 + Math.floor(Math.random() * 100000) + '_' + new Date().getTime();
    var getTemplate = typeof url == 'function' ? function (callback) {
      return url(function (template) {
        return callback(template, id);
      });
    } : function (callback) {
      return $ngine.load(url, callback, id);
    };
    var getModel = state && state.model ? function (c) {
      c(state.model);
    } : typeof model == 'function' ? function (c) {
      model(c);
    } : typeof model == 'string' ? function (c) {
      $ngine.load(model, c, id);
    } : function (c) {
      c(model);
    };
    getTemplate(function (template, id) {
      $ngine.cache[id] = {
        url: url,
        elements: [],
        model: model
      };
      getModel(function (model) {
        //console.log('model', model);
        model = typeof model == 'string' ? JSON.parse(model) : model;
        model = model == null ? {} : model;
        model = Array.isArray(model) ? {
          list: model
        } : model;
        var state = {
          url: url,
          model: model,
          getModel: getModel,
          cache: {},
          id: id
        };
        model._ngine_template_id_ = id;
        model._ngine_template_url_ = url;
        var compiled = $ngine.interpolate(template, $ngine.eval, 0, state).toString();

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
          target.append(compositeTarget);
          $ngine.apply(compositeTarget, id, compiled);
        }
      });
    });
    return '<div id="' + id + '">loading..</div>';
  }
};

