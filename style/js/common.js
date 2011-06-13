var EE = {
	OK: '~[200]'
};

function startup() {
	_.config.store('chat_bgtime', 60);
	$$('#e_notice').invoke('hide');
	//chat.background();
};
$(startup);

function _tooltip() {
	$$('*').findAll(function(node) {
		return node.getAttribute('title');
	}).each(function(node) {
		new Tooltip(node, node.title);
		node.removeAttribute('title');
	});
};
$(_tooltip);

$w('click change submit keypress blur focus mouseover').each(function(i) {
	Element.Methods['_' + i] = function(element, f) {
		element = $(element);
		element.observe(i, f);
		return element;
	};
	
	Element.Methods['un' + i] = function(element, f) {
		element = $(element);
		element.stopObserving(i, f);
		return element;
	}
});

$w('Top Bottom After Before').each(function(i) {
	Element.Methods['insert_' + i.toLowerCase()] = function(element, code) {
		element = $(element);
		eval("new Insertion." + i + "(element, code);");
		return element;
	}
});
Element.addMethods(Element.Methods);

Element.addMethods({
	html: function(element, value) {
		element = $(element);
		if (value === undefined) {
			return element ? element.innerHTML : null;
		}
		element.update(value);
		return element;
	},
	fixed: function(element) {
		element = $(element);
		element.addClassName('fixed');
		return element;
	},
	unfixed: function(element) {
		element = $(element);
		element.removeClassName('fixed');
		return element;
	},
	calendar: function(element) {
		element = $(element);
		Calendar.setup({dateField: element});
		$(element).writeAttribute('readonly', true);
		return element;
	},
	display_toggle: function(element, element2) {
		element = $(element);
		element2 = $(element2);
		
		$(element).show();
		$(element2).hide();
		return element;
	},
	selectindex_t: function(element, i) {
		element = $(element);
		
		_.form.selectindex(element, i);
		return element;
	},
	selectindex_v: function(element, i) {
		element = $(element);
		
		_.form._selectindex(element, i);
		return element;
	},
	option_sort: function(element) {
		element = $(element);
		
		$A(element.options).sort(function(a, b) {
			return (a.text.toLowerCase() < b.text.toLowerCase() ) ? -1 : 1;
		}).each(function(o, i) {
			element.options[i] = o;
		});
		
		return element;
	},
	li_sort: function(element) {
		element = $(element);
		
		a = li_get_text(element);
		a.sort(function(a, b) {
			a = a.data.toLowerCase().replace(/^ */g,'');
			b = b.data.toLowerCase().replace(/^ */g,'');
			if (a == b) return 0;
			return a > b ? 1 : -1;
		});
		
		while (a.length) {
			c = a.pop();
			while (c && c.nodeName != 'LI') c = c.parentNode;
			if (c) element.insertBefore(c, element.firstChild);
		};
		
		return element;
	},
	list_observe: function(element, f) {
		element = $(element);
		
		_.li(element).each(function(i) {
			if (_.empty(i.id) && !Object.isUndefined(i.id)) return;
			
			Try.these(function() {
				$(i.id).unclick(function() { f(i) });
			});
			
			$(i.id)._click(function() { f(i) });
		});
		
		return element;
	},
	timeout: function(element, f, t) {
		element = $(element);
		
		_.timeout(function() {
			eval('element.' + f + '();');
		}, t);
		return element;
	}
});

function li_get_text(hoo) {
	var A = [], next, T, pa, i;
	if (!hoo) return A;
	
	if (hoo.nodeType== 3 && /\w+/.test(hoo.data)) {
		A.push(hoo);
	} else if (hoo.hasChildNodes()) {
		pa = hoo.childNodes, i = 0;
		while (pa[i]) {
			next = pa[i++];
			T = next.nodeType;
			if (T== 3) {
				if (/\w+/.test(next.data)) A.push(next);
			}
			else if (T== 1) A = A.concat(arguments.callee(next));
		}
	};
	return A;
};

function array_key(arr, k) {
	return arr[k];
};

function array_pop(arr) {
	return arr.pop();
};

function try_eval(str) {
	return Try.these(function() { return eval(str); });
};

function json_decode(a) {
	return a.evalJSON(true);
};

function _confirm(str) {
	return confirm(_.entity_decode(str));
};

function ef(g) {
	try {
		eval('var a = ' + g + ';');
		return a;
	} catch (h) { }
};

function filter_args(arr) {
	args = {};
	for (var i = 0, j = 0, end = _.len(arr); i < end; i++) {
		if (arr[i].match(/\d+/)) {
			args['arg_' + (j + 1)] = arr[i];
			j++;
		}
	}
	return args;
};

var skip = {
	list: [],
	
	get: function() {
		return skip.list;
	},
	add: function(str) {
		$w(str).each(function(i) {
			skip.list.push(i);
		});
	},
	rm: function(str) {
		$w(str).each(function(i) {
			skip.list = skip.list.without(i);
		});
	},
	clear: function() {
		skip.list.clear();
	}
};

