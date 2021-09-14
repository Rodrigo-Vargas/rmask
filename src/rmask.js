// =====================================================

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

var _listeners = [];

EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener)
{
    _listeners.push({target: this, type: type, listener: listener});
    this.addEventListenerBase(type.split('.')[0], listener);
};

EventTarget.prototype.removeEventListeners = function(targetType)
{
    for(var index = 0; index != _listeners.length; index++)
    {
        var item = _listeners[index];

        var target = item.target;
        var type = item.type;
        var listener = item.listener;

        if(target == this && type == targetType)
        {
            this.removeEventListener(type.split('.')[0], listener);
        }
    }
}

EventTarget.prototype.off = function (events) {
   events = events.split(' ');

   events.forEach(event => {
      this.removeEventListeners(event);
   })
};


class Mask {
   constructor(el, mask, options) {
      this.p = {
         invalid: [],
         getCaret: function () {
            try {
               var sel,
                  pos = 0,
                  ctrl = el.get(0),
                  dSel = document.selection,
                  cSelStart = ctrl.selectionStart;

               // IE Support
               if (dSel && navigator.appVersion.indexOf('MSIE 10') === -1) {
                  sel = dSel.createRange();
                  sel.moveStart('character', -this.val().length);
                  pos = sel.text.length;
               }
               // Firefox support
               else if (cSelStart || cSelStart === '0') {
                  pos = cSelStart;
               }

               return pos;
            } catch (e) { }
         },
         setCaret: function (pos) {
            try {
               if (el.is(':focus')) {
                  var range, ctrl = el.get(0);

                  // Firefox, WebKit, etc..
                  if (ctrl.setSelectionRange) {
                     ctrl.setSelectionRange(pos, pos);
                  } else { // IE
                     range = ctrl.createTextRange();
                     range.collapse(true);
                     range.moveEnd('character', pos);
                     range.moveStart('character', pos);
                     range.select();
                  }
               }
            } catch (e) { }
         },
         events: function () {
            var that = this;

            el.addEventListener('keydown.mask', function (e) {
               data(el, 'mask-keycode', e.keyCode || e.which);
               data(el, 'mask-previus-value', el.value);
            });

            el.addEventListener(window.jMaskGlobals.useInput ? 'input.mask' : 'keyup.mask', function (e) {
               that.behaviour(e);
            });

            el.addEventListener('paste.mask drop.mask', function () {
               setTimeout(function () {
                  el.keydown().keyup();
               }, 100);
            });

            el.addEventListener('change.mask', function () {
               data(el, 'changed', true);
            });

            el.addEventListener('blur.mask', function () {
               if (oldValue !== this.value && !data(el, 'changed')) {
                  el.trigger('change');
               }
               data(el, 'changed', false);
            });

            // it's very important that this callback remains in this position
            // otherwhise oldValue it's going to work buggy
            el.addEventListener('blur.mask', function () {
               oldValue = this.value;
            });

            // select all text on focus
            el.addEventListener('focus.mask', function (e) {
               if (options.selectOnFocus === true) {
                  $(e.target).select();
               }
            });

            // clear the value if it not complete the mask
            el.addEventListener('focusout.mask', function () {
               if (options.clearIfNotMatch && !regexMask.test(this.val())) {
                  this.val('');
               }
            });
         },
         getRegexMask: function () {
            var maskChunks = [], translation, pattern, optional, recursive, oRecursive, r;

            for (var i = 0; i < mask.length; i++) {
               translation = jMask.translation[mask.charAt(i)];

               if (translation) {

                  pattern = translation.pattern.toString().replace(/.{1}$|^.{1}/g, '');
                  optional = translation.optional;
                  recursive = translation.recursive;

                  if (recursive) {
                     maskChunks.push(mask.charAt(i));
                     oRecursive = { digit: mask.charAt(i), pattern: pattern };
                  } else {
                     maskChunks.push(!optional && !recursive ? pattern : (pattern + '?'));
                  }

               } else {
                  maskChunks.push(mask.charAt(i).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
               }
            }

            r = maskChunks.join('');

            if (oRecursive) {
               r = r.replace(new RegExp('(' + oRecursive.digit + '(.*' + oRecursive.digit + ')?)'), '($1)?')
                  .replace(new RegExp(oRecursive.digit, 'g'), oRecursive.pattern);
            }

            return new RegExp(r);
         },
         destroyEvents: function () {
            el.off(['input', 'keydown', 'keyup', 'paste', 'drop', 'blur', 'focusout', ''].join('.mask '));
         },
         val: function (v) {
            var isInput = el.matches('input'),
               method = isInput ? 'value' : 'innerText',
               r;

            if (arguments.length > 0) {
               if (el[method] !== v) {
                  el[method] = v;
               }
               r = el;
            } else {
               r = el[method];
            }

            return r;
         },
         calculateCaretPosition: function (caretPos, newVal) {
            var newValL = newVal.length,
               oValue = data(el, 'mask-previus-value'),
               oValueL = oValue.length;

            // edge cases when erasing digits
            if (data(el, 'mask-keycode') === 8 && oValue !== newVal) {
               caretPos = caretPos - (newVal.slice(0, caretPos).length - oValue.slice(0, caretPos).length);

               // edge cases when typing new digits
            } else if (oValue !== newVal) {
               // if the cursor is at the end keep it there
               if (caretPos >= oValueL) {
                  caretPos = newValL;
               } else {
                  caretPos = caretPos + (newVal.slice(0, caretPos).length - oValue.slice(0, caretPos).length);
               }
            }

            return caretPos;
         },
         behaviour: function (e) {
            e = e || window.event;
            this.invalid = [];

            var keyCode = data(el, 'mask-keycode');

            if (window.inArray(keyCode, jMask.byPassKeys) === -1) {
               var newVal = this.getMasked(),
                  caretPos = this.getCaret();

               setTimeout((caretPos, newVal) => {
                  this.setCaret(this.calculateCaretPosition(caretPos, newVal));
               }, 10, caretPos, newVal);

               this.val(newVal);
               this.setCaret(caretPos);
               return this.callbacks(e);
            }
         },
         getMasked: function (skipMaskChars, val) {
            var buf = [],
               value = val === undefined ? this.val() : val + '',
               m = 0, maskLen = mask.length,
               v = 0, valLen = value.length,
               offset = 1, addMethod = 'push',
               resetPos = -1,
               lastMaskChar,
               check;

            if (options.reverse) {
               addMethod = 'unshift';
               offset = -1;
               lastMaskChar = 0;
               m = maskLen - 1;
               v = valLen - 1;
               check = function () {
                  return m > -1 && v > -1;
               };
            } else {
               lastMaskChar = maskLen - 1;
               check = function () {
                  return m < maskLen && v < valLen;
               };
            }

            var lastUntranslatedMaskChar;
            while (check()) {
               var maskDigit = mask.charAt(m),
                  valDigit = value.charAt(v),
                  translation = jMask.translation[maskDigit];

               if (translation) {
                  if (valDigit.match(translation.pattern)) {
                     buf[addMethod](valDigit);
                     if (translation.recursive) {
                        if (resetPos === -1) {
                           resetPos = m;
                        } else if (m === lastMaskChar) {
                           m = resetPos - offset;
                        }

                        if (lastMaskChar === resetPos) {
                           m -= offset;
                        }
                     }
                     m += offset;
                  } else if (valDigit === lastUntranslatedMaskChar) {
                     // matched the last untranslated (raw) mask character that we encountered
                     // likely an insert offset the mask character from the last entry; fall
                     // through and only increment v
                     lastUntranslatedMaskChar = undefined;
                  } else if (translation.optional) {
                     m += offset;
                     v -= offset;
                  } else if (translation.fallback) {
                     buf[addMethod](translation.fallback);
                     m += offset;
                     v -= offset;
                  } else {
                     this.invalid.push({ p: v, v: valDigit, e: translation.pattern });
                  }
                  v += offset;
               } else {
                  if (!skipMaskChars) {
                     buf[addMethod](maskDigit);
                  }

                  if (valDigit === maskDigit) {
                     v += offset;
                  } else {
                     lastUntranslatedMaskChar = maskDigit;
                  }

                  m += offset;
               }
            }

            var lastMaskCharDigit = mask.charAt(lastMaskChar);
            if (maskLen === valLen + 1 && !jMask.translation[lastMaskCharDigit]) {
               buf.push(lastMaskCharDigit);
            }

            return buf.join('');
         },
         callbacks: function (e) {
            var val = this.val(),
               changed = val !== oldValue,
               defaultArgs = [val, e, el, options],
               callback = function (name, criteria, args) {
                  if (typeof options[name] === 'function' && criteria) {
                     options[name].apply(this, args);
                  }
               };

            callback('onChange', changed === true, defaultArgs);
            callback('onKeyPress', changed === true, defaultArgs);
            callback('onComplete', val.length === mask.length, defaultArgs);
            callback('onInvalid', this.invalid.length > 0, [val, e, el, this.invalid, options]);
         }
      };

      // el = $(el);
      var jMask = this, oldValue = this.p.val(), regexMask;

      mask = typeof mask === 'function' ? mask(this.val(), undefined, el, options) : mask;

      // public methods
      jMask.mask = mask;
      jMask.options = options;
      jMask.remove = function () {
         var caret = this.getCaret();
         this.p.destroyEvents();
         this.p.val(jMask.getCleanVal());
         this.p.setCaret(caret);
         return el;
      };

      // get value without mask
      jMask.getCleanVal = function () {
         return this.getMasked(true);
      };

      // get masked value without the value being in the input or element
      jMask.getMaskedVal = function (val) {
         return this.getMasked(false, val);
      };

      jMask.init = function (onlyMask) {
         onlyMask = onlyMask || false;
         options = options || {};

         jMask.clearIfNotMatch = window.jMaskGlobals.clearIfNotMatch;
         jMask.byPassKeys = window.jMaskGlobals.byPassKeys;
         jMask.translation = window.extend({}, window.jMaskGlobals.translation, options.translation);

         jMask = window.extend({}, jMask, options);

         regexMask = this.p.getRegexMask();

         if (onlyMask) {
            this.p.events();
            this.p.val(this.p.getMasked());
         } else {
            if (options.placeholder) {
               el.setAttribute('placeholder', options.placeholder);
            }

            // this is necessary, otherwise if the user submit the form
            // and then press the "back" button, the autocomplete will erase
            // the data. Works fine on IE9+, FF, Opera, Safari.
            if (data(el, 'mask')) {
               el.setAttribute('autocomplete', 'off');
            }

            // detect if is necessary let the user type freely.
            // for is a lot faster than forEach.
            for (var i = 0, maxlength = true; i < mask.length; i++) {
               var translation = jMask.translation[mask.charAt(i)];
               if (translation && translation.recursive) {
                  maxlength = false;
                  break;
               }
            }

            if (maxlength) {
               el.setAttribute('maxlength', mask.length);
            }

            this.p.destroyEvents();
            this.p.events();

            var caret = this.p.getCaret();
            this.p.val(this.p.getMasked());
            this.p.setCaret(caret);
         }
      };

      jMask.init(!el.matches('input'));
   }
};

function UserData() {
   var version = "1.0.0";
   this.expando = "jQuery" + (version + Math.random()).replace(/\D/g, "") + UserData.uid++;
}

UserData.uid = 1;

UserData.prototype = {
   cache: function (owner) {

      // Check if the owner object already has a cache
      var value = owner[this.expando];

      // If not, create one
      if (!value) {
         value = Object.create(null);

         // We can accept data for non-element nodes in modern browsers,
         // but we should not, see #8335.
         // Always return an empty object.
         if (acceptData(owner)) {

            // If it is a node unlikely to be stringify-ed or looped over
            // use plain assignment
            if (owner.nodeType) {
               owner[this.expando] = value;

               // Otherwise secure it in a non-enumerable property
               // configurable must be true to allow the property to be
               // deleted when data is removed
            } else {
               Object.defineProperty(owner, this.expando, {
                  value: value,
                  configurable: true
               });
            }
         }
      }

      return value;
   },
   set: function (owner, data, value) {
      var prop,
         cache = this.cache(owner);

      // Handle: [ owner, key, value ] args
      // Always use camelCase key (gh-2257)
      if (typeof data === "string") {
         cache[camelCase(data)] = value;

         // Handle: [ owner, { properties } ] args
      } else {

         // Copy the properties one-by-one to the cache object
         for (prop in data) {
            cache[camelCase(prop)] = data[prop];
         }
      }
      return cache;
   },
   get: function (owner, key) {
      return key === undefined ?
         this.cache(owner) :

         // Always use camelCase key (gh-2257)
         owner[this.expando] && owner[this.expando][camelCase(key)];
   },
   access: function (owner, key, value) {

      // In cases where either:
      //
      //   1. No key was specified
      //   2. A string key was specified, but no value provided
      //
      // Take the "read" path and allow the get method to determine
      // which value to return, respectively either:
      //
      //   1. The entire cache object
      //   2. The data stored at the key
      //
      if (key === undefined ||
         ((key && typeof key === "string") && value === undefined)) {

         return this.get(owner, key);
      }

      // When the key is not a string, or both a key and value
      // are specified, set or extend (existing objects) with either:
      //
      //   1. An object of properties
      //   2. A key and value
      //
      this.set(owner, key, value);

      // Since the "set" path can have two possible entry points
      // return the expected data based on which path was taken[*]
      return value !== undefined ? value : key;
   },
   remove: function (owner, key) {
      var i,
         cache = owner[this.expando];

      if (cache === undefined) {
         return;
      }

      if (key !== undefined) {

         // Support array or space separated string of keys
         if (Array.isArray(key)) {

            // If key is an array of keys...
            // We always set camelCase keys, so remove that.
            key = key.map(camelCase);
         } else {
            key = camelCase(key);

            // If a key with the spaces exists, use it.
            // Otherwise, create an array by matching non-whitespace
            key = key in cache ?
               [key] :
               (key.match(rnothtmlwhite) || []);
         }

         i = key.length;

         while (i--) {
            delete cache[key[i]];
         }
      }

      // Remove the expando if there's no more data
      if (key === undefined || jQuery.isEmptyObject(cache)) {

         // Support: Chrome <=35 - 45+
         // Webkit & Blink performance suffers when deleting properties
         // from DOM nodes, so set to undefined instead
         // https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
         if (owner.nodeType) {
            owner[this.expando] = undefined;
         } else {
            delete owner[this.expando];
         }
      }
   },
   hasData: function (owner) {
      var cache = owner[this.expando];
      return cache !== undefined && !jQuery.isEmptyObject(cache);
   }
};

function acceptData(owner) {

   // Accepts only:
   //  - Node
   //    - Node.ELEMENT_NODE
   //    - Node.DOCUMENT_NODE
   //  - Object
   //    - Any
   return owner.nodeType === 1 || owner.nodeType === 9 || !(+owner.nodeType);
}

// Matches dashed string for camelizing
var rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase(_all, letter) {
   return letter.toUpperCase();
}

// Convert dashed to camelCase
function camelCase(string) {
   return string.replace(rdashAlpha, fcamelCase);
}

window.each = function(obj, callback) {
   var length, i = 0;

   if (isArrayLike(obj)) {
      length = obj.length;
      for (; i < length; i++) {
         if (callback.call(obj[i], i, obj[i]) === false) {
            break;
         }
      }
   } else {
      for (i in obj) {
         if (callback.call(obj[i], i, obj[i]) === false) {
            break;
         }
      }
   }

   return obj;
}

var arr = [];

var indexOf = arr.indexOf;

var class2type = {};

function isWindow(obj) {
   return obj != null && obj === obj.window;
}

window.access = function(elems, fn, key, value, chainable, emptyGet, raw) {
   var i = 0,
      len = elems.length,
      bulk = key == null;

   // Sets many values
   if (this.toType(key) === "object") {
      chainable = true;
      for (i in key) {
         access(elems, fn, i, key[i], true, emptyGet, raw);
      }

      // Sets one value
   } else if (value !== undefined) {
      chainable = true;

      if (typeof value !== "function") {
         raw = true;
      }

      if (bulk) {

         // Bulk operations run against the entire set
         if (raw) {
            fn.call(elems, value);
            fn = null;

            // ...except when executing function values
         } else {
            bulk = fn;
            fn = function (elem, _key, value) {
               return bulk.call(jQuery(elem), value);
            };
         }
      }

      if (fn) {
         for (; i < len; i++) {
            fn(
               elems[i], key, raw ?
               value :
               value.call(elems[i], i, fn(elems[i], key))
            );
         }
      }
   }

   if (chainable) {
      return elems;
   }

   // Gets
   if (bulk) {
      return fn.call(elems);
   }

   return len ? fn(elems[0], key) : emptyGet;
}

window.toType = function(obj) {
   if (obj == null) {
      return obj + "";
   }

   return typeof obj === "object" ?
      class2type[toString.call(obj)] || "object" :
      typeof obj;
}

window.data = function(element, key, value) {
   var i, name, data,
      elem = element.lenght > 0 ? element[0] : element,
      attrs = elem && elem.attributes;

   // Gets all values
   if (key === undefined) {
      if (this.length) {
         data = dataUser.get(elem);

         if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
            i = attrs.length;
            while (i--) {

               // Support: IE 11+
               // The attrs elements can be null (#14894)
               if (attrs[i]) {
                  name = attrs[i].name;
                  if (name.indexOf("data-") === 0) {
                     name = camelCase(name.slice(5));
                     dataAttr(elem, name, data[name]);
                  }
               }
            }
            dataPriv.set(elem, "hasDataAttrs", true);
         }
      }

      return data;
   }

