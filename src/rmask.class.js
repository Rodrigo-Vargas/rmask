import Mask from './mask';

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
            'S': { pattern: /[a-zA-Z]/ },
         },
      };

      this.globals = this.extend({}, this.globals, window.jMaskGlobals);

      if (typeof selector === "string") { this.elem = document.querySelector(selector); }

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
         if (this.globals.watchDataMask) this.applyDataMask();
      }, this.globals.watchInterval);

      this.selector = selector;

      // Make some helper functions available

      window.inArray = this.inArray;
      window.extend = this.extend;
   }

   extend() {
      for (var i = 1; i < arguments.length; i++) {
         for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
               arguments[0][key] = arguments[i][key];
            }
         }
      }


      return arguments[0];
   }

   inArray(elem, arr, i) {
      return arr == null ? -1 : indexOf.call(arr, elem, i);
   }

   notSameMaskObject(field, mask, options) {
      options = options || {};
      var maskObject = data(field, 'mask'),
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

   maskFunction(mask, options) {
      if (!this.notSameMaskObject(this.elem, mask, options)) { return; }

      return window.data(this.elem, 'mask', new Mask(this.elem, this.selector, mask, options));
   };

   mask(mask, options) {
      options = options || {};
      // var selector = this.selector;
      // var interval = this.globals.watchInterval;
      // var watchInputs = options.watchInputs || this.globals.watchInputs;

      this.maskFunction(mask, options);

      // if (selector && selector !== '' && watchInputs) {
      //    clearInterval(this.maskWatchers[selector]);

      //    this.maskWatchers[selector] = setInterval(() => {
      //       var fields = document.querySelectorAll(selector);

      //       fields.forEach((event) => {
      //          this.maskFunction(mask, options);
      //       });
      //    }, interval);
      // }

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

      var elements = document.querySelectorAll(this.globals.dataMaskAttr);

      elements.forEach(this.HTMLAttributes);
   };
}

export default RMask;