var _ = {
	aconfig: [],
	extend_skip: [],
	calltime: 0,
	calltime_count: 0,
	
	timeout: function(cmd, s) {
		return setTimeout(cmd, (s * 1000));
	},
	len: function(a) {
		return Try.these(
			function() { return a.length; }
		) || 0;
	},
	e: function(e) {
		return Try.these(
			function() { return Event.element(e); },
			function() { return $(e); }
		) || e;
	},
	parent: function(e, rid) {
		e = _.e(e).parentNode;
		while (e.id == '') {
			e = e.parentNode;
		};
		if (rid) {
			return e.id;
		};
		return e;
	},
	ga: function(el, k) {
		return $(el).readAttribute(k);
	},
	sa: function(el, k, v) {
		return $(el).writeAttribute(k, v);
	},
	empty: function(e) {
		return (Object.isUndefined(e) || e == '' || !e);
	},
	split: function(s, a) {
		if (_.empty(a)) a = '|';
		
		return Try.these(function() { return s.split(a); }) || false;
	},
	glue: function(s, g) {
		a = '';
		s.each(function(z, i) {
			a += ((i) ? g : '') + z;
		});
		return a;
	},
	replacement: function(s, a, b) {
		return s.replace(a, b);
	},
	inArray: function(needle, haystack, strict) {
		var r = false;
		var s = '==' + ((strict) ? '=' : '');
		haystack.each(function(a) {
			eval('cmp = (needle ' + s + ' a) ? true : false;');
			if (cmp) {
				r = true;
				return;
			}
		});
		return r;
	},
	fill: function(v, s) {
		return (v) ? v : s;
	},
	forceArray: function(a) {
		if (Object.isString(a) || Object.isNumber(a)) {
			a = [];
		}
		return a;
	},
	extend: function(a, b) {
		var c = {};
		
		for (row in a) {
			if (!Object.isFunction(a[row]) || !Object.isUndefined(_.extend_skip[row])) c[row] = a[row];
		}
		for (row in b) {
			if (!Object.isFunction(b[row]) || !Object.isUndefined(_.extend_skip[row])) c[row] = b[row];
		}
		
		return c;
	},
	add: function(a, v) {
		a.push(v);
		return;
	},
	encode: function(s) {
		if (!Object.isString(s)) {
			s = s.toString();
		}
		return _.trim(s);
	},
	call: function(url, callback, arg, show_wait) {
		if (!url) return false;
		
		if (!Object.isObject(arg)) {
			arg = {};
		}
		arg.ghost = 1;
		
		var opt = {
			method: 'post',
			asynchronous: true,
			postBody: Object.toQueryString(arg),
			onCreate: function() {
				_.call_lapsed();
				
				if (show_wait) {
					_.call_notify();
				}
				return false;
			},
			onSuccess: function(t) {
				_.call_lapsed_stop();
				
				if (show_wait) {
					_.call_notify_close();
				}
				
				return callback(t);
			},
			onFailure: function(t) {
				_.call_lapsed_stop();
				
				response = t.statusText;
				if (response == 'Not Found')
				{
					response = _.config.read('g_not_found');
				}
				
				return _.error.show(response);
			}
		};
		new Ajax.Request(url, opt);
		return false;
	},
	call_lapsed: function() {
		_.calltime_count++;
		if (_.calltime_count == 2) {
			_.call_notify();
		}
		
		_.calltime = _.timeout(_.call_lapsed, 1);
		return true;
	},
	call_lapsed_stop: function() {
		clearTimeout(_.calltime);
		_.calltime_count = 0;
		
		return _.call_notify_close();
	},
	call_notify: function() {
		g_proc_legend = _.config.read('g_procesing_custom') || _.config.read('g_procesing');
		if (g_proc_legend) {
			$('notifybar_legend').update(g_proc_legend);
			$('notifybar').show();
		}
		return false;
	},
	call_notify_close: function() {
		$('notifybar').hide();
		return false;
	},
	fp: function(a, b) {
		response = [];
		a.each(function(z, i) {
			var d = z;
			if (!Object.isUndefined(b[i])) {
				d = b[i];
			}
			response[z] = ($(d)) ? _.encode($F(d)) : '';
		});
		return response;
	},
	v: function(el, v, a) {
		return Try.these(function() {
			if (a && !_.empty($F(el))) {
				v = $F(el) + a + v;
 			}
			$(el).value = v;
		});
	},
	go: function(u) {
		if (_.h(u, 'Location')) {
			u = u.substr(10);
		}
		window.location = u;
		return;
	},
	reload: function() {
		window.location.reload();
		return false;
	},
	print: function() {
		window.print();
	},
	sim_click: function(el) {
		_.e(el).click();
		return false;
	},
	clear: function(e) {
		$(e).update();
		$$('#search-box').invoke('show');
		
		Try.these(function() {
			computer.search.focus();
		});
		
		return;
	},
	observe: function(d, e) {
		$(d)._click(function() { _.clear(e) });
		return;
	},
	display: function(el) {
		return Element.getStyle(el, 'display');
	},
	shown: function(el) {
		if ($(el)) {
			return (_.display(el) != 'none');
		}
		return false;
	},
	code: function(el) {
		return $(el).innerHTML;
	},
	stripTags: function(string) {
		return string.replace(/(<([^>]+)>)/ig, '');
	},
	trim: function(str) {
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	},
	low: function(s) {
		return s.toLowerCase();
	},
	h: function(a, b) {
		return (a.indexOf(b) != -1);
	},
	entity_decode: function(s) {
		var el = document.createElement('textarea');
		el.innerHTML = s;
		return el.value;
	},
	li: function(li) {
		return Element.findChildren($(li), false, false, 'li');
	},
	_focus: function(a) {
		return Try.these(
			function() { $(a).activate(); }
		) || false;
	},
	_efocus: function(a) {
		_.v(a, '');
		_._focus(a);
		return false;
	},
	_toggle: function(a, b) {
		return Try.these(
			function() { $(a).hide(); $(b).show(); }
		) || false;
	},
	focus: function(el, sf) {
		if (!sf) sf = [];
		
		it = 'text password textarea';
		first = false;
		Form.getElements(el).each(function(i) {
			if (!_.input.type(i, it)) return;
			
			_skp = false;
			for (var j = 0, end = _.len(sf); j < end; j++) {
				if (sf[j] == i.id && !_skp) _skp = true;
			}
			
			if (_skp) return;
			
			if (_.empty($F(i.id)) && !first) {
				first = true;
				_._focus(i.id);
			}
		});
		return false;
	},
	form: {
		numbers: function(e) {
			var key;
			var keyr;
			
			key = Try.these(
				function() { return window.event.keyCode; },
				function() { return e.which; }
			) || true;
			if (key === true) {
				return key;
			}
			
			keyr = String.fromCharCode(key);
			all_key = [0, Event.KEY_BACKSPACE, Event.KEY_TAB, Event.KEY_RETURN, Event.KEY_ESC];
			
			if ((key == null) || _.inArray(key, all_key) || (keyr == '.' && !_.h($F(Event.element(e)), '.')) || (("0123456789").indexOf(keyr) > -1)) {
				return true;
			}
			
			return Try.these(
				function() { return Event.stop(e); },
				function() { return e.returnValue = false; }
			) || false;
		},
		submit: function(f, callback, a_args, show_wait) {
			if (!this.isEmpty(f)) return false;
			
			_.form.checkbox(f);
			
			arg = {};
			Form.getElements(f).each(function(i, j) {
				if (_.empty(i.name)) return;
				
				var arg_value = i.value;
				if (_.input.type(i, 'checkbox') && !i.checked) {
					arg_value = '';
				}
				
				if (_.h(i.name, '[')) {
					i.name = _.replacement(i.name, '[]', '[' + j + ']');
					arg[i.name] = _.encode(arg_value);	
				} else {
					arg[i.name] = _.encode(arg_value);
				}
			});
			
			if (Object.isObject(a_args)) {
				arg = _.extend(arg, a_args);
			};
			
			return _.call(f.action, callback, arg, show_wait);
		},
		complete: function(t) {
			var response = t.responseText;
			err = false;
			
			if (_.error.has(response)) {
				err = true;
				_.error.show(response);
			}
			
			Form.getElements(f).each(function(i, j) {
				if (i.name && !_.input.type(i, 'submit')) {
					if (!err) _.v(i, '');
					
					if (_.input.type(i, 'text') && !j) _._focus(i);
				}
			});
			return false;
		},
		event: function(e) {
			Event.stop(e);
			return _.form.find(e);
		},
		find: function(e) {
			return Event.findElement(e, 'form');
		},
		required: function(f) {
			return $(f).select('.required');
		},
		tab: function(f) {
			$(f).getInputs().each(function(i) {
				if (!_.input.type(i, 'hidden textarea')) {
					i._keypress(_.form.tab_key);
				}
			});
			return;
		},
		tab_key: function(e) {
			if (e.keyCode != Event.KEY_RETURN) return;
			
			f = _.form.find(e);
			r = _.form.required(f);
			e = _.e(e);
			_focus = false;
			
			$(f).getElements().each(function(i) {
				if (_.input.type(i, 'hidden')) {
					return;
				}
				
				if (_focus) {
					r.each(function(j) {
						if (i.id == j.id) {
							_._focus(i);
							_focus = false;
							throw $break;
						}
					});
					
					if (!_focus) return;
				}
				
				if (!_.empty(i.value) && e.id == i.id) {
					_focus = true;
				}
			});
			return;
		},
		error_or_go: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			return _.go(response);
		},
		sEmpty: function(f) {
			var response = true;
			if (!_.form.isEmpty(f)) {
				response = false;
			} else {
				_.form.checkbox(f);
			}
			return response;
		},
		isEmpty: function(f) {
			err = false;
			
			Form.getElements(f).each(function(i) {
				if (_.empty(i.value) && !_.inArray(i.name, skip.get()) && !_.input.type(i, 'select hidden')) {
					if (!err) _._focus(i);
					
					err = true;
				}
			});
			
			return !err;
		},
		first: function(el) {
			a = false;
			$(el).getInputs().each(function(i) {
				if (i.type == 'hidden' || i.disabled) {
					return;
				}
				
				if (!a) $(i).activate();
				
				a = true;
			});
			return;
		},
		changed: function(f) {
			response = false;
			$w(f).each(function(row) {
				if ($(row) && !_.empty(_.trim($F(row)))) {
					response = true;
					throw $break;
				}
			});
			return response;
		},
		selectindex: function(el, str) {
			return Try.these(function() {
				$(el).selectedIndex = $A($(el).getElementsByTagName('option')).find( function(node){ return (_.low(node.text) == _.low(_.entity_decode(str))); }).index;
			}) || false;
		},
		_selectindex: function(el, str) {
			return Try.these(function() {
				$(el).selectedIndex = $A($(el).getElementsByTagName('option')).find( function(node){ return (node.value == _.entity_decode(str)); }).index;
			}) || false;
		},
		selectedindex: function(el) {
			return Try.these(function() {
				el = $(el);
				return el.options[el.selectedIndex].value;
			}) || false;
		},
		firstOption: function(e, n) {
			if (!n) n = 0;
			
			return Try.these(function() {
				var a = Element.findChildren(_.e(e), false, false, 'option');
				if (a[n]) return [_.ga(a[n], 'value'), a[n].text];
			}) || [0, ''];
		},
		dynamic: {
			callbacks: [],
			
			create: function(el, f, n) {
				return Try.these(function() {
					_.config.store('f_' + el, f, true);
					_.config.store('n_' + el, n, true);
					
					sv = array_key(_.form.firstOption(el), 1);
					$(el).insert_top(Builder.node('option', {value: 'option_' + el}, 'Crear elemento...')).selectindex_t(sv)._change(_.form.dynamic.change);
				});
			},
			change: function(e) {
				var el = _.e(e).id;
				
				formname = 'g_form_' + el;
				inputname = 'g_case_' + el;
				submitname = 'g_submit_' + el;
				
				if (_.form.selectedindex(el) == 'option_' + el) {
					formaction = _.config.read('ds_' + el) || _.config.read('global_dynamic_select');
					
					$(el).insert_after(Builder.node('form', {method: 'post', id: formname, action: formaction}, [
						Builder.node('input', {type: 'text', className: 'in', size: 25, id: inputname, name: 'case'}),
						Builder.node('input', {type: 'submit', className: 'bt', id: submitname, name: 'submit', value: 'Guardar'})
					]));
					
					$(formname).addClassName('m_top_mid gform')._submit(function(_e) {
						Event.stop(_e);
						return _.form.submit($(formname), _.config.read('f_' + el), {is: el});
					});
					
					return _._focus(inputname);
				}
				
				$$('#' + formname).invoke('remove');
				
				if (_.config.read('n_' + el)) {
					_._focus(_.config.read('n_' + el));
				};
				return;
			}
		},
		checkbox: function(f) {
			return Try.these(function() {
				Form.getElements.each(function(i) {
					if (_.empty(i.name)) return;
					
					if (_.input.type(i, 'checkbox') && !i.checked) {
						i.checked = true;
						i.value = 0;
					}
				});
			});
		}
	},
	input: {
		_type: function(i) {
			return (i.type != 'select-one') ? i.type : 'select';
		},
		type: function(el, k, sign) {
			if (!sign) sign = '==';
			
			el = $(el);
			result = false;
			$w(k).each(function(i) {
				el_type = _.input._type(el);
				
				eval('cmp = (el_type ' + sign + ' i);');
				if (cmp) {
					result = true;
					throw $break;
				}
			});
			return result;
		},
		replace: function(f, v) {
			f.each(function(row) {
				if ($F(row) == null) {
					_.v(row, v);
				}
			});
			return;
		},
		empty: function(a) {
			if (!a) a = 'stext';
			
			if (_.empty($F(a))) {
				return _._focus(a);
			}
			return true;
		},
		option: function(a) {
			$$('.' + a).each(function(i) {
				$(i)._click(_.input.option_callback);
			});
		},
		option_callback: function(e) {
			e = $(_.e(e));
			a = array_key(_.split(Object.toHTML(e.classNames()), ' '), 0);
			
			$$('.' + a).each(function(i, j) {
				if (e.id === i.id)
				{
					_.v(_.replacement(a, 'sf_option_', ''), _.replacement(i.id, 'option_', ''));
					$(i).addClassName('sf_selectd');
				} else {
					$(i).removeClassName('sf_selectd');
				}
			});
			return;
		},
		select: {
			clear: function(e) {
				return $$('#' + e + ' option').invoke('remove');
			}
		}
	},
	config: {
		store: function(k, v, f) {
			if (f === true) {
				_.extend_skip[k] = true;
			}
			
			if (Object.isObject(k)) {
				_.aconfig = _.extend(_.aconfig, k);
			} else {
				eval('_.aconfig = _.extend(_.aconfig, {' + k + ': v})');
			}
			return;
		},
		read: function(k) {
			return (!Object.isUndefined(_.aconfig[k])) ? _.aconfig[k] : false;
		}
	},
	error: {
		list: [],
		has: function(a) {
			a = _.trim(a);
			
			if (a == '[login]') {
				_.reload();
			}
			if (a.match(/Array/))
			{
				alert(a);
				return false;
			}
			
			return _.h(a.substr(0, 1), '#') || _.h(a, 'Parse error');
		},
		fshow: function(a) {
			$(function() { _.error.show(a); });
		},
		show: function(a) {
			if (_.empty(a)) {
				return false;
			}
			
			_.error.list.clear();
			
			if (_.error.has(a)) a = a.substr(1);
			
			_.split(a, '$').each(function(b) {
				if (!_.empty(b)) _.add(_.error.list, b);
			});
			
			all = '<ul class="ul_none">';
			_.error.list.each(function(b) {
				all += '<li>' + b + '</li>';
			});
			all += '</ul>';
			
			_.notice(all);
			return false;
		}
	},
	tab: {
		ary: [],
		refresh: function(scr) {
			if (!scr) scr = 0;
			
			a = _.split(_.config.read('tab_refresh'), ' ');
			_.tab.x(a[0], a[1], a[2], scr);
			return false;
		},
		observe: function(el) {
			a = $$('#' + el + ' li');
			a.each(function(i) {
				$(i.id)._click(_.tab.click);
				_.add(_.tab.ary, _.replacement(i.id, 'row_', ''));
				
				if (_.len(a) == 1) _.tab.click(i.id);
			});
			return;
		},
		click: function(e) {
			el = _.e(e);
			tab_id = _.replacement(el.id, 'row_', '');
			
			if (el.id == _.config.read('tab_last')) {
				_.tab.remove(el.id + '_s', tab_id);
				_.config.store('tab_last', '');
			} else {
				if (!_.empty(_.config.read('tab_last'))) {
					_.tab.remove(_.config.read('tab_last') + '_s', _.replacement(_.config.read('tab_last'), 'row_', ''));
				}
				if (el.id != _.config.read('tab_last')) {
					_.config.store('tab_last', el.id);
				}
				ff = _.replacement(_.code('tab_format'), /_dd/g, '_' + tab_id);
				$(el).insert_after('<li id="' + el.id + '_s">' + ff + '</li>');
				
				$w(_.config.read('xtab_tags')).each(function(tab) {
					$('tab_' + tab + '_' + tab_id)._click(_.tab.z);
				});
				
				_.tab.z('tab_general_' + tab_id);
			}
			return;
		},
		remove: function(el, i) {
			$w(_.config.read('xtab_tags')).each(function(tab) {
				$('tab_' + tab + '_' + i).unclick(_.tab.z);
			});
			$(el).remove();
			return;
		},
		x: function(_a, _b, _c, scr) {
			if (!scr) scr = 0;
			
			_scr = scr;
			_.config.store('tab_refresh', _a + ' ' + _b + ' ' + _c);
			
			return _.call(_b, _.tab._x);
		},
		_x: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			switch (_scr) {
				case 1:
					prev_scrolltop = document.documentElement.scrollTop;
					break;
			}
			
			$('tab_frame_' + tab_id).update(response);
			
			switch (_scr) {
				case 1:
					document.documentElement.scrollTop = prev_scrolltop;
					break;
				default:
					$('tab_frame_' + tab_id).scrollTo();
					break;
			}
			return;
		},
		z: function(e) {
			el = _.split(_.e(e).id, '_');
			return _.tab.x(el[2], _.replacement(_.replacement(_.config.read('u_tab'), '*', el[2]), '?', el[1]), el[1]);
		}
	},
	notice: function(a, b) {
		$('e_notice').update(a).appear().timeout('fade', b || 10);
	}
}

