/*! Ngine v1.0.0 | (c) Christian Westman | GNU General Public License v3.0 | https://github.com/creamdog/ngine */

window.$ngine = {
	cache: {},
	version: 'dev',
	state: {
		ready: false,
		queue: [],
	},
	settings: {
		disableCache: false,
	},
	loadConfig: (url) => {

		window.$ngine.state.ready = false;

		$ngine.load(url, (result) => {

			if(typeof result == 'object') {
				$ngine.settings = $ngine.parseConfig(result);
			}
		
			window.$ngine.state.ready = true;
		
			for(let i=0;i<$ngine.state.queue.length;i++) {
				let action = $ngine.state.queue[i];
				action.func.apply(this, action.args);
			}
		
		}, 0, true, true);
	},
	parseConfig: (obj) => {

		const assign = (a, b) => {
			for(var key in b) {
				a[key] = b[key];
			}
			return a;
		}

		let config = assign({}, obj);
		if(typeof config.whitelist == 'object') {
			let whitelist = [];
			for(var key in config.whitelist) {
				const expr = new RegExp(key, 'ig');
				let localConfig = assign({}, config.whitelist[key]);
				localConfig.str = key;
				localConfig.expr = expr;
				whitelist.push(localConfig);
			}
			whitelist.sort(function(a, b) {
				return a.str.localeCompare(b.str);
			});
			config.whitelist = whitelist.reverse();
		}
		return config;
	},
	getUrlSettings: (url, defaultSettings) => {
		if(Array.isArray($ngine.settings.whitelist)) {
			const matches = $ngine.settings.whitelist.filter(function(item) {
				return url.match(item.expr) != null;
			});
			if(matches.length == 0) {
				throw {message: 'url: ' + url + ' does not match any whitelist entry defined in ngine.json'};
			}
			//console.log('config match', url, matches);
			return matches[0];
		}
		return defaultSettings;
	},
	interpolate : (str, evalFunc, line, state, n) => {

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

			strChr = strChr == null ? strings.filter(a => a == c)[0] : (c == strChr ? null : strChr);
			
			if(strings.filter(a => a == c)[0]) {
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
	load: (url, callback, id, asModel, overrideCache) => {
		
		let settings = $ngine.getUrlSettings(url, $ngine.settings);

		const req = new XMLHttpRequest();

		url = (function(url){
			const a = document.createElement('a');
			a.href = url;
			let params = a.href.split('?')[1] ? a.href.split('?')[1].split('&') : [];
			
			const cacheBuster = ['_ngine_cache_buster=' + $ngine.version + new Date().getTime() + (1000+Math.floor(Math.random()*1000))];
			
			params = settings.disableCache || overrideCache === true ? params.concat(cacheBuster)  : params;

			params = params.filter(function(param) {return param.split('=')[0] != '_ngine_model';});

			const queryString = params ? '?' + params.join('&') : '';
			const location = a.protocol || a.protocol.length > 0 ? a : window.location;
			return location.protocol + '//' + (location.host + '/' + a.pathname).replace('//','/') + queryString;
		})(url);

		//console.log(url);

		req.addEventListener('load', (req) => {

			const contentType = req.target.getResponseHeader('content-type') || '';

			const payload = (function(){
				let data = req.target.status == 404 ? '{ "error" : "404 not found \'' + url + '\' " }' : req.target.responseText;
				data = contentType.indexOf('application/json') >= 0 ? JSON.parse(data) : data;
				return data;
			})();

			const id = req.target.id;

			return callback(payload, id, url);
		});
		req.addEventListener('error', (a, b, c) => {
			console.log(a, b, c);
		});

		req.id = id;
		req.open('GET', url);
		req.send();
	},
	reload: function(id) {

		const model = $ngine.cache[id].model;

		const getModel = (typeof model == 'function' ? (c) => { model(c); } : (typeof model == 'string' ? (c) => { $ngine.load(model, c, id, true); } : (c) => { c(model); } ));


		$ngine.render($ngine.cache[id].url, getModel, (result, newId) => {
			
			var t = $ngine.cache[id].elements[0];

			for(var i=0;i<$ngine.cache[id].elements.length;i++) {
				if(typeof t.parentNode != 'undefined' && t.parentNode != null) break;
				t = $ngine.cache[id].elements[i];
			}

			var target = document.createElement('div');

			t.parentNode.insertBefore(target, t);
			for(var i=0;i<$ngine.cache[id].elements.length;i++) {
				const e = $ngine.cache[id].elements[i];
				if(e.parentNode) e.parentNode.removeChild(e);
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
				node.parentNode.removeChild(node);
				target.parentNode.insertBefore(node, target);
			}

			target.parentNode.removeChild(target);

			// eval all scripts

			const scripts = $ngine.cache[id].elements.filter(element => element.nodeName == 'SCRIPT');
			const externalScripts = scripts.filter(script => script.getAttribute('src') != null);
			const embeddedScripts = scripts.filter(script => script.innerHTML.trim().length > 0);
			let counter = externalScripts.length;

			const deferLoader = (function(counter, embeddedScripts){
				return () => {
					counter--;
					if(counter <= 0) {
						embeddedScripts.forEach(e => {
							e.parentNode.removeChild(e);
							let n = document.createElement('script');
							n.setAttribute('type', 'text/javascript');
							n.innerHTML = e.innerHTML;
							document.body.appendChild(n);
						});
					}
				}
			})(counter, embeddedScripts);

			if(counter == 0) deferLoader();

			externalScripts.forEach(e => {
				e.parentNode.removeChild(e);
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
			$ngine.cache[id].elements = [tmp];
			ObjParent.innerHTML=ObjParent.innerHTML.replace('<div>' + tmp.innerHTML + '</div>',result);
		}
	},
	util: {
		string : {
			flatten : (str) => {
				let strEsc = false;
				let out = '';
				let quot =['"', "'", '`'];
				let esc = undefined;
				for(var i=0;i<str.length;i++) {
					const c = str[i];
					strEsc = strEsc && c == '`' ? false : (c == '`' ? true : strEsc);
					esc = typeof esc == 'undefined' ? quot[quot.indexOf(c)] : (esc == quot[quot.indexOf(c)] ? undefined : esc);
					if(c == '\r') {
						//out += '\\r';
					} else if(c == '\n' && typeof esc != 'undefined') {
						out += '\\n';
					} else if(c == '`') {
						out += '"';
					} else if (c == '"' && strEsc) {
						out += '\\"'
					} else {
						out += c;
					}
				}
				//console.log('flattened', out);
				return out;
			}
		}
	},
	eval: (expression, line, state) => {

		const model = {
			model: state.model,
			model_url: state.model_url,
			_ngine_template_instance_id_: state.id,
			_ngine_template_url_: state.template_url,
			_ngine_model_url_: state.model_url,
			_ngine_version_: $ngine.version,
		};

		const url = state.url;

		expression = $ngine.util.string.flatten(expression);

		//console.log(expression);
		
		try {
			let keys = Object.keys(model);
			let params = Object.keys(model).map(key => model[key]);

			keys.push('render');
			params.push((url, model) => {

				let settings = $ngine.getUrlSettings(url, $ngine.settings);
				model = typeof model == 'undefined' && typeof settings.model != 'undefined' ? settings.model : model;
				//console.log(url, settings, model);

				const useState = typeof model == 'undefined';
				model = typeof model == 'undefined' ? state.getModel : model;
				//console.log(url, model);
				return $ngine.render(url, model, (result, id) => {
					let target = document.getElementById(id);
					$ngine.apply(target, id, result);
				}, useState ? state : undefined);
			});

			const obj = 'function(' + keys.join(',') + '){ return (' + expression + ') }';
			//console.log('eval', obj);
			const result = Function('"use strict";return (' + obj + ')')()( ...params );
			//console.log('result', result);
			return result;
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
	navigate: function (url, model, callback) {

		if(!$ngine.state.ready) {
			return $ngine.state.queue.push({
				func: $ngine.navigate,
				args: arguments,
			});
		}

		//console.log(url, model, callback);

		if(!$ngine.state.hashchange) {
			$ngine.state.hashchange = true;
			const func = () => {
				if(window.location.hash.indexOf('#!') != 0) return;
				const url = window.location.hash.substr(2);

				const params = url.split('?')[1] ? url.split('?')[1].split('&') : [];

				const url_model = params.map(function(param) {
					return param.split('=')[0] == '_ngine_model' ? decodeURIComponent(param.split('=')[1]) : null;
				}).filter(function(model) {
					return model != null;
				}).map(function(model) {
					return model && model[0] == '{' ? JSON.parse(model) : model;
				})[0];

				const model = $ngine.cache[url] ? $ngine.cache[url].model : (url_model ? url_model : undefined);
				const callback = $ngine.cache[url] ? $ngine.cache[url].callback : undefined;

				$ngine.render(url, model, callback);
			};
			window.addEventListener("hashchange", func, false);
			if(window.location.hash.indexOf('#!') == 0) {
				return func();
			}
		}

		$ngine.cache[url] = {
			model: model,
			callback: callback,
		};

		url = (function(url){
			if(typeof model == 'undefined') return url;
			let params = url.split('?')[1] ? url.split('?')[1].split('&') : [];
			url = url.split('?')[0];
			const smodel = typeof model == 'object' ? JSON.stringify(model) : model;
			params = params.concat(['_ngine_model=' + encodeURIComponent(smodel)]);
			const queryString = params ? '?' + params.join('&') : '';
			return url + queryString;
		})(url);

		window.location.hash = '#!' + url;
	},
	render : function (url, model, callback, state) {

		if(!$ngine.state.ready) {
			return $ngine.state.queue.push({
				func: $ngine.render,
				args: arguments,
			});
		}

		let settings = $ngine.getUrlSettings(url, $ngine.settings);
		model = typeof model == 'undefined' && typeof settings.model != 'undefined' ? settings.model : model;
		callback = typeof callback == 'undefined' && typeof settings.target != 'undefined' ? settings.target : callback;
		//console.log(url, settings, model, callback);

		const id = (100000 + Math.floor(Math.random() * 100000)) + '_' + new Date().getTime();

		const getTemplate = typeof url == 'function' ? (callback) => url(template => callback(template, id)) : (callback) => $ngine.load(url, callback, id);
		const getModel = state && state.getModel ? state.getModel : (typeof model == 'function' ? (c) => { model(c); } : (typeof model == 'string' ? (c) => { $ngine.load(model, c, id, true); } : (c) => { c(model); } ));

		getTemplate((template, id, template_url) => {

			$ngine.cache[id] = {url: url, elements:[], model:model};

			//console.log(url, template);

			getModel((model, _, model_url) => {

				//console.log('model', model);

				model = typeof model == 'undefined' ? {} : model;

				const state = {url: url, model: model, model_url: model_url, getModel: getModel, cache: {}, id: id, template_url: template_url};

				const compiled = $ngine.interpolate(template, $ngine.eval, 0, state).toString();

				callback = typeof callback == 'undefined' ? 'body' : callback;

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
					target.appendChild(compositeTarget);
					$ngine.apply(compositeTarget, id, compiled);
				}

			});

		});

		return '<span id="' + id + '">loading..</span>';
	}
};

window.$ngine.loadConfig('ngine.json');