   // Sets multiple values
   if (typeof key === "object") {
      return each(element, function () {
         dataUser.set(element, key);
      });
   }

   return access(this, function (value) {
      var data;

      // The calling jQuery object (element matches) is not empty
      // (and therefore has an element appears at this[ 0 ]) and the
      // `value` parameter was not undefined. An empty jQuery object
      // will result in `undefined` for elem = this[ 0 ] which will
      // throw an exception if an attempt to read a data cache is made.
      if (elem && value === undefined) {

         // Attempt to get data from the cache
         // The key will always be camelCased in Data
         data = dataUser.get(elem, key);
         if (data !== undefined) {
            return data;
         }

         // Attempt to "discover" the data in
         // HTML5 custom data-* attrs
         data = dataAttr(elem, key);
         if (data !== undefined) {
            return data;
         }

         // We tried really hard, but the data doesn't exist.
         return;
      }

      // Set the data...
      this.each(elem, function () {

         // We always store the camelCased key
         dataUser.set(element, key, value);
      });
   }, null, value, arguments.length > 2, null, true);
}

window.isArrayLike = function(obj) {

   var length = !!obj && obj.length,
      type = toType(obj);

   if (typeof obj === "function" || isWindow(obj)) {
      return false;
   }

   return type === "array" || length === 0 ||
      typeof length === "number" && length > 0 && (length - 1) in obj;
}

