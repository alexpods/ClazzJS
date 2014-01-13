var _ = (function() {
    var _ = {};

    var toString    = Object.prototype.toString;
    var slice       = Array.prototype.slice;

    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    _.isObject = function(obj) {
        return obj === Object(obj);
    };

    _.isSimpleObject = function(obj) {
        return obj && ({}).constructor === obj.constructor;
    };

    _.isNull = function(obj) {
        return obj === null;
    };

    var isFunctions = ['Function', 'String', 'Number', 'Date', 'RegExp', 'Array'];
    for (var i = 0, ii = isFunctions.length; i < ii; ++i) {
        (function(name) {
            _['is' + name] = function(obj) {
                return toString.call(obj) === '[object ' + name + ']';
            }
        })(isFunctions[i]);
    }

    _.toArray = function(obj) {
        return slice.call(obj);
    };

    _.extend = function(obj) {
        var sources = slice.call(arguments, 1);

        for (var i = 0, ii = sources.length; i < ii; ++i) {
            var source = sources[i];

            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        }

        return obj;
    };

    _.clone = function(obj) {
        if (!_.isObject(obj)) return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    _.last = function(arr) {
        return arr[arr.length - 1];
    };

    _.isEmpty = function(obj) {
        if (obj == null) return true;
        if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
        for (var key in obj) if (obj.hasOwnProperty(key)) return false;
        return true;
    };

    _.each = function(obj, iterator, context) {
        if (obj == null) return;

        var native = Array.prototype.forEach;

        if (native && obj.forEach === native) {
            obj.forEach(iterator, context);
        }
        else if (obj.length === +obj.length) {
            for (var i = 0, ii = obj.length; i < ii; ++i) {
                if (iterator.call(context, obj[i], i, obj) === {}) return;
            }
        } else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (iterator.call(context, obj[key], key, obj) === {}) return;
                }
            }
        }
    };

    _.construct = function (klass, params) {
        var K = function() {
            return klass.apply(this, params);
        };
        K.prototype = klass.prototype;

        return new K();
    };

    return _;
})();