var utils = {
	cmail: {
		element: 1,
		total: 0,
		list: 0,
		list_name: '',
		row: '',
		prefresh: true,
		
		esc: function(e) {
			if (e.keyCode == Event.KEY_ESC) {
				return utils.cmail.unload(e);
			}
		},
		unload: function(e) {
			Event.stop(e);
			return false;
		},
		
		callback: function(e) {
			f = _.form.event(e);
			if (!_.form.isEmpty(f)) {
				return false;
			}
			
			// Call proc
			_.form.submit(f, utils.cmail.callback_submit);
			
			// Call refresh
			utils.cmail.prefresh = true;
			utils.cmail.recall();
			
			Event.observe(document, 'keypress', utils.cmail.esc);
			Event.observe(window, 'beforeunload', utils.cmail.unload);
			
			$w('proc_list_d proc_status proc_finished').invoke('hide');
			$('proc_legend').show();
			
			return;
		},
		callback_submit: function(t) {
			var response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			Event.stopObserving(window, 'beforeunload', utils.cmail.unload);
			utils.cmail.refresh();
			return false;
		},
		
		startup: function() {
			utils.cmail.row = _.code('template_row');
			$('template_row').remove();
			utils.cmail.duplicate();
			$('multi_search')._submit(utils.cmail.callback);
		},
		recall: function() {
			if (utils.cmail.prefresh) {
				_.timeout("utils.cmail.refresh();", 3);
			}
		},
		refresh_callback: function(t) {
			var response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = json_decode(response);
			
			if (ret.proc_total == ret.proc_count) {
				if (ret.proc_num == ret.proc_num_total) {
					utils.cmail.prefresh = false;
					$('proc_finish').show();
				}
				
				if (ret.proc_name != utils.cmail.list_name) {
					proc_li = Builder.node('li', {id: 'proc_li_' + (utils.cmail.list + 1)}, ret.proc_name + ' --- ' + ret.proc_file);
					
					if (utils.cmail.list) {
						$('proc_li_' + utils.cmail.list).insert_after(proc_li);
					} else {
						$('proc_list').insert_top(proc_li);
					}
					utils.cmail.list++;
					
					$('proc_list_d').show();
				};
				
				utils.cmail.list_name = ret.proc_name;
			};
			
			// TODO: Improve function calling
			$w('file total match count start end').each(function(i) {
				eval('rv = ret.proc_' + i + ';');
				$('proc_' + i).update(rv);
			});
			
			$w('match count').each(function(i) {
				eval('rv = ret.percent_' + i + ';');
				$('percent_' + i).update(rv);
			});
			
			$('proc_status').display_toggle('proc_legend');
			
			utils.cmail.recall();
			return false;
		},
		refresh: function() {
			return _.call(_.config.read('u_refresh'), utils.cmail.refresh_callback, true);
		},
		duplicate: function(e) {	
			if (utils.cmail.total && !_.form.isEmpty('multi_search')) {
				return false;
			}
			
			a = _.replacement(utils.cmail.row, /_dd/g, '_' + utils.cmail.element);
			a = _.replacement(a, /_ee/g, (utils.cmail.element - 1));
			
			if (utils.cmail.total) {
				$('srow_' + _.replacement(_.e(e).id, 'row_add_', '')).insert_after(a);
			} else {
				$('search_list').insert_top(a);
			};
			
			$('srow_' + utils.cmail.element).addClassName('m_top_mid');
			$('row_add_' + utils.cmail.element)._click(utils.cmail.duplicate);
			$('row_rem_' + utils.cmail.element)._click(utils.cmail.remove);
			
			$$('input').each(function(i) { i.writeAttribute('autocomplete', 'off'); });
			
			utils.cmail.element++;
			utils.cmail.total++;
			
			return _.form.isEmpty('multi_search');
		},
		focus: function() {
			return _._focus('vinput_' + (utils.cmail.element - 1));
		},
		remove: function(e) {
			a = _.replacement(_.e(e).id, 'row_rem_', '');
			if (utils.cmail.total < 2) {
				return _._efocus('vinput_' + a);
			};
			
			$('srow_' + a).remove();
			utils.cmail.total--;
			return;
		}
	}
}