class RMask {
   constructor(selector) {
      this.maskWatchers = {};

      this.globals = {
         maskElements: 'input,td,span,div',
         dataMaskAttr: '*[data-mask]',
         dataMask: true,
         watchInterval: 300,
         watchInputs: true,
         // old versions of chrome dont work great with input event
         useInput: !/Chrome\/[2-4][0-9]|SamsungBrowser/.test(window.navigator.userAgent) && this.eventSupported('input'),
         watchDataMask: false,
         byPassKeys: [9, 16, 17, 18, 36, 37, 38, 39, 40, 91],
         translation: {
            '0': { pattern: /\d/ },
            '9': { pattern: /\d/, optional: true },
            '#': { pattern: /\d/, recursive: true },
            'A': { pattern: /[a-zA-Z0-9]/ },
            'S': { pattern: /[a-zA-Z]/ }
         }
      };

      this.globals = this.extend({}, this.globals, window.jMaskGlobals);

      this.elem = document.querySelector(selector);

      this.HTMLAttributes = function () {
         var input = $(this),
            options = {},
            prefix = 'data-mask-',
            mask = input.attr('data-mask');

         if (input.attr(prefix + 'reverse')) {
            options.reverse = true;
         }

         if (input.attr(prefix + 'clearifnotmatch')) {
            options.clearIfNotMatch = true;
         }

         if (input.attr(prefix + 'selectonfocus') === 'true') {
            options.selectOnFocus = true;
         }

         if (notSameMaskObject(input, mask, options)) {
            return data(input, 'mask', new Mask(this.elem, mask, options));
         }
      };

      if (this.globals.dataMask) {
         this.applyDataMask();
      }

      window.jMaskGlobals = this.globals;

      setInterval(() => {
         if (this.globals.watchDataMask) {
            this.applyDataMask();
         }
      }, this.globals.watchInterval);

      // Make some helper functions available

      window.inArray = this.inArray;
      window.extend = this.extend;
      window.dataUser = new UserData();
   }

