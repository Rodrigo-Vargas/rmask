// =====================================================

import RMask from "./rmask.class";

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
EventTarget.prototype.addEventListener = function(type, listener) {
    _listeners.push({target: this, type: type, listener: listener});
    this.addEventListenerBase(type.split('.')[0], listener);
};

EventTarget.prototype.removeEventListeners = function(targetType) {
    for(var index = 0; index != _listeners.length; index++) {
        var item = _listeners[index];

        var target = item.target;
        var type = item.type;
        var listener = item.listener;

        if(target == this && type == targetType) {
            this.removeEventListener(type.split('.')[0], listener);
        }
    }
}

EventTarget.prototype.off = function (events) {
   events = events.split(' ');

   events.forEach((event) => {
      this.removeEventListeners(event);
   })
};




function UserData() {
   var version = "1.0.0";
   this.expando = "UserData" + (version + Math.random()).replace(/\D/g, "") + UserData.uid++;
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
                  configurable: true,
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
   },
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

window.indexOf = arr.indexOf;

var class2type = {};

function isWindow(obj) {
   return obj != null && obj === obj.window;
}

window.access = function(elems, fn, key, value, chainable, emptyGet, raw) {
   var i = 0,
      len = elems.length,
      bulk = key == null;

   // Sets many values
   if (toType(key) === "object") {
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
               value.call(elems[i], i, fn(elems[i], key)),
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

   return access(elem, function (value) {
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
      if (elem.length) {
         for (var x = 0; x < elem.length; x++) {
            dataUser.set(elem[x], key, value);
         }
      } else {
         dataUser.set(elem, key, value);
      }
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

window.dataUser = new UserData();

export default RMask;
