"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/*! Ngine v1.0.0 | (c) Christian Westman | GNU General Public License v3.0 | https://github.com/creamdog/ngine */
var $ngine = {
  cache: {},
  interpolate: function interpolate(str, evalFunc, line, state) {
    line = typeof line == 'undefined' ? 0 : line;
    var start = str.indexOf('${');
    if (start < 0) return str;
    line = line + str.substr(0, start).split('\n').length;
    var depth = 0;
    var dflag = false;
    var comment = null;
    var length = 0;
    var strings = ["'", '"'];
    var chunk = null;
    var stop = start;
    var brackets = 0;

    var _loop2 = function _loop2() {
      var c = str[i];
      length++;
      comment = comment == null ? strings.find(function (s) {
        return s == c;
      }) : strings.find(function (s) {
        return s == c;
      }) ? null : comment;
      if (comment != null) return "continue";
      if (c == '{' && dflag) depth++;
      if (c == '{' && !dflag) brackets++;
      dflag = c == '$';

      if (c == '}' && brackets == 0) {
        depth = Math.max(0, depth - 1);

        if (depth == 0) {
          chunk = str.substr(start + 2, length - 3);
          stop = start + 3 + chunk.length;
          return "break";
        }
      } else if (c == '}') {
        brackets = Math.max(0, brackets - 1);
      }
    };

    _loop: for (var i = start; i < str.length; i++) {
      var _ret = _loop2();

      switch (_ret) {
        case "continue":
          continue;

        case "break":
          break _loop;
      }
    }

    if (!chunk) return str.toString();
    var t = str.substr(0, start) + evalFunc(chunk, line, state) + str.substr(stop);
    return $ngine.interpolate(t, evalFunc, line, state).toString();
  },
  reload: function reload(id) {
    var getModel = typeof $ngine.cache[id].model == 'function' ? function (c) {
      $ngine.cache[id].model(c);
    } : function (c) {
      c($ngine.cache[id].model);
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
        model = typeof model == 'undefined' ? state.getModel : model;
        return $ngine.render(url, model, function (result, id) {
          var target = document.getElementById(id);
          $ngine.apply(target, id, result);
        }, state);
      });
      var obj = 'function(' + keys.join(',') + '){ return (' + expression + ') }';
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
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (req) {
      var template = req.target.responseText;
      var id = req.target.id;
      var getModel = state && state.model ? function (c) {
        c(state.model);
      } : typeof model == 'function' ? function (c) {
        model(c);
      } : function (c) {
        c(model);
      };
      $ngine.cache[id] = {
        url: url,
        elements: [],
        model: model
      };
      getModel(function (model) {
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
    req.id = id;
    req.open('GET', url);
    req.send();
    return '<div id="' + id + '">loading..</div>';
  }
};

