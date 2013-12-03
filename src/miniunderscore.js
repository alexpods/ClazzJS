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
    };

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

    _.last = function(arr) {
        return arr[arr.length - 1];
    };


    return _;
})();
