var EE = {
	OK: '~[200]'
};

$(function() {
	$('#e_notice').hide();
});

$.extend({
	k: function(a) {
		return $.ui.keyCode[a]; 
	},
	len: function(a) {
		return $(a).length;
	},
	skip: {
		list: [],
		
		get: function() {
			return $.skip.list;
		},
		add: function(a) {
			$w(a).each(function() { $.skip.list.push(this); });
			
			return this;
		},
		rm: function(a) {
			$w(a).each(function(i, el) {
				var item = -2;
				$.each($.skip.list, function(i, v) {
					if (v[0] == el) { item = i; }
				});
				
				if (item > -2) $.skip.list.splice(item, 1);
			});
			
			return this;
		},
		clear: function() {
			$.skip.list = [];
			
			return this;
		}
	}
});

$.fn.extend({
	clear: function() {
		return this.each(function() {
			var type = this.type, tag = this.tagName.toLowerCase();
			if (tag == 'form') {
				return $(':input', this).clear();
			}
			
			if (type == 'text' || type == 'password' || tag == 'textarea') {
				this.value = '';
			} else if (type == 'checkbox' || type == 'radio') {
				this.checked = false;
			} else if (tag == 'select') {
				this.selectedIndex = -1;
			}
		});
	},
	visible: function() {
		return $(this).is(':visible');
	},
	_toggle: function(s) {
		$(this).hide();
		$(s).show();
		
		return this;
	},
	scroll: function() {
		$.scrollTo(this);
		return this;
	},
	fixed: function() {
		this.addClass('fixed');
		return this;
	},
	unfixed: function() {
		this.removeClass('fixed');
		return this;
	},
	calendar: function() {
		Calendar.setup({dateField: this});
		this.attr('readonly', true);
		return this;
	},
	selectindex_t: function(i) {
		_.form.selectindex(this, i);
		return this;
	},
	selectindex_v: function(i) {
		_.form._selectindesx(this, i);
		return this;
	},
	list_observe: function(f) {
		$(this).click(function(e) {
			var $t = $(e.target);
			
			if ($t.is('div')) {
				$t = $t.closest('li');
			}
			
			if ($t.is('li')) {
				id = $t.attr('id');
				if (!id) return;
				
				return f($t);
			}
		});
		return this;
	},
	timeout: function(f, t) {
		e = this;
		_.timeout(function() {
			eval('e.' + f + '();');
		}, t);
		return this;
	}
});