   extend() {
      for (var i = 1; i < arguments.length; i++)
         for (var key in arguments[i])
            if (arguments[i].hasOwnProperty(key))
               arguments[0][key] = arguments[i][key];

      return arguments[0];
   }

   inArray(elem, arr, i) {
      return arr == null ? -1 : indexOf.call(arr, elem, i);
   }

   notSameMaskObject(field, mask, options) {
      options = options || {};
      var maskObject = data(field, field, 'mask'),
         stringify = JSON.stringify,
         value = field.value || field.innerText;
      try {
         if (typeof mask === 'function') {
            mask = mask(value);
         }
         return typeof maskObject !== 'object' || stringify(maskObject.options) !== stringify(options) || maskObject.mask !== mask;
      } catch (e) { }
   }

   eventSupported(eventName) {
      var el = document.createElement('div'), isSupported;

      eventName = 'on' + eventName;
      isSupported = (eventName in el);

      if (!isSupported) {
         el.setAttribute(eventName, 'return;');
         isSupported = typeof el[eventName] === 'function';
      }
      el = null;

      return isSupported;
   };

   maskFunction = function (mask, options) {
      if (this.notSameMaskObject(this.elem, mask, options)) {
         return window.data(this.elem, 'mask', new Mask(this.elem, mask, options));
      }
   };