var computer = {
	dynamics: {
		create: {
			def: function(t) {
				response = t.responseText;
				if (_.error.has(response)) {
					return _.error.show(response);
				}
				
				_e = _.split(response);
				if (_e[0] == EE.OK) {
					$(_e[1]).selectindex_t(_e[2]);
					$('g_form_' + _e[1]).remove();
					
					if (_.config.read('n_' + _e[1])) {
						_._focus(_.config.read('n_' + _e[1]));
					};
					return;
				}
				
				$(_e[0]).insert_bottom(Builder.node('option', {value: _e[1]}, _e[2])).option_sort().selectindex_t(_e[2]);
				$('g_form_' + _e[0]).remove();
				
				if (_.config.read('n_' + _e[0])) {
					_._focus(_.config.read('n_' + _e[0]));
				};
				return;
			},
			brand_2: function(t) 	{
				response = t.responseText;
				if (_.error.has(response)) {
					return _.error.show(response);
				}
				
				_e = _.split(response);
				if (_e[0] == EE.OK) {
					$(_e[1]).selectindex_t(_e[2]);
					$('g_form_' + _e[1]).remove();
					
					if (_.config.read('n_' + _e[1])) {
						_._focus(_.config.read('n_' + _e[1]));
					};
					return;
				};
				
				option_e = Builder.node('option', {value: _e[1]}, _e[2]);
				$(_e[0]).insert_bottom(option_e).option_sort().selectindex_t(_e[2]);
				$(_e[0] + '2').insert_bottom(option_e).option_sort();
				$('g_form_' + _e[0]).remove();
				
				if (_.config.read('n_' + _e[0])) {
					_._focus(_.config.read('n_' + _e[0]));
				}
				return;
			}
		}
	},
	create: {
		s_action: '',
		d_open: false,
		update_computer: false,
		update_component: false,
		computer_changed: false,
		component_changed: false,
		computer_values: [],
		component_values: [],
		
		watch_changes: function(e) {
			e = _.e(e);
			
			_input = $('form_' + e).getElements();
			_input.each(function(i) {
				try_eval('computer.create.' + e + '_values[i.id] = $F(i);');
				
				switch (_.input._type(i)) {
					case 'select':
						$(i)._change(computer.create.has_changes);
						break;
					case 'text':
						$(i)._keypress(computer.create.has_changes);
						break;
				}
			});
			return;
		},
		has_changes: function(ee) {
			e = array_key(_.split(_.form.find(ee).id, '_'), 1);
			ee = _.e(ee);
			
			eval('r = computer.create.' + e + '_values[ee.id];');
			
			if (r != $F(ee.id)) {
				eval('computer.create.' + e + '_changed = true;');
			};
			return;
		},
		event: function(e) {
			f = _.form.event(e);
			
			return _.form.submit(f, ef('computer.create.' + array_key(_.split(f.id, '_'), 1)));
		},
		load: function() {
			$w('computer component').each(function(i) {
				$(i + '_price')._keypress(_.form.numbers);
				$(i + '_get_date').calendar();
				$('form_' + i)._submit(computer.create.event).reset();
				
				$w('product get').each(function(j) {
					j = i + '_' + j + '_type';
					jf = ef('computer.create.' + j);
					
					jf(j);
					$(j)._change(jf);
				});
				computer.create.watch_changes(i);
				
				if (i == 'computer') {
					_.form.dynamic.create(i + '_brand', computer.dynamics.create.brand_2, i + '_model');
					skip.add(i + '_mac');
					_._focus(i + '_account');
				}
			});
			
			$('tab_0')._click(computer.create.computer_e).addClassName('relevant').fixed();
			
			$w('tab_component computer_skip').each(Element.hide);
			$('dd').remove();
			
			return _.form.dynamic.create('computer_product_type', computer.dynamics.create.def, 'computer_status');
		},
		skip: function(e) {
			if (computer.create.component_changed && _confirm(_.config.read('g_save_create_component'))) {
				return;
			}
			return _.go(_.config.read('computer_create_url'));
		},
		computer: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = json_decode(response);
			
			if (!_.empty(ret.url)) {
				return _.go(ret.url);
			};
			
			if (!_.empty(ret.lang)) {
				_.notice(ret.lang);
			};
			
			skip.add('license_brand component_edition component_version');
			$('form_component').reset();
			
			$w('computer component').each(function(c) {
				_.v(c + '_computer_id', ret.computer);
				
				if (c == 'computer') {
					$w('invoice_serial invoice_number invoice_apply get_date').each(function(i) {
						_.config.store(c + '_' + i, $F(c + '_' + i));
					});
					
					if (!_.empty(ret.donation)) {
						_.config.store(c + '_donation', ret.donation);
					};
					
					_.config.store(c + '_id', ret.computer);
					
					_.v(c + '_get_date', _.config.read(c + '_get_date'));
					return;
				};
				
				if (_.config.read('computer_invoice_apply') == 1) {
					$w('serial number').each(function(i) {
						_.v(c + '_invoice_' + i, _.config.read('computer_invoice_' + i));
					});
				};
				
				$w('category manufact brand').each(function(i) {
					_.form.dynamic.create(c + '_' + i, computer.dynamics.create.def);
				});
				
				$('tab_1')._click(computer.create.component_e);
				
				if (_.config.read('computer_donation') > 0) {
					$(c + '_get_type').selectindex_t(_.config.read('computer_donation'))._change(computer.create.component_get_type);
					
					$w('price invoice_serial invoice_number').each(function(i) {
						skip.add(c + '_' + i);
					});
					
					invoice_d = 'hide';
				} else {
					invoice_d = 'show';
				};
				$$('.g_' + c + '_invoice').invoke(invoice_d);
			});
			
			$('tab_0').removeClassName('relevant').unfixed();
			$('tab_1').addClassName('relevant').fixed();
			
			$('tab_component').display_toggle('tab_computer');
			
			$w('computer_category computer_brand component_category component_brand').each(function(i) {
				$(i).selectindex_t(array_key(_.form.firstOption(i, 1), 1));
			});
			
			computer.create.computer_changed = false;
			return;
		},
		component: function(t) {
			var response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = json_decode(response);
			
			_.config.store('computer_create_url', ret.url);
			if (!_confirm(_.config.read('g_computer_new_component'))) {
				return _.go(ret.url);
			};
			
			$('form_component').reset();
			$('e_notice').update(ret.lang).appear().timeout('fade', 5);
			
			$('computer_skip')._click(computer.create.skip).show();
			
			component_li = 'component_li_' + ret.component;
			switch (ret.mode) {
				case 'insert':
					$('tab_component_list').insert_bottom(Builder.node('li', {id: component_li}, _.entity_decode(ret.product))).show();
					break;
				case 'update':
					$(component_li).update(ret.product);
					break;
			};
			
			if (_.config.read('computer_get_type') == 2) {
				$('g_component_get_type').show();
				$('component_get_type').selectindex_t(_.config.read('g_donation'))._change(computer.create.component_get_type);
				skip.add('component_price component_invoice_serial component_invoice_number');
			} else {
				$('g_component_get_type').hide();
			};
			
			t_values = 'get_date';
			if (_.config.read('computer_apply') == 1) {
				t_values += ' invoice_serial invoice_number';
			};
			
			$w(t_values).each(function(i) {
				_.v('component_' + i, _.config.read('computer_' + i));
			});
			
			$w('computer_category computer_brand component_category component_brand').each(function(i) {
				$(i).selectindex_t(array_key(_.form.firstOption(i, 1), 1));
			});
			
			computer.create.computer_changed = false;
			computer.create.component_changed = false;
			return;
		},
		computer_e: function(e) {
			e = _.e(e);
			
			if (!_.config.read('computer_id')) {
				return;
			};
			
			if (computer.create.component_changed && _confirm(_.config.read('g_save_create_component'))) {
				return;
			};
			
			computer.create.update_computer = true;
			computer.create.component_changed = false;
			$('tab_computer').display_toggle('tab_component');
			
			$('tab_0').addClassName('relevant').fixed();
			$('tab_1').removeClassName('relevant').unfixed();
			
			return;
		},
		component_e: function(e) {
			el = _.e(e);
			
			if ((computer.create.component_changed || computer.create.computer_changed) && !_confirm(_.config.read('g_reset_create_component'))) {
				return false;
			};
			
			if (_.display('tab_component') == 'none') {
				$('tab_0').removeClassName('relevant').unfixed();
				$('tab_1').addClassName('relevant').fixed();
				
				$('tab_component').display_toggle('tab_computer');
			};
			
			if (el.id == 'tab_1') {
				$('component_brand').show();
				$w('g_component_manufact g_component_edition g_component_version').invoke('hide');
				skip.add('component_manufact component_edition component_version');
				
				$('form_component').reset();
				
				$('g_component_get_type').hide();
				if (_.config.read('computer_get_type') == 2) {
					$('g_component_get_type').show();
					$('component_get_type').selectindex_t(_.config.read('g_donation'))._change(computer.create.component_get_type);
					skip.add('component_price component_invoice_serial component_invoice_number');
				};
				
				component_f = ((_.config.read('computer_apply') == 1) ? 'invoice_serial invoice_number ' : '') + 'get_date';
				
				$w('component_category component_brand').each(function(i) {
					$(i).selectindex_t(array_key(_.form.firstOption(i, 1), 1));
				});
				
				$w(component_f).each(function(i) {
					_.v('component_' + i, _.config.read('computer_' + i));
				});
				return _._focus('component_account');
			};
			
			computer.create.component_changed = false;
			computer.create.computer_changed = false;
			
			return _.call(_.config.read('u_computer_component_grid'), computer.create.component_er, {component: _.replacement(el.id, 'component_li_', '')});
		},
		component_er: function(t) {
			var response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = json_decode(response);
			
			$('form_component').reset();
			_.v('component_id', ret.component);
			
			ret.features.each(function(i) {
				v = i.property;
				
				switch (i.element) {
					case 'product_name':
						_.v('component_' + i.element, v);
						break;
					case 'category':
						$('component_category').selectindex_t(v);
						break;
					case 'contabilidad':
						break;
					case 'tecnologia':
						break;
					case 'precio':
						break;
					case 'marca':
						$('component_brand').selectindex_t(v);
						$('component_product_type').selectindex_t('Componente');
						break;
					case 'modelo':
						_.v('component_model', v);
						break;
					case 'serie':
						break;
					case 'edicion':
					case 'version':
						v_element = (i.element == 'edicion') ? 'edition' : 'version';
						_.v(v_element, v);
						
						$('component_product_type').selectindex_t('Licencia');
						break;
					case 'manufact':
						$('component_manufact').selectindex_t(v);
						break;
					case 'estado':
						$('component_status').selectindex_t(v);
						break;
				}
			});
			
			computer.create.computer_changed = false;
			computer.create.component_changed = false;
			computer.create.component_product_type();
			return false;
		},
		finish: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			};
			
			$('e_notice').update(response).appear().timeout('fade', 5);
			_.timeout("_.go(response);", 6);
			
			return;
		},
		computer_product_type: function(e) {
			a = parseInt(_.form.selectedindex(_.e(e)));
			f = 'computer_mac';
			g = 'g_' + f;
			
			if (a > 2) {
				$(g).hide();
				skip.add(f);
			} else {
				$(g).show();
				skip.rm(f);
			};
			return false;
		},
		computer_get_type: function(e) {
			a = parseInt(_.form.selectedindex(_.e(e)));
			f = 'computer_price computer_invoice_serial computer_invoice_number computer_invoice_apply';
			sh = 'g_computer_invoice_price g_computer_invoice_serial g_computer_invoice_number g_computer_invoice_apply';
			
			switch (a) {
				case 1:
					$w(sh).each(Element.show);
					skip.rm(f);
					break;
				case 2:
					$w(sh).each(Element.hide);
					skip.add(f);
					break;
			};
			return false;
		},
		component_product_type: function(e) {
			a = parseInt(_.form.selectedindex(_.e(e)));
			f = 'component_manufact component_edition component_version';
			sh = 'g_component_manufact g_component_edition g_component_version';
			sj = 'g_component_brand';
			
			switch (a) {
				case 1:
					$w(sh).each(function(j) { Try.these(function() { $(j).hide(); }); });
					$(sj).show();
					skip.add(f);
					break;
				case 2:
					$w(sh).each(function(j) { Try.these(function() { $(j).show(); }); });
					$(sj).hide();
					skip.rm(f);
					break;
			};
			return false;
		},
		component_get_type: function(e) {
			m_appear = (parseInt(_.form.selectedindex(_.e(e))) == 1) ? 'show' : 'hide';
			$$('.g_component_invoice').invoke(m_appear);
			skip.add('component_price component_invoice_serial component_invoice_number');
			
			return false;
		},
		/*action: function(a) {
			computer.create.s_action = a;
			return;
		},
		event_add_field: function() {
			return $('field_add')._click(computer.create.add_field);
		},*/
		add_field: function() {
			if (computer.create.d_open) {
				return computer.create.remove();
			}
			
			html = Builder.node('div', {id: 'xfield_add_full'}, [
				Builder.node('div', {className: 'ie widthfix float-holder'}, [
					Builder.node('div', {className: 'ticket_half float_left ticket_line', align: 'right'}, [
						Builder.node('span', 'Nombre'),
						Builder.node('br'),
						Builder.node('input', {type: 'text', id: 'add_field_name', name: 'add_field_name'}),
						Builder.node('br'), Builder.node('br')
					]),
					Builder.node('div', {className: 'ticket_half float_right', align: 'left'}, [
						Builder.node('span', 'Valor'),
						Builder.node('br'),
						Builder.node('input', {type: 'text', id: 'add_field_value', name: 'add_field_value'})
					])
				]),
				Builder.node('div', {className: 'ie widthfix float-holder'}, [
					Builder.node('div', {className: 'ticket_half float_left ticket_line', align: 'right'}, [
						Builder.node('span', 'Campo requerido'),
						Builder.node('br'),
						Builder.node('input', {type: 'checkbox', value: '1', id: 'add_field_required', name: 'add_field_required'}),
						Builder.node('br'), Builder.node('br')
					]),
					Builder.node('div', {className: 'ticket_half float_right', align: 'left'}, [
						Builder.node('span', 'Campo unico'),
						Builder.node('br'),
						Builder.node('input', {type: 'checkbox', value: '1', id: 'add_field_unique', name: 'add_field_unique'})
					])
				]),
				Builder.node('div', {className: 'ie widthfix float-holder'}, [
					Builder.node('div', {className: 'ticket_half float_left ticket_line', align: 'right'}, [
						Builder.node('input', {type: 'button', value: 'Agregar', id: 'add_field_submit', name: 'add_field_submit'})
					]),
					Builder.node('div', {className: 'ticket_half float_right', align: 'left'}, [
						Builder.node('input', {type: 'button', value: 'Cancelar', id: 'add_field_cancel', name: 'add_field_cancel'})
					])
				])
			]);
			$('field_add').insert_after(htm);
			
			$('add_field_submit')._click(computer.create._submit);
			$('add_field_cancel')._click(computer.create._cancel);
			
			computer.create.d_open = true;
			return _._focus('add_field_name');
		},
		_submit: function() {
			f = $w('add_field_name add_field_value add_field_required add_field_unique');
			_.input.replace($w('add_field_required add_field_unique'), 0);
			
			if (!computer.create.empty(f)) {
				return false;
			}
			
			arg = {};
			f.each(function(row) {
				el = $(row).value;
				if (_.empty(el)) return;
				
				arg.row = _.encode(el);
			});
			
			return _.call(computer.create.s_action, computer.create._submit_call, arg);
		},
		_submit_callback: function(t) {
			result = t.responseText;
			part = _.split(result);
			
			html = Builder.node('div', {className: 'c float-holder ie-widthfix'}, [
				Builder.node('div', {className: 'w5 float_left', align: 'right'}, [
					Builder.node('span', part[1])
				]),
				Builder.node('div', {className: 'w5 float_right', align: 'left'}, [
					Builder.node('input', {type: 'text', id: part[0], name: part[0], size: 30, value: part[2]})
				])
			]);
			$('insert_point').insert_before(html);
			
			computer.create.remove();
			return;
		},
		empty: function(f) {
			err = false;
			f.each(function(row) {
				el = $(row);
				if (_.input.type(el, 'text textarea')) {
					if (_.empty($F(row))) {
						if (!err) _._focus(el);
						
						err = true;
					}
				}
			});
			return !err;
		},
		_cancel: function() {
			computer.create.remove();
			return;
		},
		remove: function() {
			$('add_field_submit').unclick(computer.create._submit);
			$('add_field_cancel').unclick(computer.create._cancel);
			$('xfield_add_full').remove();
			computer.create.d_open = false;
			return false;
		}
	},
	
	search: {
		element: 1,
		total: 0,
		row: '',
		
		startup: function(e) {
			computer.search.row = _.code('template_row');
			$('template_row').remove();
			
			computer.search.duplicate();
		},
		duplicate: function(e) {
			if (computer.search.total) {
				var _c = _.replacement(_.e(e).id, 'row_add_', '');
				var _c2 = 'vinput_' + _c;
				if (_.empty($F(_c2))) {
					return _._focus(_c2);
				}
			}
			a = _.replacement(computer.search.row, /_dd/g, '_' + computer.search.element);
			a = _.replacement(a, /_ee/g, (computer.search.element - 1));
			
			if (!computer.search.total) {
				$('search_list').insert_top(a);
			} else {
				$('srow_' + _c).insert_after(a);
			};
			
			$('srow_' + computer.search.element).addClassName('m_top_mid');
			$('row_add_' + computer.search.element)._click(computer.search.duplicate);
			$('row_rem_' + computer.search.element)._click(computer.search.remove);
			
			$('table_' + computer.search.element)._change(computer.search.table);
			$('field_' + computer.search.element)._change(computer.search.table_field);
			
			Try.these(function() {
				$('vbox_' + computer.search.element)._change(computer.search.vbox_change);
			});
			
			$$('input').each(function(i) { i.writeAttribute('autocomplete', 'off'); });
			
			if (computer.search.element == 1) {
				Try.these(function() {
					$('svbox_' + computer.search.element).hide();
				});
			}
			
			computer.search.element++;
			computer.search.total++;
			
			return computer.search.focus();
		},
		focus: function() {
			return _._focus('vinput_' + (computer.search.element - 1));
		},
		remove: function(e) {
			a = _.replacement(_.e(e).id, 'row_rem_', '');
			if (computer.search.total < 2) {
				_._efocus('vinput_' + a);
				return;
			}
			
			$('srow_' + a).remove();
			computer.search.total--;
			return;
		},
		table: function(e) {
			el = _.e(e);
			s = _.form.selectedindex(el);
			if (s) _.call(_.config.read('computer_search_stable'), computer.search.table_callback, {table: s});
			return false;
		},
		table_callback: function(t) {
			var response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = json_decode(response);
			
			table = _.replacement(el.id, 'table_', '');
			_.input.select.clear('field_' + table);
			
			ret.each(function(i) {
				$('field_' + table).insert_bottom(Builder.node('option', {value: i.r_id}, _.entity_decode(i.r_name)));
			});
			
			s_option = _.form.firstOption('field_' + table);
			if (!s_option) {
				$w('rfield random').each(function(i) {
					$(i + '_' + table).update('&nbsp;');
				});
			}
			
			$('field_' + table).selectindex_t(s_option[1]);
			computer.search.table_field('field_' + table);
			return false;
		},
		table_field: function(e) {
			el = _.e(e);
			s = _.form.selectedindex(el);
			if (s) {
				_.call(_.config.read('computer_search_sfield'), computer.search.table_field_callback, {field: s});
			}
			return;
		},
		table_field_callback: function(t) {
			response = t.responseText;
			field = _.replacement(el.id, 'field_', '');
			response = _.replacement(response, /_dd/g, '_' + field);
			response = _.replacement(response, /_ee/g, (computer.search.element - 1));
			$('random_' + field).update(response);
			
			$$('input').each(function(i) { i.writeAttribute('autocomplete', 'off'); });
			return _._focus('vinput_' + field);
		},
		vbox_change: function(e) {
			return _._focus('vinput_' + _.replacement(_.e(e).id, 'vbox_', ''));
		}
	},
	
	license: {
		brands: {
			_watch: function() {
				$('button_brands_create')._click(computer.license.brands.create);
				
				return Try.these(function() {
					_.li('brands_list').each(function(i) {
						zv = _.replacement(i.id, 'brands_list_', '');
						$w('modify remove').each(function(j) {
							Try.these(function() { $('x_brand_' + j + '_' + zv)._click(computer.license.brands.j); });
						});
					});
				});
			},
			create: function() {
				computer.license.brands.create_cancel();
				_.v('name', '');
				
				is_visible = (_.display('div_brand_create') != 'none');
				e_method = (is_visible) ? '_' : 'un';
				
				eval("$('button_brand_create_cancel')." + e_method + "click(computer.license.brands.create);");
				if (is_visible) _._focus('name');
				return;
			},
			create_callback: function(t) {
				response = t.responseText;
				if (_.error.has(response)) {
					return _.error.show(response);
				}
				return _.go(response);
			},
			create_cancel: function() {
				Element.toggle('div_brand_create');
				return;
			},
			modify: function(e) {
				id = _.replacement(_.e(e).id, 'x_brand_modify_', '');
				return _.call(_.config.read('u_edit'), computer.license.brands.modify_call, {a: _.config.read('v_uid'), field: _.encode(id)});
			},
			modify_call: function(t) {
				$('value_editing_update').update(t.responseText);
				$('value_editing').show();
				return;
			},
			modify_callback: function(t) {
				response = t.responseText;
				if (_.error.has(response)) {
					return _.error.show(response);
				}
				
				if (response == EE.OK) {
					Effect.DropOut('value_editing');
					_.timeout(_.tab.refresh, 0.5);
				}
				return false;
			},
			modify_cancel: function() {
				Effect.DropOut('value_editing');
				return;
			},
			remove: function(e) {
				if (!_confirm(_.config.read('g_remove_confirm'))) {
					return;
				}
				el = _.e(e);
				id = _.replacement(el.id, 'x_brand_remove_', '');
				
				return _.call(_.config.read('u_delete'), computer.license.brands.remove_callback, {el: _.encode(id)});
			},
			remove_callback: function(t) {
				response = t.responseText;
				if (_.error.has(response)) {
					return _.error.show(response);
				}
				if (response == EE.OK) {
					Effect.DropOut(_.ga(el, 'alias'));
					_.timeout(_.tab.refresh, 0.5);
				}
				return false;
			}
		},
		names: {
			watch: function() {
				return $('button_names_create')._click(computer.license.names.create);
			},
			create: function() {
				computer.license.names.create_cancel();
				_.v('name', '');
				
				is_visible = (_.display('div_names_create') != 'none');
				e_method = (is_visible) ? '_' : 'un';
				
				eval("$('button_names_create_cancel')." + e_method + "click(computer.license.names.create);");
				if (is_visible) _._focus('name');
				return;
			},
			create_cancel: function() {
				Element.toggle('div_names_create');
				return;
			},
			create_callback: function() {
				
			},
			modify: function() {
				
			},
			remove: function() {
				
			}
		},
		numbers: {
			create: function() {
				
			},
			modify: function() {
				
			},
			remove: function() {
				
			}
		},
		versions: {
			create: function() {
				
			},
			modify: function() {
				
			},
			remove: function() {
				
			}
		},
		os: {
			create: function() {
				
			},
			modify: function() {
				
			},
			remove: function() {
				
			}
		},
		osv: {
			create: function() {
				
			},
			modify: function() {
				
			},
			remove: function() {
				
			}
		}
	},
	pdf: function(f, a) {
		$('pdf_process').update('Generando documento...');
		
		return _.form.submit(f, a);
	},
	pdf_callback: function(t) {
		var response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		var ret = json_decode(response);
		
		return window.open(ret.pdf);
		//return _.go(ret.pdf);
	},
	warranty: {
		value_last: 0,
		last_create: '',
		delay: 0.1,
		
		record_create: function(e) {
			_this = _.e(e).id;
			_en = _.split(_this, '_');
			_type = _en.pop();
			_name = _en.pop();
			_subtype = '';
			
			if (_.len(_en) > 1) {
				_tmp = _en.pop();
				_subtype = _name;
				_name = _tmp;
			}
			
			return _.call(_.config.read('u_warranty_record_create'), computer.warranty.record_create_callback);
		},
		record_create_callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			if (response == EE.OK) {
				_.tab.refresh();
			}
			return;
		},
		value_cancel: function(e) {
			_comp = _name + (!_.empty(_subtype) ? '_' + _subtype : '');
			formname = 'form_' + _comp;
			
			if (_type == computer.warranty.value_last) {
				Effect.DropOut(formname);
				computer.warranty.last_create = '';
				computer.warranty.value_last = 0;
				computer.warranty.delay = 0.6;
				
				Try.these(function() { $(_name + '_' + _type + '_cancel').unclick(computer.warranty.value_cancel); });
				_.timeout(function() { $('button_' + _name + '_create').hide().removeClassName('button_s'); }, 0.5);
			} else {
				computer.warranty.delay = 0.1;
				
				Try.these(function() {
					Element.show(formname);
				});
				
				switch (_name) {
					case 'store':
					case 'value':
						Try.these(function() {
							u.select_change();
							$('field_id')._change(u.select_change);
						});
						break;
				}
			}
			return;
		},
		value_button: function(e) {
			_this = _.e(e).id;
			_en = _.split(_this, '_');
			_type = _en.pop();
			_name = _en.pop();
			_subtype = '';
			
			if (_.len(_en) > 1) {
				_tmp = _en.pop();
				_subtype = _name;
				_name = _tmp;
			}
			
			Try.these(function() {
				_in = $('field_buttons').getInputs('button');
				_in.each(function(i) {
					if (i.id == _this) {
						return;
					}
					
					_en2 = _.split(i.id, '_');
					_en2_type = _en2.pop();
					_en2_name = _en2.pop();
					
					_comp = ((_name != _en2_name) ? _en2_name + '_' : '') + _en2_type;
					
					Try.these(function() { $('form_' + _comp).hide(); });
					Try.these(function() { $('button_' + _comp).removeClassName('button_s'); });
				});
			});
			
			computer.warranty.value_cancel();
			
			_.timeout(function() {
				if (_.display('form_' + _name + '_create') != 'none') {
					if (!_.empty(computer.warranty.last_create) && ('form_' + computer.warranty.last_create + '_create' != 'form_' + _name + '_create')) {
						Effect.DropOut('form_' + computer.warranty.last_create + '_create');
						Try.these(function() { $('button_' + computer.warranty.last_create + '_create').hide().removeClassName('button_s'); });
						Try.these(function() { $(u.last_create + '_create_cancel').unclick(computer.warranty.value_cancel); });
						computer.warranty.last_create = '';
						computer.warranty.value_last = 0;
					}
					
					Try.these(function() { $(_name + '_create_cancel')._click(computer.warranty.value_cancel); });
					$('button_' + _name + '_create').show().addClassName('button_s');
					computer.warranty.last_create = _name;
					computer.warranty.value_last = _type;
					_.v('value_group', _type);
					
					_.form.first('form_' + _name + '_create');
				}
			}, computer.warranty.delay);
			
			return;
		},
		create_field: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			computer.warranty.value_cancel();
			return _.timeout(_.tab.refresh, 0.5);
		},
	}
}

