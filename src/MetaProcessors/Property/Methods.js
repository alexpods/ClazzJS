meta.processor('Clazz.Property.Methods', {

    process: function(object, methods, property) {
        if (Object.prototype.toString.apply(methods) !== '[object Array]') {
            methods = [methods];
        }

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethod(methods[i], object, property);
        }

        if (methods.alias) {
            var aliases = [].concat(methods.alias);
            for (var j = 0, jj = aliases.length; j < jj; ++j) {
                for (var i = 0, ii = methods.length; i < ii; ++i) {
                    this.addMethod(methods[i], object, property, aliases[j]);
                }
            }
        }
    },
    addMethod:  function(name, object, property, alias) {
        var method = this.createMethod(name, property, alias);
        object[method.name] = method.body;
    },

    createMethod: function(name, property, alias) {
        if (!(name in this.METHODS)) {
            throw new Error('Unsupported method "' + name + '"!');
        }
        var method = this.METHODS[name](property, alias);

        if (typeof method === 'function') {

            var propertyName = typeof alias !== 'undefined' ? alias : property;

            method = {
                name: name + propertyName[0].toUpperCase() + propertyName.slice(1),
                body: method
            }
        }
        return method;
    },

    METHODS: {
        get: function(property) {
            return function() {

                var fields = Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments);

                return this.__getPropertyValue(property, fields);
            };
        },
        set: function(property) {
            return function(/* fields, value */) {

                var fields = arguments.length > 1 && Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments, 0, -1);

                var value  = arguments[arguments.length - 1];

                return this.__setPropertyValue(property, fields, value);
            };
        },
        is: function(property, alias) {

            var propertyName = typeof alias !== 'undefined' ? alias : property;

            return {
                name: (0 !== propertyName.indexOf('is')
                    ? 'is' + propertyName[0].toUpperCase()
                    : '' + propertyName[0]) + propertyName.slice(1),

                body: function() {
                    var fields, value;

                    Object.prototype.toString.call(arguments[0]) === '[object Array]'
                        ? (fields = arguments[0], value = undefined)
                        : (fields = [],           value = arguments[0]);


                    return this.__isPropertyValue(property, fields, value);
                }
            }
        },
        has: function(property) {
            return function() {
                var fields, value;

                Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? (fields = arguments[0], value = undefined)
                    : (fields = [],           value = arguments[0]);

                return this.__hasPropertyValue(property, fields, value);
            }
        },
        clear: function(property) {
            return function() {

                var fields = Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments);

                return this.__clearPropertyValue(property, fields);
            };
        },
        remove: function(property) {
            return function() {

                var fields = Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments);

                return this.__removePropertyValue(property, fields)
            }
        }
    }
});