   mask(mask, options) {
      options = options || {};
      var selector = this.selector;
      var interval = this.globals.watchInterval;
      var watchInputs = options.watchInputs || this.globals.watchInputs;

      this.maskFunction(mask, options);

      if (selector && selector !== '' && watchInputs) {

         clearInterval(this.maskWatchers[selector]);

         this.maskWatchers[selector] = setInterval(function () {
            $(document).find(selector).each(maskFunction);
         }, interval);
      }
      return this;
   };

   masked(val) {
      return this.data('mask').getMaskedVal(val);
   };

   unmask() {
      clearInterval(this.maskWatchers[this.selector]);
      delete this.maskWatchers[this.selector];
      return this.each(function () {
         var dataMask = data($(this), 'mask');
         if (dataMask) {
            dataMask.remove().removeData('mask');
         }
      });
   };

   cleanVal() {
      return data(this, 'mask').getCleanVal();
   };

   applyDataMask(selector) {
      selector = selector || this.globals.maskElements;
      // var $selector = (selector instanceof $) ? selector : $(selector);
      var elements = document.querySelectorAll(this.globals.dataMaskAttr);

      elements.forEach(this.HTMLAttributes);

      //$selector.filter(this.globals.dataMaskAttr).each(this.HTMLAttributes);
   };
}

// export default RMask;