var ticket = {
	create: {
		startup: function() {
			f = 'ticket_create';
			_.form.tab(f);
			
			$(f)._submit(Event.stop).reset();
			
			return _.focus(f, skip.get());
		},
		username: function() {
			Element.toggle('d_username');
			return ticket.create.username_f();
		},
		username_f: function() {
			v_skp = 'ticket_username';
			
			if (_.display('d_username') != 'none') {
				skip.rm(v_skp);
			} else {
				skip.add(v_skp);
				_.v(v_skp, '');
			}
			return _.focus('ticket_create', skip.get());
		},
		submit: function(e) {
			var f = _.form.find(e);
			var err = false;
			
			_.v('ticket_group', _.replacement(_.e(e).id, 'group_', ''))
			
			_.form.required(f).each(function(i) {
				j = _.replacement(i.id, 'ticket_', '');
				
				if (_.empty($F(i))) {
					$(j + '_legend').addClassName('notice');
					err = true;
				} else {
					$(j + '_legend').removeClassName('notice');
				}
			});
			
			if (err) {
				return _.focus('ticket_create', skip.get());
			}
			
			return _.form.submit(f, _.form.error_or_go, false, true);
		}
	},
	cat: {
		select: function() {
			return _._toggle('ticket_cat', 'ticket_cat_div');
		},
		hide: function() {
			return _._toggle('ticket_cat_div', 'ticket_cat');
		},
		callback: function(t) {
			$('ticket_cat').update(t.responseText);
			return ticket.cat.hide();
		},
		click: function() {
			return _.call(_.config.read('u_update_cat'), ticket.cat.callback, {cat: _.form.selectedindex('cat_select')});
		},
		filter: function(e) {
			$('group_filter').list_observe(function(i) {
				_.go(_.replacement(_.config.read('u_group_filter'), '*', _.replacement(i.id, 'f_group_', '')));
			});
		}
	},
	status: {
		change: function(el) {
			return $(el).list_observe(ticket.status.click);
		},
		select: function() {
			return _._toggle('ticket_status', 'ticket_status_div');
		},
		hide: function() {
			return _._toggle('ticket_status_div', 'ticket_status');
		},
		callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = json_decode(response);
			
			$('status_' + ret.rm_id).removeClassName('active');
			$('status_' + ret.add_id).addClassName('active');
			
			if (ret.aid) {
				$('aid_' + ret.aid).removeClassName(ret.rm);
				$('aid_' + ret.aid).addClassName(ret.add);
			}
			
			return;
		},
		click: function(e) {
			return _.call(_.config.read('u_update_status'), ticket.status.callback, {ticket: _.config.read('v_ticket'), status: _.replacement(_.e(e).id, 'status_', '')});
		}
	},
	groups: {
		select: function() {
			return _._toggle('ticket_group', 'd_ticket_group');
		},
		hide: function() {
			return _._toggle('d_ticket_group', 'ticket_group');
		},
		callback: function(t) {
			$('ticket_group').update(t.responseText);
			return ticket.groups.hide();
		},
		click: function() {
			return _.call(_.config.read('u_update_group'), ticket.groups.callback, {group: _.form.selectedindex('ticket_group_select')});
		}
	},
	tech: {
		flag: false,
		watch: function() {
			return Try.these(function() {
				$$('#ticket_tech li').each(function(i) {
					$('a_remove' + _.replacement(i.id, 'ar', ''))._click(ticket.tech.remove);
				});
			});
		},
		first: function(u) {
			this.callback = function(t) {
				$('ticket_tech').update(t.responseText);
			}
			return _.call(u, this.callback, {ticket: _.config.read('v_ticket')});
		},
		toggle: function() {
			Element.toggle('ticket_tech_select');
			
			if (_.display('ticket_tech_select') != 'none') {
				return _._focus('a_tech');
			}
			return _.v('a_tech', '');
		},
		update: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			ticket.tech.toggle();
			return _.reload();
		},
		_remove: function() {
			_.li('ticket_tech').each(function(i) {
				if (_.empty(i.id) && !Object.isUndefined(i.id)) return;
				
				aid = 'a_rm_' + _.replacement(i.id, 'aid_', '');
				$(aid)._click(ticket.tech.remove);
			});
			
			return;
		},
		remove: function(e) {
			if (_confirm(_.config.read('l_remove_tech'))) {
				_el = _.replacement(_.e(e).id, 'a_rm_', '');
				_.call(_.config.read('u_tech_remove'), ticket.tech.remove_callback, {tech: _el});
			}
			return;
		},
		remove_callback: function(t) {
			$('aid_' + _el).unclick(ticket.tech.remove);
			Effect.DropOut('aid_' + _el);
			return;
		}
	},
	list: {
		watch: function() {
			Try.these(function() {
				$('view')._change(ticket.list.selectmode);
			});
			Try.these(function() {
				$('tickets').list_observe(ticket.list.go);
			});
			Try.these(function() {
				$('status_list').list_observe(ticket.list.status);
			});
			
			return;
		},
		go: function(e) {
			a = _.e(e);
			el = a.parentNode;
			if (el.id == 'tickets') el = a;
			
			if (_.empty(el.id)) el = el.parentNode;
			
			_.go(_.replacement(_.config.read('u_go'), '*', _.replacement(el.id, '_', '')));
			return;
		},
		status: function(e) {	
			return _.call(_.config.read('u_status'), _.form.error_or_go, {s: _.replacement(_.e(e).id, 'status_', '')});
		},
		sync: {
			call: function() {
				return;
			},
			callback: function() {
				
			}
		},
		selectmode: function(e) {
			a = _.e(e).value;
			Try.these(function() {
				chown = $F('ticket_chown');
				if (!_.empty(chown)) a = _.replacement(a, 'f:0', 'f:' + chown);
			});
			return _.go(a);
		}
	},
	group: {
		groups: [],
		
		contact: function(a) {
			if (!Object.isString(a)) {
				a = _.e(e).id;
			}
			return ticket.group.set('contacttype', a.replace(/group_/, ''));
		},
		add: function(a) {
			_.add(ticket.group.groups, a);
			return;
		},
		set: function(t, v) {
			ticket.group.groups.each(function(i) {
				f = (v == i) ? 'addClassName' : 'removeClassName';
				eval("$('group_' + i)." + f + "('selected');");
			});
			return _.v(t, v);
		}
	},
	_print: function(e) {
		Event.stop(e);
		
		return window.open(_.ga(_.e(e), 'href'));
	},
	remove: function(e) {
		Event.stop(e);
		
		if (!_confirm(_.config.read('g_ticket_remove'))) {
			return false;
		}
		
		_.call(_.config.read('u_ticket_remove'), ticket.remove_callback);
	},
	remove_callback: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		_.error.show(_.config.read('g_ticket_remove_notice'));
		
		return _.timeout(function() {
			_.go(_.config.read('u_ticket_list'));
		}, 3);
	},
	note: {
		toggle: function() {
			Element.toggle('ticket_note_box');
			if (_.display('note_text') != 'none') {
				_._focus('note_text');
			}
			return false;
		},
		child: function() {
			response = t.responseText;
			if (!response) {
				ticket.note.toggle();
				return;
			};
			if (_.error.has(response)) {
				return _.error.show(response);
			};
			
			return _.reload();
		},
		remove: function(u) {
			if (_confirm(_.config.read('l_remove_note'))) {
				this.callback = function(t) {
					$('noteid_' + t.responseText).remove();
				};
				_.call(u, this.callback);
			};
			return false;
		},
		send_callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			if (response == EE.OK) {
				Form.reset('form_add_note');
				return _.reload();
			}
			return false;
		},
		update: function(el, id, add) {
			if (el && id) {
				if (add) {
					$(el).value += add + id;
				} else {
					$(el).value = id;
				}
			}
			return;
		}
	}
}