var _ = {
	aconfig: [],
	extend_skip: [],
	calltime: 0,
	calltime_count: 0,
	
	timeout: function(cmd, s) {
		return setTimeout(cmd, (s * 1000));
	},
	pn: function(e) {
		return e.parentNode;
	},
	e: function(e) {
		return Try.these(
			function() { return e.target; },
			function() { return $(e); }
		) || e;
	},
	parent: function(e, r) {
		e = _.pn(e);
		
		while (e.id == '') {
			e = _.pn(e);
		};
		
		return (r) ? e.id : e;
	},
	ga: function(el, k) {
		return $(el).attr(k);
	},
	sa: function(el, k, v) {
		return $(el).attr(k, v);
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
		$(s).each(function(i) {
			a += ((i) ? g : '') + this;
		});
		return a;
	},
	replacement: function(s, a, b) {
		return s.replace(a, b);
	},
	inArray: function(needle, haystack, strict) {
		var s = '==' + ((strict) ? '=' : '');
		var r = false;
		
		$(haystack).each(function() {
			eval('cmp = (needle ' + s + ' this) ? true : false;');
			if (cmp) {
				r = true;
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
	call: function(addr, callback, arg, show_wait) {
		if (!addr) return false;
		
		if (!Object.isObject(arg)) {
			arg = {};
		}
		arg.ghost = 1;
		
		var ret = $.ajax({
			url: addr,
			type: "POST",
			data: arg,
			dataType: "text",//html json xml 
			async:true,
			
			beforeSend: function(t) {
				_.call_lapsed();
				
				if (show_wait) {
					_.call_notify();
				}
				return true;
			},
			error: function(t) {
				_.call_lapsed_stop();
				
				response = t.statusText;
				if (response == 'Not Found') {
					response = _.config.read('g_not_found');
				}
				
				return _.error.show(response);
			},
			dataFilter: function(t) {},
			success: function(_ua,_ub,t) {
				_.call_lapsed_stop();
				
				if (show_wait) {
					_.call_notify_close();
				}
				
				return callback(t);
			},
			complete: function() {}
		});
		
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
			$('#notifybar_legend').html(g_proc_legend);
			$('#notifybar').show();
		}
		return false;
	},
	call_notify_close: function() {
		$('#notifybar').hide();
		return false;
	},
	fp: function(a, b) {
		response = [];
		a.each(function(i) {
			var d = this;
			if (!Object.isUndefined(b[i])) {
				d = b[i];
			}
			response[z] = ($(d)) ? _.encode($F(d)) : '';
		});
		return response;
	},
	v: function(el, v, a) {
		return Try.these(function() {
			if (a && $F(el)) {
				v = $F(el) + a + v;
			}
			$(el).val(v);
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
		$('#search-box').show();
		
		Try.these(function() {
			computer.search.focus();
		});
		
		return;
	},
	observe: function(e) {
		$(this).click(function() { _.clear(e) });
		return;
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
	li: function(a) {
		return $(a).children('li');
	},
	focus: function(el, sf) {
		if (!sf) sf = [];
		
		first = false;
		$(':input(:text,:password)', el).each(function() {
			_skp = false;
			for (var j = 0, end = $(sf).size(); j < end; j++) {
				if (sf[j] == this.id && !_skp) _skp = true;
			}
			
			if (_skp) return;
			
			if (!$(this).val() && !first) {
				first = true;
				$(this).focus();
			}
		});
		
		return false;
	},
	form: {
		numbers: function(e) {
			var key, keyr;
			
			key = Try.these(
				function() { return window.event.keyCode; },
				function() { return e.which; }
			) || true;
			if (key === true) {
				return key;
			}
			
			keyr = String.fromCharCode(key);
			allkey = [0, $.k('BACKSPACE'), $.k('TAB'), $.k('ENTER'), $.k('ESCAPE')];
			
			if ((key == null) || _.inArray(key, allkey) || (keyr == '.' && !_.h($F(_.e(e)), '.')) || (("0123456789").indexOf(keyr) > -1)) {
				return true;
			}
			
			return e.preventDefault();
		},
		submit: function(f, callback, a_args, show_wait) {
			_f = $(f).attr('id');
			
			if (!this.isEmpty(f, ':hidden,:file')) return false;
			
			_.form.checkbox(f, ':hidden,:file');
			
			arg = {};
			$(':input', f).each(function(j) {
				if (!this.name) return;
				
				var av = this.value;
				if ($(this).is(':checkbox') && !this.checked) {
					av = '';
				}
				
				if (_.h(this.name, '[')) {
					this.name = _.replacement(this.name, '[]', '[' + j + ']');
				}
				
				arg[this.name] = _.encode(av);
				
				if ($.isPlainObject(a_args)) {
					$.extend(arg, a_args);
				};
			});
			
			return _.call($(f).attr('action'), callback, arg, show_wait);
		},
		complete: function(t) {
			var response = t.responseText;
			err = false;
			
			if (_.error.has(response)) {
				err = true;
				_.error.show(response);
			}
			
			$(':input', f).each(function(j) {
				if (this.name && !_.input.type(this, 'submit')) {
					if (!err) _.v(this, '');
					
					if (_.input.type(this, 'text') && !j) $(this).focus();
				}
			});
			return false;
		},
		event: function(e) {
			$(e).preventDefault();
			return _.form.find(e);
		},
		find: function(e) {
			return $(e).closest('form');
		},
		required: function(f) {
			return $('.required', f);
		},
		tab: function(f) {
			$(f).filter(':input:not(:hidden)').each(function() {
				this.keypress(_.form.tab_key);
			});
			return;
		},
		tab_key: function(e) {
			if (e.keyCode != $.ui.keyCode.RETURN) return;
			
			f = _.form.find(e);
			r = _.form.required(f);
			e = _.e(e);
			_focus = false;
			
			$(':input', f).each(function() {
				if (_.input.type(this, 'hidden')) {
					return;
				}
				
				if (_focus) {
					fthis = this;
					r.each(function(j) {
						if (fthis.id == j.id) {
							$(fthis).focus();
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
		isEmpty: function(f, st) {
			err = false;
			
			$(':input' + _input(st), f).each(function(i) {
				if (!$(this).val() && !_.inArray(this.name, $.skip.get())) {
					if (!err) $(this).focus();
					
					err = true;
				}
			});
			
			return !err;
		},
		first: function(el) {
			a = false;
			$(':input', el).each(function() {
				if (this.type == 'hidden' || this.disabled) {
					return;
				}
				
				if (!a) $(this).focus();
				
				a = true;
			});
			return;
		},
		changed: function(f) {
			response = false;
			$w(f).each(function() {
				if ($(this) && !_.empty(_.trim($F(this)))) {
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
				var a = $(_.e(e)).children('option');
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
				
				formname = '#g_form_' + el;
				inputname = '#g_case_' + el;
				submitname = '#g_submit_' + el;
				
				if (_.form.selectedindex(el) == 'option_' + el) {
					formaction = _.config.read('ds_' + el) || _.config.read('global_dynamic_select');
					
					/*$(el).insert_after(Builder.node('form', {method: 'post', id: formname, action: formaction}, [
						Builder.node('input', {type: 'text', class: 'in', size: 25, id: inputname, name: 'case'}),
						Builder.node('input', {type: 'submit', class: 'bt', id: submitname, name: 'submit', value: 'Guardar'})
					]));*/
					
					$(formname).addClass('m_top_mid gform').submit(function(_e) {
						e.preventDefault();
						return _.form.submit($(formname), _.config.read('f_' + el), {is: el});
					});
					
					return $(inputname).focus();
				}
				
				$('#' + formname).remove();
				
				if ('#' + _.config.read('n_' + el)) {
					$('#' + _.config.read('n_' + el)).focus();
				};
				return;
			}
		},
		checkbox: function(f, a) {
			return Try.these(function() {
				$('input' + _input(a), f).each(function(i) {
					if (!this.name) return;
					
					if (_.input.type(this, 'checkbox') && !this.checked) {
						this.checked = true;
						this.value = 0;
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
			$w(k).each(function() {
				el_type = _.input._type(el);
				
				eval('cmp = (el_type ' + sign + ' this);');
				if (cmp) {
					result = true;
					throw $break;
				}
			});
			return result;
		},
		replace: function(f, v) {
			f.each(function() {
				if ($F(this) == null) {
					_.v(this, v);
				}
			});
			return;
		},
		empty: function(a) {
			if (!a) a = '#stext';
			
			if (!$(a).val()) {
				return $(a).focus();
			}
			return true;
		},
		option: function(a) {
			$('.' + a).each(function() {
				$(this).click(_.input.option_callback);
			});
		},
		option_callback: function(e) {
			e = $(_.e(e));
			a = array_key(_.split(Object.toHTML(e.hasClass()), ' '), 0);
			
			$('.' + a).each(function() {
				if (e.id === this.id)
				{
					_.v(_.replacement(a, 'sf_option_', ''), _.replacement(this.id, 'option_', ''));
					$(this).addClass('sf_selectd');
				} else {
					$(this).removeClass('sf_selectd');
				}
			});
			return;
		},
		select: {
			clear: function(e) {
				return $('#' + e + ' option').remove();
			}
		}
	},
	config: {
		store: function(k, v, f) {
			if (f === true) {
				_.extend_skip[k] = true;
			}
			
			if (Object.isObject(k)) {
				$.extend(_.aconfig, k);
			} else {
				eval('$.extend(_.aconfig, {' + k + ': v})');
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
			
			all = '';
			_.error.list = [];
			
			if (_.error.has(a)) a = a.substr(1);
			
			$(_.split(a, '$')).each(function() {
				if (!_.empty(this)) _.add(_.error.list, this);
			});
			
			$(_.error.list).each(function() {
				all += '<li>' + this + '</li>';
			});
			
			_.notice('<ul class="ul_none">' + all + '</ul>');
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
		observe: function() {
			$(this).filter('li').each(function() {
				_.add(_.tab.ary, _.replacement(this.attr('id'), 'row_', ''));
			});
			
			$(this).click(function(e) {
				var $t = $(e.target);
				if ($t.is('li')) _.tab.click($t);
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
				
				$w(_.config.read('xtab_tags')).each(function() {
					$('#tab_' + this + '_' + tab_id).click(_.tab.z);
				});
				
				_.tab.z('tab_general_' + tab_id);
			}
			return;
		},
		remove: function(el, i) {
			$w(_.config.read('xtab_tags')).each(function() {
				$('#tab_' + this + '_' + i).unbind('click', _.tab.z);
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
			
			$('#tab_frame_' + tab_id).html(response);
			
			switch (_scr) {
				case 1:
					document.documentElement.scrollTop = prev_scrolltop;
					break;
				default:
					$.scrollTo('#tab_frame_' + tab_id);
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
		$('#e_notice').html(a).show().scroll().timeout('hide', b || 5);
	}
}

var ticket = {
	create: {
		attachment: [],
		startup: function() {
			f = 'ticket_create';
			_.form.tab(f);
			
			$('#file_upload').uploadify({
				'uploader'       : 'SPATH/f/uploadify.swf',
				'script'         : 'SPATH/f/uploadify.php',
				'cancelImg'      : 'SPATH/f/cancel.png',
				'folder'         : '/uploads',
				'multi'          : true,
				'auto'           : true,
				'fileExt'        : '*.jpg;*.gif;*.png',
				'fileDesc'       : 'Image Files (.JPG, .GIF, .PNG)',
				'queueID'        : 'file-queue',
				'queueSizeLimit' : 2,
				'simUploadLimit' : 2,
				'removeCompleted': false,
				'buttonText': 'Adjuntar archivos',
				'onCancel'       : function(event,ID,obj,response, data) {
					var item = -2;
					var ov = $('#' + ID + '_file').text();
					
					$.each(ticket.create.attachment, function(i, v) {
						if (v == ov) item = i;
					});
					
					if (item > -2) ticket.create.attachment.splice(item, 1);
					
					return true;
				},
				'onSelect'       : function(event, ID, obj, response, data) {
					processed = true;
					if (_.inArray(obj.name, ticket.create.attachment)) {
						$('#file_upload').uploadifyCancel(ID);
						processed = false;
						
						_.error.show('El archivo ' + obj.name + ' ya se encuentra adjunto.');
						
						return false;
					}
					return true;
				},
				'onComplete'     : function(event, ID, obj, response, data) {
					if (processed) {
						_.add(ticket.create.attachment, obj.name);
					}
				},
				'onAllComplete'  : function(event,data) {
					$('#attachments').val(ticket.create.attachment.join(','))
				}
			});
			
			return;
		},
		username: function() {
			$('#d_username').toggle();
			return ticket.create.username_f();
		},
		username_f: function() {
			v_skp = 'ticket_username';
			
			if ($('#d_username').visible()) {
				$.skip.rm(v_skp);
			} else {
				$.skip.add(v_skp);
				_.v(v_skp, '');
			}
			return _.focus('#ticket_create', $.skip.get());
		},
		submit: function(e) {
			var e = _.e(e);
			var f = _.form.find(e);
			var x = false;
			
			$('#ticket_group').val(_.replacement(e.id, 'group_', ''));
			
			_.form.required(f).each(function(i) {
				j = _.replacement(this.id, 'ticket_', '');
				
				if (!$(this).val()) {
					$('#' + j + '_legend').addClass('notice');
					x = true;
				} else {
					$('#' + j + '_legend').removeClass('notice');
				}
			});
			
			if (x) return _.focus(f, $.skip.get());
			
			return _.form.submit(f, _.form.error_or_go, false, true);
		},
		submit_files: function() {
			$('#files').fileUploadStart();
			$('#files').fileUploadClearQueue();
		}
	},
	cat: {
		select: function() {
			return $('#ticket_cat')._toggle('#ticket_cat_div');
		},
		hide: function() {
			return $('#ticket_cat_div')._toggle('#ticket_cat');
		},
		callback: function(t) {
			$('#ticket_cat').html(t.responseText);
			return ticket.cat.hide();
		},
		click: function() {
			return _.call(_.config.read('u_update_cat'), ticket.cat.callback, {cat: $('#cat_select').val()});
		},
		filter: function(e) {
			$('#group_filter').list_observe(function(i) {
				_.go(_.replacement(_.config.read('u_group_filter'), '*', _.replacement(i.attr('id'), 'f_group_', '')));
			});
		}
	},
	status: {
		change: function(el) {
			return $(el).list_observe(ticket.status.click);
		},
		select: function() {
			return $('#ticket_status')._toggle('#ticket_status_div');
		},
		hide: function() {
			return $('#ticket_status_div')._toggle('#ticket_status');
		},
		callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			var ret = $.evalJSON(response);
			
			$('#status_' + ret.rm_id).removeClass('active');
			$('#status_' + ret.add_id).addClass('active');
			
			if (ret.aid) {
				$('#aid_' + ret.aid).removeClass(ret.rm);
				$('#aid_' + ret.aid).addClass(ret.add);
			}
			
			return;
		},
		click: function(e) {
			return _.call(_.config.read('u_update_status'), ticket.status.callback, {ticket: _.config.read('v_ticket'), status: _.replacement(_.e(e).attr('id'), 'status_', '')});
		}
	},
	groups: {
		select: function() {
			return $('#ticket_group')._toggle('#d_ticket_group');
		},
		hide: function() {
			return $('#d_ticket_group')._toggle('#ticket_group');
		},
		callback: function(t) {
			$('#ticket_group').html(t.responseText);
			return ticket.groups.hide();
		},
		click: function() {
			return _.call(_.config.read('u_update_group'), ticket.groups.callback, {group: $('#ticket_group_select').val()});
		}
	},
	tech: {
		flag: false,
		watch: function() {
			return Try.these(function() {
				$('#ticket_tech li').each(function() {
					$('#a_remove' + _.replacement(this.id, 'ar', '')).click(ticket.tech.remove);
				});
			});
		},
		first: function(u) {
			this.callback = function(t) {
				$('#ticket_tech').html(t.responseText);
			}
			return _.call(u, this.callback, {ticket: _.config.read('v_ticket')});
		},
		toggle: function() {
			$('#ticket_tech_select').toggle();
			
			if ($('ticket_tech_select').visible()) {
				return $('#a_tech').focus();
			}
			return $('#a_tech').val('');
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
			_.li('ticket_tech').each(function() {
				if (_.empty(this.id) && !Object.isUndefined(this.id)) return;
				
				aid = '#a_rm_' + _.replacement(this.id, 'aid_', '');
				$(aid).click(ticket.tech.remove);
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
			return $('#aid_' + _el).hide().unbind('click', ticket.tech.remove);
		}
	},
	list: {
		watch: function() {
			Try.these(function() {
				$('#view').change(ticket.list.selectmode);
			});
			Try.these(function() {
				$('#tickets').list_observe(ticket.list.go);
			});
			Try.these(function() {
				$('#status_list').list_observe(ticket.list.status);
			});
			
			return;
		},
		go: function(e) {
			a = _.e(e);
			el = a.parent();
			
			if (el.attr('id') == 'tickets') el = a;
			
			if (_.empty(el.attr('id'))) el = _.pn(el);
			
			return _.go(_.replacement(_.config.read('u_go'), '*', _.replacement(el.attr('id'), '_', '')));
		},
		status: function(e) {
			return _.call(_.config.read('u_status'), _.form.error_or_go, {s: _.replacement(_.e(e).attr('id'), 'status_', '')});
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
			$('#' + ticket.group.groups).each(function() {
				f = (v == this) ? 'addClass' : 'removeClass';
				eval("$('#group_' + i)." + f + "('selected');");
			});
			return _.v(t, v);
		}
	},
	_print: function(e) {
		e.preventDefault();
		
		return window.open(_.ga(_.e(e), 'href'));
	},
	remove: function(e) {
		e.preventDefault();
		
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
			$('#ticket_note_box').toggle();
			if ($('#note_text').visible()) {
				$('#note_text').focus();
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
					$('#noteid_' + t.responseText).remove();
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
				$('#form_add_note').clear();
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
			_.li('_list').each(function() {
				zv = _.ga(this, 'z');
				try { $('#m_modify_' + zv).click(contacts.members.modify); } catch (h) { }
				try { $('#m_remove_' + zv).click(contacts.members.remove); } catch (h) { }
			});
			return;
		},
		observe: function(i) {
			$(i).click(contacts.members.insert);
		},
		startup: function(e) {
			$('#contact_firstname').keyup(contacts.members.nshow);
			$('#contact_lastname').keyup(contacts.members.nshow);
			
			$('#form_contact .button').each(contacts.members.observe);
			_.focus('form_contact');
		},
		nshow: function(e) {
			_.v('contact_show', $F('contact_firstname') + ' ' + $F('contact_lastname'));
		},
		insert: function(e) {
			var err = false;
			$w('contact_firstname contact_lastname contact_show').each(function() {
				if (_.empty($F(this))) {
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
			$('#value_editing_update').html(t.responseText);
			$('#value_editing').show();
			return;
		},
		modify_callback: function(t) {
			response = t.responseText;
			if (_.error.has(response)) {
				return _.error.show(response);
			}
			
			if (response == EE.OK) {
				$('#value_editing').hide();
				_.timeout(_.tab.refresh, 0.5);
			}
			return false;
		},
		modify_cancel: function() {
			$('#value_editing').hide();
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
				$('#' + _.ga(el, 'alias')).hide();
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
			$('#do_founder').click(contacts.auth.do_founder_proc);
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
			var is_liview = $(a).hasClass('is_liview');
			b = _.replacement(a, a.substr(-1), '');
			
			switch (b) {
				default:
					b = a;
					break;
			}
			
			_.li(a).each(function() {
				if (is_liview) {
					$(this.id).click(u.liview);
				}
				
				re = _.split(this.id, '_');
				re.pop();
				_rj = re.join('_');
				
				if (_.config.read('a_' + b + '_modify')) {
					Try.these(function() { $('#' + _rj + '_modify').click(u.modify); });
				}
				
				if (_.config.read('a_' + b + '_remove')) {
					Try.these(function() { $('#' + _rj + '_remove').click(u.remove); });
				}
				
				switch (a) {
					case 'contact':
						Try.these(function() { $('#' + _rj + '_' + b).click(u.contact); });
						break;
				}
			});
		});
	},
	cancel: function(e) {
		_comp = _name + (!_.empty(_subtype) ? '_' + _subtype : '');
		formname = '#form_' + _comp + '_create';
		
		if ($(formname).visible()) {
			$(formname).hide();
			
			Try.these(function() {
				$('#' + _name + '_' + _type + '_cancel').unbind('click', u.cancel);
			});
			
			_.timeout(function() {
				$('#button_' + _name + '_create').removeClass('button_s');
			}, 0.5);
			u.last_create = '';
		}
		else
		{
			$(formname).show();
			
			switch (_name) {
				case 'store':
					Try.these(function() {
						u.select_change();
						$('#field_id').change(u.select_change);
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
		
		if ($(_en).len() > 1) {
			_tmp = _en.pop();
			//_subtype = _name;
			_name = _tmp;
		}
		
		Try.these(function() {
			$(e).closest('form').filter(':button').each(function() {
				if (this.id == _this) {
					return;
				}
				
				_en2 = _.split(this.id, '_');
				_en2_type = _en2.pop();
				_en2_name = _en2.pop();
				
				_comp = ((_name != _en2_name) ? _en2_name + '_' : '') + _en2_type;
				
				Try.these(function() {
					$('#form_' + _comp).hide();
				});
				
				Try.these(function() {
					$('#button_' + _comp).removeClass('button_s');
				});
			});
		});
		
		u.cancel();
		
		if ($('#form_' + _name + '_create').visible()) {
			if (!_.empty(u.last_create) && ('form_' + u.last_create + '_create' != 'form_' + _name + '_create')) {
				$('#form_' + u.last_create + '_create').hide();
				Try.these(function() {
					$('#button_' + u.last_create + '_create').removeClass('button_s');
				});
				Try.these(function() {
					$('#' + u.last_create + '_create_cancel').unbind('click', u.cancel);
				});
				u.last_create = '';
			}
			
			Try.these(function() { $('#' + _name + '_create_cancel').click(u.cancel); });
			$('#button_' + _name + '_create').addClass('button_s');
			u.last_create = _name;
			
			_.form.first('#form_' + _name + '_create');
		}
		return;
	},
	quick_button: function(e) {
		_this = _.e(e).id;
		_en = _.split(_this, '_');
		_type = _en.pop();
		_name = _en.pop();
		_subtype = '';
		
		if ($(_en).len() > 1) {
			_tmp = _en.pop();
			_subtype = _name;
			_name = _tmp;
		}
		
		$(e).closest('form').filter(':button').each(function() {
			if (this.id == _this) {
				return;
			}
			
			_en2 = _.split(this.id, '_');
			_en2_type = _en2.pop();
			_en2_name = _en2.pop();
			
			_comp = ((_name != _en2_name) ? _en2_name + '_' : '') + _en2_type;
			
			Try.these(function() { $('#form_' + _comp).hide(); });
			Try.these(function() { $('#button_' + _comp).removeClass('button_s'); });
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
		_.li('_selectbox_in').each(function() {
			$(this).click(u.selectbox);
		});
		return;
	},
	selectbox: function(e) {
		el = _.e(e);
		e.preventDefault();
		
		re = _.split(el.id, '_');
		re.pop();
		_name = re.pop();
		
		if (_name == 'assoc') {
			if ($('#_selectbox')) {
				$('#_selectbox').remove();
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
			if ($('#_selectbox')) {
				$('#_selectbox').remove();
			}
			return _.tab.refresh();
		}
		
		if (!$('#_selectbox')) {
			box = Builder.node('div', {id: '_selectbox'});
			document.body.appendChild(box);
		}
		
		_a = $('#button_assoc_create').cumulativeOffset();
		$('#_selectbox').css({top: _a[0] + 'px', left: (_a[1] + 20) + 'px'}).addClass('selectbox').html(response);
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
			Try.these(function() { $('#' + u.liviews[_parent] + '_pack').remove(); });
			Try.these(function() { $('#' + u.liviews[_parent] + '_ls').removeClass('relevant'); });
			
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
		
		$(el).insert_after(response).addClass('relevant');
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
				Try.these(function() { $('#button_' + _comp + '_create').removeClass('button_s'); });
				$(formname).hide();
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
		$('#wait_' + _name + '_input').html(response);
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
		
		$('#form_' + _name + '_create').hide();
		$('#form_' + _name + '_field_create').hide();
		
		if (!_.empty(u.last_modify) && u.last_modify != 'form_' + _name + '_modify') {
			$(u.last_modify).hide();
			u.last_modify = '';
		}
		
		u.last_modify = 'form_' + _name + '_modify';
		
		switch (_name) {
			case 'cat':
			case 'groups':
				var ret = $.evalJSON(response);
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
				$(update_in).html(response);
				break;
		}
		
		$('#form_' + _name + '_modify').show();
		$.scrollTo('#form_' + name + '_modify');
		$('#button_' + _name + '_modify').addClass('button_s').show();
		
		$w('field value').each(function() {
			Try.these(function() {
				$('#form_' + _name + '_' + this + '_create').hide();
				$('#button_' + _name + '_' + this + '_create').removeClass('button_s');
			});
		});
		
		Try.these(function() { $('#' + _name + '_modify_cancel').click(u.modify_cancel); });
		return;
	},
	modify_response: function(t) {
		response = t.responseText;
		if (_.error.has(response)) {
			return _.error.show(response);
		}
		
		u.last_modify = '';
		_comp = near_ul;
		formname = '#form_' + _comp + '_modify';
		
		switch (_name) {
			case 'g':
				break;
			default:
				$('#button_' + _name + '_modify').hide().removeClass('button_s');
				$(formname).hide();
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
		$('#button_' + _name + '_modify').hide().removeClass('button_s');
		$('#form_'+ _name + '_modify').hide();
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
				$('#' + _.glue(re, '_')).hide();
		
				Try.these(function() {
					if ($(_.li('contact')).len() == 1) {
						_.reload();
					}
					
					$(_.glue(v, '_')).hide();
				});
				break;
		}
		
		switch (_name) {
			case 'types':
			case 'store':
			case 'assoc':
				return;
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
				default: p = ''; break;
			}
			
			_.li('#' + a).each(function() {
				row = _.split(this.id, '_');
				if (Object.isUndefined(row[2])) row[2] = row[1];
				
				Try.these(function() { $('#' + p + 'modify_' + row[2]).click(ul.modify); });
				Try.these(function() { $('#' + p + 'remove_' + row[2]).click(ul.remove); });

				if (a == 'contact') {
					Try.these(function() { $('#' + p + 'status_' + row[2]).click(ul.contact_status); });
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
			Try.these(function() {
				$('#' + _sa + '_edit').hide();
			});
			Try.these(function() {
				$('#b' + _sa + '_edit').removeClass('button_s').hide();
			});
			Try.these(function() {
				$('#' + _sb + '_add').hide();
				$('#b' + _sb + '_add').removeClass('button_s');
			});
		}
		
		ul.watch_fx();
		if ($('#' + _sa + '_add').visible()) {
			if (!_.empty(ul.last_create) && ul.last_create + '_add' != _sa + '_add') {
				$('#' + ul.last_create + '_add').hide();
				Try.these(function() {
					$('#' + ul.last_create + 'x_add').unbind('click', ul.watch_fx);
				});
				
				_.timeout(function() {
					$('#b' + ul.last_create + '_add').removeClass('button_s');
				}, 0.5);
				ul.last_create = '';
			}
			
			Try.these(function() {
				$('#' + _sa + 'x_add').click(ul.watch_fx);
			});
			ul.last_create = _sa;
			
			_.form.first(_sa + '_add');
		};
		return;
	},
	watch_fx: function(e) {
		if ($('#' + _sa + '_add').visible()) {
			$('#' + _sa + '_add').hide();
			Try.these(function() {
				$('#' + _sa + 'x_add').unbind('click', ul.watch_fx);
			});
			_.timeout(function() {
				$('#b' + _sa + '_add').removeClass('button_s');
			}, 0.5);
			ul.last_create = '';
		} else {
			$('#' + _sa + '_add').show();
			
			if (_sa == 'v') {
				Try.these(function() {
					$('#field_id').change(ul.v_add_change);
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
				$('#' + _sa + '_add').hide();
				$('#' + _sa + '_add').clear();
				_.timeout(_.reload, 0.5);
				break;
			case 'g':
				this.callback = function(t) {
					$('#prow_' + v[1] + '_' + v[2]).html(t.responseText);
				}
				_.call(_.config.read('u_view'), this.callback, {computer: v[1], el: v[2], next: 1});
				break;
			case 'e':
				z = _.split(response);
					
				$('#erow_' + z[0] + '_' + z[1]).remove();
				ul.liview('grow_' + z[0] + '_' + z[1]);
				break;
			case 'b':
				if (response == EE.OK)
				{
					$('#' + _sa + '_add').hide();
					_.timeout(_.reload, 0.5);
				}
				break;
			default:
				if (response == EE.OK) {
					$('#' + _sa + '_add').hide();
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
		$('#v_add_input').html(response);
	},
	
	modify: function() {
		el = _.e(this.id);
		if (!Object.isUndefined(_.config.read('s_redirect')) && !_.empty(_.ga(el, 'redirect'))) {
			return _.go(_.ga(el, 'redirect'));
		}
		
		_v = _.parent(this);
		v = _.split(_v.id, '_');
		p = _.parent(_v, true);
		
		switch (p) {
			case 'cat':
			case 'groups':
			case 'element':
				param = {el: _.encode(v[2])};
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
				$('#f_add').hide();
				v_hide = 'v';
				break;
		}
		
		$('#' + v_hide + '_add').hide();
		
		if (!_.empty(ul.last_modify) && ul.last_modify != v_hide + '_edit') {
			$(ul.last_modify).hide();
			ul.last_modify = '';
		}
		
		ul.last_modify = v_hide + '_edit';
		
		if (p == 'cat' || p == 'groups') {
			var ret = $.evalJSON(response);
		}
		
		switch (p) {
			case 'cat':
				$F('#c_el', ret.id);
				$F('#c_name', _.entity_decode(ret.name));
				_.form._selectindex('c_group', ret.group);
				break;
			case 'groups':
				$F('#r_el', ret.id);
				$F('#r_name', _.entity_decode(ret.name));
				$F('#r_email', ret.email);
				$F('#r_mod', ret.mod);
				$F('#r_color', ret.color);
				break;
			default:
				$('#' + v_hide + '_update').html(response);
				break;
		}
		
		$('#' + v_hide + '_edit').show().scroll();
		$('#b' + v_hide + '_edit').addClass('button_s').show();
		
		$w('f v c').each(function() {
			Try.these(function() {
				$('#' + this + '_add').hide();
				$('#b' + this + '_add').removeClass('button_s'); });
		});
		
		Try.these(function() {
			$('#' + v_hide + 'x_edit').click(ul.modify_x);
		});
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
			
			$('#row_' + v[1]).removeClass('ticket_*').addClass(e_response[1]);
		}
		
		ul.last_modify = '';
		switch (v_hide) {
			case 'g':
				this.callback = function(t) {
					$('#' + _.glue(z, '_')).html(t.responseText);
				};
				
				z = _.split($(p).parentNode.id, '_');
				_.call(_.config.read('u_view'), this.callback, {computer: z[1], el: z[2], next: 1});
				break;
			case 'c':
			case 'r':
				if (response == EE.OK) {
					$('#b' + v_hide + '_edit').hide().removeClass('button_s');
					$('#' + v_hide + '_edit').hide();
					_.timeout(_.reload, 0.5);
				};
				break;
			default:
				if (response == EE.OK) {
					$('#b' + v_hide + '_edit').hide().removeClass('button_s');
					$('#' + v_hide + '_edit').hide();
					_.timeout(_.tab.refresh, 0.5);
				};
				break;
		};
		return false;
	},
	modify_x: function() {
		$('#b' + v_hide + '_edit').hide().removeClass('button_s');
		$('#' + v_hide + '_edit').hide();
		ul.last_modify = '';
		return;
	},
	remove: function(e) {
		if (!_confirm(_.config.read('g_remove_confirm'))) {
			return;
		}
		
		el = this;
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
				$('#' + _.glue(v, '_')).hide();
				break;
			case 'g':
				this.callback = function(t) {
					$('#' + _.glue(z, '_')).html(t.responseText);
				};
				
				z = _.split(el.parentNode.parentNode.parentNode.id, '_');
				_.call(_.config.read('u_view'), this.callback, {computer: z[1], el: z[2], next: 1});
				break;
			default:
				if (response == EE.OK) {
					Try.these(function() {
						if ($(_.li('contact')).len() == 1)
						{
							_.reload();
						}
					});
					
					$('#' + _.glue(v, '_')).hide();
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
		
		$('#v_add').hide();
		
		Try.these(function() {
			if (!$('contact') || !$(_.li('contact')).len()) {
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
			$('#' + v2 + 'row_' +  v[1] + '_' + v[2]).remove();
			$(el).removeClass('relevant');
			try { $('#' + v3 + '_edit').hide(); } catch (h) { }
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
				
				$('#' + s_liview + j_liview).remove();
				$('#' + f_liview + j_liview).removeClass('relevant');
				$('#' + v3 + '_edit').hide();
				ul.last_liview[v2] = '';
			}
		} catch (h) { }
		
		return _.call(_.config.read('u_' + v1 + 'view'), ul.liview_c, {computer: v[1], el: v[2]});
	},
	liview_c: function(t) {
		$(el).insert_after(t.responseText).addClass('relevant');
		ul.last_liview[v2] = el.id;
		return;
	}
}

var computer = {
	search: {
		element: 1,
		total: 0,
		row: '',
		
		startup: function(e) {
			computer.search.row = _.code('template_row');
			$('#template_row').remove();
			
			computer.search.duplicate();
		},
		duplicate: function(e) {
			if (computer.search.total) {
				var _c = _.replacement(_.e(e).id, 'row_add_', '');
				var _c2 = '#vinput_' + _c;
				if (_.empty($F(_c2))) {
					return $(_c2).focus();
				}
			}
			a = _.replacement(computer.search.row, /_dd/g, '_' + computer.search.element);
			a = _.replacement(a, /_ee/g, (computer.search.element - 1));
			
			if (!computer.search.total) {
				$('#search_list').insert_top(a);
			} else {
				$('#srow_' + _c).insert_after(a);
			};
			
			$('srow_' + computer.search.element).addClass('m_top_mid');
			$('#row_add_' + computer.search.element).click(computer.search.duplicate);
			$('#row_rem_' + computer.search.element).click(computer.search.remove);
			
			$('#table_' + computer.search.element).change(computer.search.table);
			$('#field_' + computer.search.element).change(computer.search.table_field);
			
			Try.these(function() {
				$('#vbox_' + computer.search.element).change(computer.search.vbox_change);
			});
			
			$(':input').each(function() {
				this.attr('autocomplete', 'off');
			});
			
			if (computer.search.element == 1) {
				Try.these(function() {
					$('#svbox_' + computer.search.element).hide();
				});
			}
			
			computer.search.element++;
			computer.search.total++;
			
			return computer.search.focus();
		},
		focus: function() {
			return $('#vinput_' + (computer.search.element - 1)).focus();
		},
		remove: function(e) {
			a = _.replacement(_.e(e).id, 'row_rem_', '');
			if (computer.search.total < 2) {
				$('#vinput_' + a).val('').focus();
				return;
			}
			
			$('#srow_' + a).remove();
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
			var ret = $.evalJSON(response);
			
			table = _.replacement(el.id, 'table_', '');
			_.input.select.clear('field_' + table);
			
			ret.each(function(i) {
				$('#field_' + table).insert_bottom(Builder.node('option', {value: i.r_id}, _.entity_decode(i.r_name)));
			});
			
			s_option = _.form.firstOption('#field_' + table);
			if (!s_option) {
				$w('rfield random').each(function(i) {
					$('#' + i + '_' + table).html('&nbsp;');
				});
			}
			
			$('#field_' + table).selectindex_t(s_option[1]);
			computer.search.table_field('#field_' + table);
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
			$('#random_' + field).html(response);
			
			$(':input').each(function() { this.attr('autocomplete', 'off'); });
			return $('#vinput_' + field).focus();
		},
		vbox_change: function(e) {
			return $('#vinput_' + _.replacement(_.e(e).id, 'vbox_', ''));
		}
	}
}