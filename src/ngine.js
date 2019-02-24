/*! Ngine v1.0.0 | (c) Christian Westman | GNU General Public License v3.0 | https://github.com/creamdog/ngine */

const $ngine = {
	cache: {},
	interpolate : function(str, evalFunc, line, state) {
		line = typeof line == 'undefined' ? 0 : line;
		const start = str.indexOf('${');
		if(start < 0) return str;
		line = line + str.substr(0, start).split('\n').length;
		let depth = 0;
		let dflag = false;
		let comment = null;
		let length = 0;
		const strings = ["'", '"'];
		let chunk = null;
		let stop = start;
		let brackets = 0;
		for(var i=start;i<str.length;i++) {
			const c = str[i];
			length++;
			comment = comment == null ? strings.find(s => s == c) : (strings.find(s => s == c) ? null : comment);
			if(comment != null) continue;				
			if(c == '{' && dflag) depth++;
			if(c == '{' && !dflag) brackets++;
			dflag = c == '$';
			if(c == '}' && brackets == 0) {
				depth = Math.max(0, depth - 1);
				if(depth == 0)  {
					chunk = str.substr(start + 2, length - 3);
					stop = start + 3 + chunk.length;
					break;
				}
			} else if(c == '}') {
				brackets = Math.max(0, brackets - 1);
			}
        }
        
        if(!chunk) return str.toString();	
        
		const t = str.substr(0, start) + evalFunc(chunk, line, state) + str.substr(stop);
		return $ngine.interpolate(t, evalFunc, line, state).toString();
	},
	reload: function(id) {
		const getModel = typeof $ngine.cache[id].model == 'function' ? function(c){$ngine.cache[id].model(c)} : function(c) { c($ngine.cache[id].model); };
		$ngine.render($ngine.cache[id].url, getModel, function(result, newId) {
			var t = $ngine.cache[id].elements[0];
			var target = document.createElement('div');
			t.parentNode.insertBefore(target, t);
			for(var i=0;i<$ngine.cache[id].elements.length;i++) {
				$ngine.cache[id].elements[i].remove();
			}
			$ngine.apply(target, newId, result);		
		});
	},
	apply: function(target, id, result) {

		if(typeof target == 'undefined' || target == null) {
			console.log('unable to ngine.apply:', id);
			return;
		}

		if(target.outerHTML) { 
			target.innerHTML = result;
			$ngine.cache[id].elements = [];
			for(let i=0;i<target.childNodes.length;i++) {
				$ngine.cache[id].elements.push(target.childNodes[i]);
			}	
			for(let i=0;i<$ngine.cache[id].elements.length;i++) {
				const node = $ngine.cache[id].elements[i];
				node.remove();
				target.parentNode.insertBefore(node, target);
			}
			target.remove();
		} else { 
			let tmp = document.createElement('div');
			tmp.innerHTML = '<!--8a002e27-eca8-4fdc-9b1b-41d2c1468d5f-->';
			let ObjParent=target.parentNode; 
			ObjParent.replaceChild(tmp,target);
			ObjParent.innerHTML=ObjParent.innerHTML.replace('<div>' + tmp.innerHTML + '</div>',result);
		}
	},
	eval: function(expression, line, state) {

		const model = state.model;
		const url = state.url;

		try {
			let keys = Object.keys(model);
			let params = Object.keys(model).map(key => model[key]);

			keys.push('render');
			params.push(function(url, model) {
				model = typeof model == 'undefined' ? state.getModel : model;
				return $ngine.render(url, model, function(result, id) {
					let target = document.getElementById(id);
					$ngine.apply(target, id, result);
				}, state);
			});

			let obj = 'function(' + keys.join(',') + '){ return (' + expression + ') }';
			return Function('"use strict";return (' + obj + ')')()( ...params );
		} catch(e) {
			console.log({
				message: e.message,
				expression: expression,
				line: line,
				file: url,
				exception: e,
			});
			return '{{  "' + e.message + '"  }}';
		}

	},
	render : function(url, model, callback, state) {

		const id = (100000 + Math.floor(Math.random() * 100000)) + '_' + new Date().getTime();

		const load = (url, callback) => {	
			const req = new XMLHttpRequest();
			req.addEventListener('load', function(req) {
				const payload = req.target.responseText;
				const id = req.target.id;
				return callback(payload, id);
			});
			req.id = id;
			req.open('GET', url);
			req.send();
		}

		const getTemplate = typeof url == 'function' ? (callback) => url(template => callback(template, id)) : (callback) => load(url, callback);
		const getModel = state && state.model ? function(c) { c(state.model); } : (typeof model == 'function' ? function(c){ model(c); } : (typeof model == 'string' ? function(c) { load(model, c); } : function(c) { c(model); } ));

		getTemplate((template, id) => {

			console.log('template', template);

			$ngine.cache[id] = {url: url, elements:[], model:model};

			getModel(function(model){

				model = typeof model == 'string' ? JSON.parse(model) : model;
				model = model == null ? {} : model;
				model = Array.isArray(model) ? {list: model} : model;

				const state = {url: url, model: model, getModel: getModel, cache: {}, id: id};
				model._ngine_template_id_ = id;
				model._ngine_template_url_ = url;
				const compiled = $ngine.interpolate(template, $ngine.eval, 0, state).toString();

				const evalCallbackTargets = function(callback) {
					if(typeof callback == 'undefined') return [];
					if(typeof callback == 'function') return [callback];
					if(typeof callback == 'string') {
						if(callback[0] == '#') {
							return [document.getElementById(callback.substr(1))];
						} else if(callback[0] == '.') {
							let tmp = [];
							let elms = document.getElementsByClassName(callback.substr(1));
							for(let i=0;i<elms.length;i++) {
								tmp.push(elms[i]);
							}
							return tmp;
						} else {
							let tmp = [];
							let elms = document.getElementsByTagName(callback);
							for(let i=0;i<elms.length;i++) {
								tmp.push(elms[i]);
							}
							return tmp;
						}
					} else if(Array.isArray(callback)) {
						return [].concat.apply([], callback.map(evalCallbackTargets));	
					} else {
						console.log('invalid ngine.render callback:', callback);
					}
				};

				const targets = evalCallbackTargets(callback);

				for(let i=0;i<targets.length;i++) {

					const target = targets[i];

					if(typeof target == 'function') {
						target(compiled, id);
						continue;
					}

					target.innerHTML = '';
					const compositeTarget = document.createElement('div');
					target.append(compositeTarget);
					$ngine.apply(compositeTarget, id, compiled);
				}

			});

		});

		return '<div id="' + id + '">loading..</div>';
	}
};