var contacts = {
	members: {
		watch: function() {
			_.li('_list').each(function(i) {
				zv = _.ga(i, 'z');
				try { $('m_modify_' + zv)._click(contacts.members.modify); } catch (h) { }
				try { $('m_remove_' + zv)._click(contacts.members.remove); } catch (h) { }
			});
			return;
		},
		observe: function(i) {
			$(i)._click(contacts.members.insert);
		},
		startup: function(e) {
			$('contact_firstname').observe('keyup', contacts.members.nshow);
			$('contact_lastname').observe('keyup', contacts.members.nshow);
			
			$$('#form_contact .button').each(contacts.members.observe);
			_.focus('form_contact')
		},
		nshow: function(e) {
			_.v('contact_show', $F('contact_firstname') + ' ' + $F('contact_lastname'));
		},
		insert: function(e) {
			var err = false;
			$w('contact_firstname contact_lastname contact_show').each(function(i) {
				if (_.empty($F(i))) {
					err = true;
					return _.focus('form_contact');
				}
			});
			
			if (err) return;
			
			_.v('contact_type', _.replacement(_.e(e).id, 'group_', ''));
			return _.form.submit($('form_contact'), _.form.error_or_go, {submit: 1});
		},
		modify: function(e) {
			id = _.replacement(_.e(e).id, 'm_modify_', '');
			return _.call(_.config.read('u_edit'), contacts.members.modify_call, {a: _.config.read('v_uid'), field: _.encode(id)});
		},
		modify_call: function(t) {
			$('value_editing_update').update(t.responseText);
			$('value_editing').show();
			return;
		},
		modify_callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			if (response == EE.OK) {
				Effect.DropOut('value_editing');
				_.timeout(_.tab.refresh, 0.5);
			}
			return false;
		},
		modify_cancel: function() {
			Effect.DropOut('value_editing');
			return;
		},
		remove: function(e) {
			if (!_confirm(_.config.read('g_remove_confirm'))) {
				return;
			}
			el = _.e(e);
			id = _.replacement(el.id, 'm_remove_', '');
			
			return _.call(_.config.read('u_delete'), contacts.members.remove_callback, {uid: _.encode(_.config.read('v_uid')), el: _.encode(id)});
		},
		remove_callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			if (response == EE.OK) {
				Effect.DropOut(_.ga(el, 'alias'));
				_.timeout(_.tab.refresh, 0.5);
			}
			return false;
		}
	},
	auth: {
		observe: function(el) {
			return $(el).list_observe(contacts.auth.modify);
		},
		modify: function(e) {
			eid = _.e(e);
			if (_.empty(eid.id)) eid = _.parent(eid);
			
			arg = _.split(eid.id, '_');
			return _.call(_.config.read('u_auth_modify'), contacts.auth.modify_callback, {uid: arg[1], f: arg[2]});
		},
		modify_callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			if (response == EE.OK) {
				_.tab.refresh(1);
			}
			return false;
		},
		do_founder: function() {
			$('do_founder')._click(contacts.auth.do_founder_proc);
		},
		do_founder_proc: function() {
			return _.call(_.config.read('u_do_founder'), contacts.auth.do_founder_back);
		},
		do_founder_back: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			};
			return _.tab.refresh();
		}
	}
}

var u = {
	liviews: [],
	last_create: '',
	last_modify: '',
	is_refresh: false,
	
	watch: function(a) {
		return Try.these(function() {
			var is_liview = $(a).hasClassName('is_liview');
			b = _.replacement(a, a.substr(-1), '');
			
			switch (b) {
				case 'warranty':
					break;
				default:
					b = a;
					break;
			}
			
			_.li(a).each(function(i) {
				if (is_liview) {
					$(i.id)._click(u.liview);
				}
				
				re = _.split(i.id, '_');
				re.pop();
				_rj = re.join('_');
				
				if (_.config.read('a_' + b + '_modify')) {
					Try.these(function() { $(_rj + '_modify')._click(u.modify); });
				}
				
				if (_.config.read('a_' + b + '_remove')) {
					Try.these(function() { $(_rj + '_remove')._click(u.remove); });
				}
				
				switch (a) {
					case 'contact':
						Try.these(function() { $(_rj + '_' + b)._click(u.contact); });
						break;
				}
			});
		});
	},
	cancel: function(e) {
		_comp = _name + (!_.empty(_subtype) ? '_' + _subtype : '');
		formname = 'form_' + _comp + '_create';
		
		if (_.display(formname) != 'none') {
			Effect.DropOut(formname);
			
			Try.these(function() { $(_name + '_' + _type + '_cancel').unclick(u.cancel); });
			_.timeout(function() { $('button_' + _name + '_create').removeClassName('button_s'); }, 0.5);
			u.last_create = '';
		}
		else
		{
			Try.these(function() {
				Element.show(formname);
			});
			
			switch (_name) {
				case 'store':
					Try.these(function() {
						u.select_change();
						$('field_id')._change(u.select_change);
					});
					break;
			}
		}
		return;
	},
	button: function(e) {
		_this = _.e(e).id;
		_en = _.split(_this, '_');
		_type = _en.pop();
		_name = _en.pop();
		_subtype = '';
		
		if (_.len(_en) > 1) {
			_tmp = _en.pop();
			//_subtype = _name;
			_name = _tmp;
		}
		
		Try.these(function() {
			_in = _.form.find(e).getInputs('button');
			_in.each(function(i) {
				if (i.id == _this) {
					return;
				}
				
				_en2 = _.split(i.id, '_');
				_en2_type = _en2.pop();
				_en2_name = _en2.pop();
				
				_comp = ((_name != _en2_name) ? _en2_name + '_' : '') + _en2_type;
				
				Try.these(function() { $('form_' + _comp).hide(); });
				Try.these(function() { $('button_' + _comp).removeClassName('button_s'); });
			});
		});
		
		u.cancel();
		
		if (_.display('form_' + _name + '_create') != 'none') {
			if (!_.empty(u.last_create) && ('form_' + u.last_create + '_create' != 'form_' + _name + '_create')) {
				Effect.DropOut('form_' + u.last_create + '_create');
				Try.these(function() { $('button_' + u.last_create + '_create').removeClassName('button_s'); });
				Try.these(function() { $(u.last_create + '_create_cancel').unclick(u.cancel); });
				u.last_create = '';
			}
			
			Try.these(function() { $(_name + '_create_cancel')._click(u.cancel); });
			$('button_' + _name + '_create').addClassName('button_s');
			u.last_create = _name;
			
			_.form.first('form_' + _name + '_create');
		}
		return;
	},
	quick_button: function(e) {
		_this = _.e(e).id;
		_en = _.split(_this, '_');
		_type = _en.pop();
		_name = _en.pop();
		_subtype = '';
		
		if (_.len(_en) > 1) {
			_tmp = _en.pop();
			_subtype = _name;
			_name = _tmp;
		}
		
		_in = _.form.find(e).getInputs('button');
		_in.each(function(i) {
			if (i.id == _this) {
				return;
			}
			
			_en2 = _.split(i.id, '_');
			_en2_type = _en2.pop();
			_en2_name = _en2.pop();
			
			_comp = ((_name != _en2_name) ? _en2_name + '_' : '') + _en2_type;
			
			Try.these(function() { $('form_' + _comp).hide(); });
			Try.these(function() { $('button_' + _comp).removeClassName('button_s'); });
		});
		
		return _.call(_.config.read('u_' + _name + '_create'), u.quick_button_response, _.config.read('u_' + _name + '_create_arg'));
	},
	quick_button_response: function(t) {
		var response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		_comp = _name + (!_.empty(_subtype) ? '_' + _subtype : '');
		formname = _comp + '_buttons';
		
		switch (_comp)
		{
			case 'element':
				refsh = _.split(_.parent(formname, true), '_');
				refsh.pop();
				refsh.push('ls');
				
				u.liview_refresh(refsh.join('_'));
				break;
			default:
				_.timeout(_.tab.refresh, 0.5);
				break;
		}
		
		return;
	},
	selectbox_init: function() {
		_.li('_selectbox_in').each(function(i) {
			$(i)._click(u.selectbox);
		});
		return;
	},
	selectbox: function(e) {
		el = _.e(e);
		Event.stop(e);
		
		re = _.split(el.id, '_');
		re.pop();
		_name = re.pop();
		
		if (_name == 'assoc') {
			if ($('_selectbox')) {
				$('_selectbox').remove();
				return;
			}
			
			re.push('1');
		}
		
		return _.call(_.config.read('u_assoc_call'), u.selectbox_callback, filter_args(re));
	},
	selectbox_callback: function(t) {
		var response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		if (response == EE.OK) {
			if ($('_selectbox')) {
				$('_selectbox').remove();
			}
			return _.tab.refresh();
		}
		
		if (!$('_selectbox')) {
			box = Builder.node('div', {id: '_selectbox'});
			document.body.appendChild(box);
		}
		
		_a = $('button_assoc_create').cumulativeOffset();
		$('_selectbox').setStyle({top: _a[0] + 'px', left: (_a[1] + 20) + 'px'}).addClassName('selectbox').update(response);
		return;
	},
	liview: function(e) {
		el = _.e(e);
		if (_.low(el.tagName) != 'li') return;
		
		_parent = _.parent(el, true);
		
		re = _.split(el.id, '_');
		re.pop();
		re_ = re.join('_');
		
		if (!_.empty(_parent) && !_.empty(u.liviews[_parent])) {
			Try.these(function() { $(u.liviews[_parent] + '_pack').remove(); });
			Try.these(function() { $(u.liviews[_parent] + '_ls').removeClassName('relevant'); });
			
			rm_down = false;
			for (row in u.liviews)
			{
				if (Object.isString(u.liviews[row])) {
					if (_parent == row) {
						rm_down = true;
						continue;
					}
					
					if (rm_down) {
						u.liviews[row] = '';
					}
				}
			}
			
			tmp = u.liviews[_parent];
			u.liviews[_parent] = '';
			
			if (tmp == re_ && !u.is_refresh) {
				return;
			}
		}
		
		return _.call(_.config.read('u_' + _parent + '_view'), u.liview_callback, filter_args(re));
	},
	liview_callback: function(t) {
		var response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		if (!array_key(_.split(response, "\n"), 0).match(/_pack/)) {
			response = '<li id="' + re_ + '_pack" class="li_pack">' + response + '</li>';
		}
		
		$(el.id).insert_after(response).addClassName('relevant');
		u.liviews[_parent] = re_;
		
		return;
	},
	liview_refresh: function(d) {
		u.is_refresh = true;
		u.liview(d);
		u.is_refresh = false;
	},
	
	create_field: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		_comp = _name + (!_.empty(_subtype) ? '_' + _subtype : '');
		formname = 'form_' + _comp + '_create';
		
		switch (_comp) {
			default:
				Try.these(function() { $('button_' + _comp + '_create').removeClassName('button_s'); });
				Effect.DropOut(formname);
				break;
		}
		
		switch (_comp)
		{
			case 'names':
			case 'versions':
			case 'field':
			case 'store':
				_.timeout(function() {
					refsh = _.split(_.parent(formname, true), '_');
					
					refsh.pop();
					refsh.push('ls');
					
					u.liview_refresh(refsh.join('_'));
				}, 0.5);
				break;
			case 'brands':
			case 'types':
				_.timeout(_.reload, 0.5);
				break;
			default:
				_.timeout(_.tab.refresh, 0.5);
				break;
		}
		return;
	},
	
	select_change: function() {
		if (_.config.read('u_' + _name + '_query')) {
			_.call(_.config.read('u_' + _name + '_query'), u.select_change_callback, {f: _.form.selectedindex('field_id')});
		}
	},
	select_change_callback: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		response = _.replacement(response, 'w9', '');
		$('wait_' + _name + '_input').update(response);
	},
	
	modify: function(e) {
		el = _.e(e);
		
		if (!Object.isUndefined(_.config.read('s_redirect')) && !_.empty(_.ga(el, 'redirect'))) {
			return _.go(_.ga(el, 'redirect'));
		}
		
		near_li = _.parent(el);
		near_ul = _.parent(near_li, true);
		re = _.split(near_li.id, '_');
		near_ls = _.replacement(near_ul, near_ul.substr(-1), '');
		
		switch (near_ls) {
			case 'warranty':
				near_ul = near_ls;
				break;
		}
		
		return _.call(_.config.read('u_' + near_ul + '_modify'), u.modify_callback, filter_args(re));
	},
	modify_callback: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		_name = re[0];
		update_in = 'wait_' + _name + '_modify';
		
		$$('#form_' + _name + '_create').invoke('hide');
		$$('#form_' + _name + '_field_create').invoke('hide');
		
		if (!_.empty(u.last_modify) && u.last_modify != 'form_' + _name + '_modify') {
			Effect.DropOut(u.last_modify);
			u.last_modify = '';
		}
		
		u.last_modify = 'form_' + _name + '_modify';
		
		switch (_name) {
			case 'cat':
			case 'groups':
				var ret = json_decode(response);
				break;
		}
		
		switch (_name) {
			case 'cat':
				_.v('c_el', ret.id);
				_.v('c_name', _.entity_decode(ret.name));
				_.form._selectindex('c_group', ret.group);
				break;
			case 'groups':
				_.v('r_el', ret.id);
				_.v('r_name', _.entity_decode(ret.name));
				_.v('r_email', ret.email);
				_.v('r_mod', ret.mod);
				_.v('r_color', ret.color);
				break;
			default:
				$(update_in).update(response);
				break;
		}
		
		$('form_' + _name + '_modify').show().scrollTo();
		$('button_' + _name + '_modify').addClassName('button_s').show();
		
		$w('field value').each(function(i) {
			Try.these(function() {
				$('form_' + _name + '_' + i + '_create').hide();
				$('button_' + _name + '_' + i + '_create').removeClassName('button_s');
			});
		});
		
		Try.these(function() { $(_name + '_modify_cancel')._click(u.modify_cancel); });
		return;
	},
	modify_response: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		u.last_modify = '';
		_comp = near_ul;
		formname = 'form_' + _comp + '_modify';
		
		switch (_name) {
			case 'g':
				break;
			default:
				$('button_' + _name + '_modify').hide().removeClassName('button_s');
				Effect.DropOut(formname);
				break;
		}
		
		switch (_name)
		{
			case 'versions':
			case 'store':
				_.timeout(function() {
					refsh = _.split(_.parent(formname, true), '_');
					
					refsh.pop();
					refsh.push('ls');
					
					u.liview_refresh(refsh.join('_'));
				}, 0.5);
				break;
			case 'brands':
			case 'types':
				_.timeout(_.reload, 0.5);
				break;
			default:
				_.timeout(_.tab.refresh, 0.5);
				break;
		}
		
		return;
	},
	modify_cancel: function() {
		$('button_' + _name + '_modify').hide().removeClassName('button_s');
		Effect.DropOut('form_'+ _name + '_modify');
		u.last_modify = '';
		
		return;
	},
	remove: function(e) {
		if (!_confirm(_.config.read('g_remove_confirm'))) {
			return;
		}
		
		re = _.split(_.parent(_.e(e), true), '_');
		_name = re[0];
		
		return _.call(_.config.read('u_' + _name + '_remove'), u.remove_callback, filter_args(re));
	},
	remove_callback: function(t) {
		response = t.responseText;
		if (_.error.has(response))
		{
			return _.error.show(response);
		}
		
		switch (_name) {
			default:
				Effect.DropOut(_.glue(re, '_'));
		
				Try.these(function() {
					if (_.len(_.li('contact')) == 1) {
						_.reload();
					}
					
					Effect.DropOut(_.glue(v, '_'));
				});
				break;
		}
		
		switch (_name) {
			case 'types':
			case 'store':
			case 'assoc':
			case 'warranty':
				return;
				break;
			case 'brands':
				_.timeout(_.reload, 0.5);
				break;
			default:
				_.timeout(_.tab.refresh, 0.5);
				break;
		}
	}
}

