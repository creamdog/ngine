/*! Ngine v1.0.0 | (c) Christian Westman | GNU General Public License v3.0 | https://github.com/creamdog/ngine */

const $ngine = {
	cache: {},
	interpolate : (str, evalFunc, line, state, n) => {

		//console.log('input:', str, ', n:', n);

		n = typeof n == 'undefined' ? 0 : n;
		line = typeof line == 'undefined' ? 0 : line;
		let start = 0;
		line = line + str.substr(0, start).split('\n').length;
		let depth = -1;
		let dflag = false;
		let hit = false;
		let strChr = null;
		let stresc = [];
		const strings = ["'", '"', '`'];
		let chunk = null;
		let stop = start;
		let brackets = 0;
		for(var i=start;i<str.length;i++) {
			const c = str[i];

			strChr = strChr == null ? strings.find(s => s == c) : (c == strChr ? null : strChr);
			
			if(strings.find(s => s == c)) {
				if(stresc[stresc.length-1] == c) {
					stresc.pop();
				} else {
					stresc.push(c);
				}
			}

			if(c == '{' && dflag) {
				start = !hit ? i : start;
				if(hit) {
					depth++;
					brackets++;
				}
				hit = true;
			}
			if(c == '{' && !dflag && hit) brackets++;
			dflag = c == '$';
			if(c == '}' && brackets == 0 && hit && Math.max(0, depth - 1) == 0) {
				depth = Math.max(0, depth - 1);
				if(depth == 0 && hit)  {
					chunk = str.substr(start + 1, i - start - 1);
					stop = start + chunk.length + 2;
					break;
				}
			} else if(c == '}') {
				depth = Math.max(0, depth - 1);
				brackets = Math.max(0, brackets - 1);
			}
        }
		if(!chunk) {
			//console.log('no chunk:', 'n:', n, 'start:',start, 'hit:', hit, 'brackets:', brackets, 'depth:', depth, str.replace('\n', ''));
			return str.toString();
		}	
		//const strChr = stresc.length > 0 ? stresc[stresc.length-1] : null;
		chunk = $ngine.interpolate(chunk, evalFunc, line, state, n + 1);
		chunk = strChr != null && n > 0 ? strChr + '+ ( ' + chunk + ' ) +' + strChr : chunk;
		if(n > 0) return $ngine.interpolate(str.substr(0, start-1) + chunk + str.substr(stop), evalFunc, line, state, n + 1);
		//console.log('eval', chunk);
		const t = str.substr(0, start-1) + evalFunc(chunk, line, state) + str.substr(stop);
		return $ngine.interpolate(t, evalFunc, line, state).toString();
	},
	load: (url, callback, id) => {	
		const req = new XMLHttpRequest();
		req.addEventListener('load', (req) => {
			const payload = req.target.status == 404 ? '{ "error" : "404 not found \'' + url + '\' " }' : req.target.responseText;
			const id = req.target.id;
			return callback(payload, id);
		});
		req.id = id;
		req.open('GET', url);
		req.send();
	},
	reload: function(id) {

		const model = $ngine.cache[id].model;

		const getModel = (typeof model == 'function' ? (c) => { model(c); } : (typeof model == 'string' ? (c) => { $ngine.load(model, c, id); } : (c) => { c(model); } ));


		$ngine.render($ngine.cache[id].url, getModel, (result, newId) => {
			var t = $ngine.cache[id].elements[0];
			var target = document.createElement('div');
			t.parentNode.insertBefore(target, t);
			for(var i=0;i<$ngine.cache[id].elements.length;i++) {
				$ngine.cache[id].elements[i].remove();
			}
			$ngine.apply(target, newId, result);		
		});
	},
	apply: (target, id, result) => {

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

			// eval all scripts

			const scripts = $ngine.cache[id].elements.filter(element => element.nodeName == 'SCRIPT');
			const externalScripts = scripts.filter(script => script.getAttribute('src') != null);
			const embeddedScripts = scripts.filter(script => script.innerHTML.trim().length > 0);
			let counter = externalScripts.length;

			const deferLoader = (function(counter, embeddedScripts){
				return () => {
					counter--;
					if(counter == 0) {
						embeddedScripts.forEach(e => {
							e.remove();
							let n = document.createElement('script');
							n.setAttribute('type', 'text/javascript');
							n.innerHTML = e.innerHTML;
							document.body.appendChild(n);
						});
					}
				}
			})(counter, embeddedScripts);

			externalScripts.forEach(e => {
				e.remove();
				let n = document.createElement('script');
				n.setAttribute('src', e.getAttribute('src'));
				n.setAttribute('type', 'text/javascript');
				n.addEventListener('load', deferLoader);
				document.body.appendChild(n);
			});
			
		} else { 
			let tmp = document.createElement('div');
			tmp.innerHTML = '<!--8a002e27-eca8-4fdc-9b1b-41d2c1468d5f-->';
			let ObjParent=target.parentNode; 
			ObjParent.replaceChild(tmp,target);
			ObjParent.innerHTML=ObjParent.innerHTML.replace('<div>' + tmp.innerHTML + '</div>',result);
		}
	},
	eval: (expression, line, state) => {

		const model = state.model;
		const url = state.url;

		try {
			let keys = Object.keys(model);
			let params = Object.keys(model).map(key => model[key]);

			keys.push('render');
			params.push((url, model) => {
				const useState = typeof model == 'undefined';
				model = typeof model == 'undefined' ? state.getModel : model;
				//console.log(url, model);
				return $ngine.render(url, model, (result, id) => {
					let target = document.getElementById(id);
					$ngine.apply(target, id, result);
				}, useState ? state : undefined);
			});

			let obj = 'function(' + keys.join(',') + '){ return (' + expression + ') }';
			//console.log('eval', obj);
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
	render : (url, model, callback, state) => {

		const id = (100000 + Math.floor(Math.random() * 100000)) + '_' + new Date().getTime();

		const getTemplate = typeof url == 'function' ? (callback) => url(template => callback(template, id)) : (callback) => $ngine.load(url, callback, id);
		const getModel = state && state.model ? (c) => { c(state.model); } : (typeof model == 'function' ? (c) => { model(c); } : (typeof model == 'string' ? (c) => { $ngine.load(model, c, id); } : (c) => { c(model); } ));

		getTemplate((template, id) => {

			$ngine.cache[id] = {url: url, elements:[], model:model};

			getModel((model) => {

				//console.log('model', model);

				model = typeof model == 'string' ? JSON.parse(model) : model;
				model = model == null ? {} : model;
				model = Array.isArray(model) ? {list: model} : model;

				const state = {url: url, model: model, getModel: getModel, cache: {}, id: id};
				model._ngine_template_id_ = id;
				model._ngine_template_url_ = url;
				const compiled = $ngine.interpolate(template, $ngine.eval, 0, state).toString();

				const evalCallbackTargets = (callback) => {
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
