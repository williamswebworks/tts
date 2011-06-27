$.string(String.prototype);

var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

(function() {

  var _toString = Object.prototype.toString;

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = toJSON(object[property]);
      if (!isUndefined(value))
        results.push(property.toJSON() + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  }
  
  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    var results = [];
    for (var property in object)
      results.push(property);
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) == "[object Array]";
  }

  function isObject(object) {
    return typeof object == "object" && !isArray(object);
  }

  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return typeof object === "function";
  }

  function isString(object) {
    return _toString.call(object) == "[object String]";
  }

  function isNumber(object) {
    return _toString.call(object) == "[object Number]";
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }
  
  $.extend(Object, {
    inspect:       inspect,
    toJSON:        toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isObject:      isObject,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isUndefined:   isUndefined
  });
})();

function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  string = string ? string.split(/\s+/) : [];
  return $(string);
}

function $F(e, v) {
	if (v) $(e).val(v);
	return $(e).val();
}

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

function _input(a) {
	return (a) ? ':not(' + a + ')' : '';
}