var ul = {
	last_liview: [],
	last_create: '',
	last_modify: '',
	
	watch: function(a) {
		return Try.these(function() {
			switch (a) {
				case 'category': pfx = 'g'; break;
				case 'element': pfx = 'e'; break;
				case 'brands': pfx = 'b'; break;
				default: pfx = ''; break;
			}
			
			_.li(a).each(function(i) {
				row = _.split(i.id, '_');
				if (Object.isUndefined(row[2])) row[2] = row[1];
				
				if (_.inArray(a, $w('category components brands'))) {
					$(i.id)._click(ul.liview);
				}
				
				Try.these(function() { $(pfx + 'modify_' + row[2])._click(ul.modify); });
				Try.these(function() { $(pfx + 'remove_' + row[2])._click(ul.remove); });
				
				if (a == 'contact') {
					Try.these(function() { $(pfx + 'status_' + row[2])._click(ul.contact_status); });
				}
			});
		});
	},
	watch_f: function(e) {
		_sa = _.split(_.e(e).id, '_');
		_sa = _.replacement(_sa[0], 'b', '');
		switch (_sa) {
			case 'f': _sb = 'v'; break;
			case 'v': _sb = 'f'; break;
			default: _sb = _sa; break;
		}
		
		if (_sa != _sb) {
			Try.these(function() { $(_sa + '_edit').hide(); });
			Try.these(function() { $('b' + _sa + '_edit').removeClassName('button_s').hide(); });
			Try.these(function() { $(_sb + '_add').hide(); $('b' + _sb + '_add').removeClassName('button_s'); });
		}
		
		ul.watch_fx();
		if (_.display(_sa + '_add') != 'none') {
			if (!_.empty(ul.last_create) && ul.last_create + '_add' != _sa + '_add') {
				Effect.DropOut(ul.last_create + '_add');
				Try.these(function() { $(ul.last_create + 'x_add').unclick(ul.watch_fx); });
				//_.timeout(function() { $('b' + ul.last_create + '_add').removeClassName('button_s'); }, 0.5);
				ul.last_create = '';
			}
			
			Try.these(function() { $(_sa + 'x_add')._click(ul.watch_fx); });
			$('b' + _sa + '_add').addClassName('button_s');
			ul.last_create = _sa;
			
			_.form.first(_sa + '_add');
		};
		return;
	},
	watch_fx: function(e) {
		if (_.display(_sa + '_add') != 'none') {
			Effect.DropOut(_sa + '_add');
			Try.these(function() { $(_sa + 'x_add').unclick(ul.watch_fx); });
			_.timeout(function() { $('b' + _sa + '_add').removeClassName('button_s'); }, 0.5);
			ul.last_create = '';
		} else {
			Element.show(_sa + '_add');
			
			if (_sa == 'v') {
				Try.these(function() {
					$('field_id')._change(ul.v_add_change);
					ul.v_add_change();
				});
			}
		};
		return;
	},
	f_add: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		switch (_sa) {
			case 'c':
			case 'r':
				Effect.DropOut(_sa + '_add');
				$(_sa + '_add').reset();
				_.timeout(_.reload, 0.5);
				break;
			case 'g':
				this.callback = function(t) {
					$('prow_' + v[1] + '_' + v[2]).update(t.responseText);
				}
				_.call(_.config.read('u_view'), this.callback, {computer: v[1], el: v[2], next: 1});
				break;
			case 'e':
				z = _.split(response);
					
				$('erow_' + z[0] + '_' + z[1]).remove();
				ul.liview('grow_' + z[0] + '_' + z[1]);
				break;
			case 'b':
				if (response == EE.OK)
				{
					Effect.DropOut(_sa + '_add');
					_.timeout(_.reload, 0.5);
				}
				break;
			default:
				if (response == EE.OK) {
					Effect.DropOut(_sa + '_add');
					_.timeout(_.tab.refresh, 0.5);
				};
				break;
		}
		return false;
	},
	v_add_change: function() {
		switch (_.config.read('value_create_query')) {
			case 'contacts':
			case 'computer':
				_.call(_.config.read('u_av_query'), ul.v_add_callback, {f: _.form.selectedindex('field_id')});
				break;
			default:
				break;
		}
	},
	v_add_callback: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		response = _.replacement(response, 'w9', 'w6');
		$('v_add_input').update(response);
	},
	
	modify: function(e) {
		el = _.e(e);
		if (!Object.isUndefined(_.config.read('s_redirect')) && !_.empty(_.ga(el, 'redirect'))) {
			return _.go(_.ga(el, 'redirect'));
		}
		
		_v = _.parent(el);
		v = _.split(_v.id, '_');
		p = _.parent(_v, true);
		
		switch (p) {
			case 'components':
			case 'category':
			case 'cat':
			case 'groups':
			case 'element':
				param = {el: _.encode(v[2])};
				break;
			case 'brands':
				param = {el: _.encode(v[1])};
				break;
			case 'contacts':
				param = {a: _.encode(v[1]), field: _.encode(v[2])};
				break;
			default:
				param = {a: v[1], field: _.encode(v[3])};
				break;
		}
		
		return _.call(_.config.read('u_' + _.replacement(v[0], 'row', '') + 'edit'), ul.modify_h, param);
	},
	modify_h: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		switch (p) {
			case 'components':
			case 'cat':
				v_hide = 'c';
				break;
			case 'groups':
				v_hide = 'r';
				break;
			case 'category':
				v_hide = 'g';
				break;
			case 'element':
				v_hide = 'e';
				break;
			default:
				$$('#f_add').invoke('hide');
				v_hide = 'v';
				break;
		}
		
		$$('#' + v_hide + '_add').invoke('hide');
		
		if (!_.empty(ul.last_modify) && ul.last_modify != v_hide + '_edit') {
			Effect.DropOut(ul.last_modify);
			ul.last_modify = '';
		}
		
		ul.last_modify = v_hide + '_edit';
		
		if (p == 'cat' || p == 'groups') {
			var ret = json_decode(response);
		}
		
		switch (p) {
			case 'cat':
				_.v('c_el', ret.id);
				_.v('c_name', _.entity_decode(ret.name));
				_.form._selectindex('c_group', ret.group);
				break;
			case 'groups':
				_.v('r_el', ret.id);
				_.v('r_name', _.entity_decode(ret.name));
				_.v('r_email', ret.email);
				_.v('r_mod', ret.mod);
				_.v('r_color', ret.color);
				break;
			default:
				$(v_hide + '_update').update(response);
				break;
		}
		
		//$('tab_frame_' + tab_id).update(response);
		$(v_hide + '_edit').show().scrollTo();
		
		$('b' + v_hide + '_edit').addClassName('button_s').show();
		
		$w('f v c').each(function(i) {
			Try.these(function() { $(i + '_add').hide(); $('b' + i + '_add').removeClassName('button_s'); });
		});
		
		Try.these(function() { $(v_hide + 'x_edit')._click(ul.modify_x); });
		return false;
	},
	modify_c: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		if (v[3] == 'status') {
			e_response = _.split(response, '.');
			response = e_response[0];
			
			$('row_' + v[1]).removeClassName($('row_' + v[1]).classNames().grep(/^ticket_/)).addClassName(e_response[1]);
		}
		
		ul.last_modify = '';
		switch (v_hide) {
			case 'g':
				this.callback = function(t) {
					$(_.glue(z, '_')).update(t.responseText);
				};
				
				z = _.split($(p).parentNode.id, '_');
				_.call(_.config.read('u_view'), this.callback, {computer: z[1], el: z[2], next: 1});
				break;
			case 'c':
			case 'r':
				if (response == EE.OK) {
					$('b' + v_hide + '_edit').hide().removeClassName('button_s');
					Effect.DropOut(v_hide + '_edit');
					_.timeout(_.reload, 0.5);
				};
				break;
			default:
				if (response == EE.OK) {
					$('b' + v_hide + '_edit').hide().removeClassName('button_s');
					Effect.DropOut(v_hide + '_edit');
					_.timeout(_.tab.refresh, 0.5);
				};
				break;
		};
		return false;
	},
	modify_x: function() {
		$('b' + v_hide + '_edit').hide().removeClassName('button_s');
		Effect.DropOut(v_hide + '_edit');
		ul.last_modify = '';
		return;
	},
	remove: function(e) {
		if (!_confirm(_.config.read('g_remove_confirm'))) {
			return;
		}
		
		el = _.e(e);
		v = _.split(_.parent(el, true), '_');
		w = _.replacement(v[0], 'row', '');
		
		return _.call(_.config.read('u_' + w + 'delete'), ul.remove_c, {eid: v[1], el: v[2]});
	},
	remove_c: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		};
		
		switch (w) {
			case 'c':
			case 'r':
			case 'e':
				Effect.DropOut(_.glue(v, '_'));
				break;
			case 'g':
				this.callback = function(t) {
					$(_.glue(z, '_')).update(t.responseText);
				};
				
				z = _.split(el.parentNode.parentNode.parentNode.id, '_');
				_.call(_.config.read('u_view'), this.callback, {computer: z[1], el: z[2], next: 1});
				break;
			default:
				if (response == EE.OK) {
					Try.these(function() {
						if (_.len(_.li('contact')) == 1)
						{
							_.reload();
						}
					});
					
					Effect.DropOut(_.glue(v, '_'));
					_.timeout(_.tab.refresh, 0.5);
				};
				break;
		};
		return false;
	},
	contact_status: function(e) {
		this.callback = function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			if (response == EE.OK) {
				_.timeout(_.tab.refresh, 0.5);
			}
		}
		
		v = _.split(_.parent(_.e(e), true), '_');
		return _.call(_.config.read('u_contact_status'), this.callback, {eid: v[1], uid: v[2]});
	},
	
	member_c: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		Effect.DropOut('v_add');
		
		Try.these(function() {
			if (!$('contact') || !_.len(_.li('contact'))) {
				_.reload();
			}
		});
		
		_.timeout(_.tab.refresh, 0.5);
		return false;
	},
	
	liview: function(e) {
		el = _.e(e);
		if (_.low(el.tagName) != 'li') return;
		
		v = _.split(el.id, '_');
		v1 = _.replacement(v[0], 'row', '');
		
		switch (v1) {
			case 'e':
			case 'g':
				v2 = 'e';
				v4 = v1;
				break;
			case 'b':
				v2 = v4 = v1;
				v[2] = v[1];
				break;
			default:
				v2 = v4 = 'p';
				break;
		}
		v3 = (v2 == 'p') ? 'c': v4;
		
		try {
			$(v2 + 'row_' +  v[1] + '_' + v[2]).remove();
			$(el.id).removeClassName('relevant');
			try { Effect.DropOut(v3 + '_edit'); } catch (h) { }
			ul.last_liview[v2] = '';
			return;
		} catch (h) { }
		
		try {
			if (!_.empty(ul.last_liview[v2]) && ul.last_liview[v2] != el.id) {
				e_liview = _.split(ul.last_liview[v2], '_');
				f_liview = _.replacement(e_liview[0], 'row', '');
				e_liview[0] = _.replacement(e_liview[0], f_liview, '');
				j_liview = _.glue(e_liview, '_');
				
				switch (f_liview) {
					case 'g': s_liview = 'e'; break;
					default: s_liview = 'p'; break;
				}
				
				$(s_liview + j_liview).remove();
				$(f_liview + j_liview).removeClassName('relevant');
				Effect.DropOut(v3 + '_edit');
				ul.last_liview[v2] = '';
			}
		} catch (h) { }
		
		return _.call(_.config.read('u_' + v1 + 'view'), ul.liview_c, {computer: v[1], el: v[2]});
	},
	liview_c: function(t) {
		$(el.id).insert_after(t.responseText).addClassName('relevant');
		ul.last_liview[v2] = el.id;
		return;
	}
}

