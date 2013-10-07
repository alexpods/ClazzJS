Meta('Clazz.Property.Methods', {

    process: function(object, methods, property) {
        if (Object.prototype.toString.apply(methods) !== '[object Array]') {
            methods = [methods];
        }

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethod(methods[i], object, property);
        }
    },
    addMethod:  function(name, object, property) {
        var method = this.createMethod(name, property);
        object[method.name] = method.body;
    },

    createMethod: function(name, property) {
        if (!(name in this.METHODS)) {
            throw new Error('Unsupported method "' + name + '"!');
        }
        var method = this.METHODS[name](property);

        if (typeof method === 'function') {
            method = {
                name: name + property[0].toUpperCase() + property.slice(1),
                body: method
            }
        }
        return method;
    },

    METHODS: {
        get: function(property) {
            return function() {
                return this.__getPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
            }
        },
        set: function(property) {
            return function(value) {
                return this.__setPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
            }
        },
        is: function(property) {
            return {
                name: (0 !== property.indexOf('is') ? 'is' : '') + property[0].toUpperCase() + property.slice(1),
                body: function() {
                    return this.__isPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
                }
            }
        },
        has: function(property) {
            return function() {
                return this.__hasPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
            }
        }
    }
})