class Mask {
   constructor(el, selector, mask, options) {
      this.p = {
         invalid: [],
         getCaret: function () {
            try {
               var sel;
               var pos = 0;
               var ctrl = el;
               var dSel = document.selection;
               var cSelStart = ctrl.selectionStart;

               // IE Support
               if (dSel && navigator.appVersion.indexOf('MSIE 10') === -1) {
                  sel = dSel.createRange();
                  sel.moveStart('character', -this.val().length);
                  pos = sel.text.length;
               // eslint-disable-next-line brace-style
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
               var newVal = this.getMasked();
               var caretPos = this.getCaret();

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
               defaultArgs = [val, e, el, selector, options],
               callback = function (name, criteria, args) {
                  if (typeof options[name] === 'function' && criteria) {
                     options[name].apply(this, args);
                  }
               };

            callback('onChange', changed === true, defaultArgs);
            callback('onKeyPress', changed === true, defaultArgs);
            callback('onComplete', val.length === mask.length, defaultArgs);
            callback('onInvalid', this.invalid.length > 0, [val, e, el, this.invalid, options]);
         },
      };

      var jMask = this, oldValue = this.p.val(), regexMask;

      mask = typeof mask === 'function' ? mask(this.p.val(), undefined, el, options) : mask;

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

      jMask.getCleanVal = function () {
         return this.getMasked(true);
      };

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
            let maxlength = true;
            for (var i = 0; i < mask.length; i++) {
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

export default Mask;