var chat = {
	last: 0,
	_timeout: 0,
	_timeout_bg: 0,
	_highlight: [],
	_namelist: [],
	_colors: [],
	_colors_count: [],
	_autofocus: false,
	_ul: 'contact_list',
	_row: 'list_',
	
	tab: {
		list: [],
		len: function() {
			return _.len(chat.tab.list);
		},
		push: function(u) {
			return chat.tab.list.push(u);
		},
		find: function(u) {
			var found = false;
			chat.tab.list.each(function(i) {
				if (u == i) {
					found = i;
					throw $break;
				}
			});
			return found;
		},
		pop: function(u) {
			chat.tab.list = chat.tab.list.without(u);
			return;
		},
		focus: function(uid) {
			Try.these(function() {
				if (chat.last) $(chat._row + chat.last).removeClassName('chat_ul_active');
			});
			
			$(chat._row + uid).addClassName('chat_ul_active');
			return _._focus('tab_input_' + uid);
		},
		first: function() {
			return (chat.tab.len() ? chat.tab.list.slice(0, 1) : 0);
		},
		_switch: function(a, b) {
			Try.these(function() {
				if (a) {
					$('tab_' + a).show();
				};
			});
			
			Try.these(function() {
				if (b) {
					$('tab_' + b).hide();
				};
			});
			
			return;
		}
	},
	call: function() {
		Try.these(function() {
			$('dd').remove();
		});
		
		return _.call(_.config.read('chat_update'), chat.refresh);
	},
	build: function(uid) {
		$w('tab tab_close tab_div tab_msg tab_send tab_input tab_submit').each(function(i) {
			eval('_' + i + ' = \'' + i + '_' + uid + '\';');
		});
		
		tab = Builder.node('div', {id: _tab, className: 'chat_tab'}, [
			Builder.node('span', {id: _tab_close, className: 'tab_close'}),
			Builder.node('div', {id: _tab_div, className: 'tab_div'}, [
				Builder.node('ul', {id: _tab_msg, className: 'tab_msg'})
			]),
			Builder.node('div', {id: _tab_send, className: 'tab_send'}, [
				Builder.node('div', {className: 'tab_send_pad'}, [
					Builder.node('input', {type: 'text', name: _tab_input, id: _tab_input, className: 'tab_input', autocomplete: false}),
					Builder.node('input', {type: 'submit', name: _tab_submit, id: _tab_submit, className: 'tab_submit', value: _.config.read('g_send')})
				])
			])
		]);
		$('chat_tabs').appendChild(tab);
		chat.tab.push(uid);
		
		$(_tab_close)._click(chat.quit);
		$(_tab_submit)._click(chat.submit);
		
		if (!Prototype.Browser.IE) {
			$(_tab_input)._keypress(chat.submit);
		}
		
		return $(tab);
	},
	start: function(e) {
		uid = _.replacement(_.e(e).id, chat._row, '');
		
		if (uid == chat.last) {
			return chat.tab.focus(uid);
		}
		
		if (chat.tab.find(uid) === false) {
			chat.build(uid);
			
			_.call(_.config.read('chat_create'), Prototype.EmptyFunction, {uid: _.encode(uid)});
		}
		
		chat.tab._switch(uid, chat.last);
		
		chat.highlight_off(uid);
		chat.tab.focus(uid);
		chat.scroll(uid);
		
		chat.last = uid;
		return;
	},
	refresh: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		var _this = json_decode(response);
		
		Try.these(function() {
			_this.connected.each(function(i) {
				if (!_.inArray(i.uid, chat._namelist)) {
					_.add(chat._namelist, i.uid);
					
					$(chat._ul).insert_bottom(Builder.node('li', {id: chat._row + i.uid}, _.entity_decode(i.fullname)));
				}
			});
			
			$(chat._ul).li_sort().list_observe(chat.start);
		});
		
		Try.these(function() {
			_nnone = 'namelist_none';
			
			if (_.len(chat._namelist)) {
				$(_nnone).remove();
			} else {
				if (!$(_nnone)) {
					$(chat._ul).insert_bottom(Builder.node('li', {id: _nnone}, _.entity_decode('No hay conectados.')));
				}
			}
		});
		
		Try.these(function() {
			_this.messages.each(function(i, j) {
				uid = i.from;
				
				if (chat.tab.find(uid) === false) {
					chat.build(uid);
					_.call(_.config.read('chat_create'), Prototype.EmptyFunction, {uid: _.encode(uid)});
				}
				
				if (uid != chat.last) {
					if (chat.last) {
						$('tab_' + uid).hide();
						chat.highlight_on(uid);
					} else {
						chat.tab.focus(uid);
						chat.scroll(uid);
						chat.last = uid;
					}
				}
				
				if (i.system) {
					i.message = '<span class="system">' + _.replacement(_.replacement(i.message, '{username}', i.username), '{datetime}', i.time) + '</span>';
				} else {
					i.message = '<span class="username" title="' + i.time + '">' + i.username + '</span>: ' + i.message;
				}
				
				if (Object.isUndefined(chat._colors_count[uid])) {
					chat._colors_count[uid] = 0;
				}
				
				if (Object.isUndefined(chat._colors[uid])) {
					chat._colors[uid] = [];
				}
				
				if (Object.isUndefined(chat._colors[uid][i.to])) {
					chat._colors_count[uid] = (chat._colors_count[uid] + 1);
					
					chat._colors[uid][i.to] = 'user' + (chat._colors_count[uid]);
				}
				
				$('tab_msg_' + uid).insert_bottom('<li class="' + chat._colors[uid][i.to] + '">' + i.message + '</li>');
				
				if (_.len(_.li('tab_msg_' + uid)) > _.config.read('chat_max')) {
					$($('tab_msg_' + uid).firstChild).remove();
				}
				
				chat.scroll(uid);
			});
		});
		
		// Retry refresh
		clearTimeout(chat._timeout);
		chat._timeout = _.timeout(chat.call, _.config.read('chat_time'));
		return;
	},
	submit: function(e) {
		_tab_submit = 'tab_submit_';
		_tab_input = 'tab_input_';
		
		uid = _.replacement(_.e(e).id, _tab_submit, '');
		
		if (_.h(uid, _tab_input)) {
			if (e.keyCode != Event.KEY_RETURN) return;
			
			uid = _.replacement(uid, _tab_input, '');
		};
		
		v_text = $F(_tab_input + uid);
		if (_.empty(v_text)) {
			return _._efocus(_tab_input + uid);
		}
		
		return _.call(_.config.read('chat_send'), chat.submit_callback, {msg: _.encode(v_text), uid: _.encode(uid)});
	},
	submit_callback: function(t) {
		var response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		uid = chat.last;
		clearTimeout(chat._timeout);
		chat.call();
		
		return _._efocus(_tab_input + uid);
	},
	scroll: function(uid) {
		$('tab_div_' + uid).scrollTop = $('tab_msg_' + uid).scrollHeight;
		return;
	},
	highlight_clear: function(uid) {
		return clearTimeout(chat._highlight[uid]);
	},
	highlight_on: function(uid, step) {
		step = (!step) ? 1 : 0;
		f = (step) ? 'add' : 'remove';
		
		eval('$(chat._row + uid).' + f + 'ClassName(\'chat_highlight\');');
		
		chat.highlight_clear(uid);
		chat._highlight[uid] = _.timeout(function() {
			chat.highlight_on(uid, step);
		}, 0.5);
		
		return;
	},
	highlight_off: function(uid) {
		chat.highlight_clear(uid);
		$(chat._row + uid).removeClassName('chat_highlight');
	},
	quit: function(e) {
		uid = _.replacement(_.e(e).id, 'tab_close_', '');
		
		_.call(_.config.read('chat_quit'), chat.quit_callback, {uid: _.encode(uid)});
	},
	quit_callback: function(t) {
		var response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		var ret = json_decode(response);
		
		// Unload observers
		$('tab_close_' + ret.uid).unclick(chat.quit);
		$('tab_submit_' + ret.uid).unclick(chat.submit);
		
		if (!Prototype.Browser.IE) {
			$('tab_input_' + ret.uid).unkeypress(chat.submit);
		}
		
		$('tab_' + ret.uid).remove();
		chat.tab.pop(ret.uid);
		$(chat._row + ret.uid).removeClassName('chat_ul_active');
		
		Try.these(function() {
			uid = chat.tab.first();
			if (uid) {
				chat.start(chat._row + uid);
			}
		});
		
		return;
	},
	background: function() {
		return _.call(_.config.read('chat_background'), chat.background_cb, {time: _.config.read('chat_bglast')});
	},
	background_cb: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		//
		clearTimeout(chat._timeout_bg);
		chat._timeout_bg = _.timeout(chat.background, _.config.read('chat_bgtime'));
		
		return;
	}
}