meta('Methods', {

    process: function(object, methods, property, aliases) {

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethodToObject(methods[i], object, property);
        }

        var aliases = object.__getPropertyParam(property, 'aliases') || [];

        for (var j = 0, jj = aliases.length; j < jj; ++j) {
            for (var i = 0, ii = methods.length; i < ii; ++i) {
                this.addMethodToObject(methods[i], object, property, aliases[j]);
            }
        }
    },

    addMethodToObject:  function(name, object, property, alias) {
        var method = this.createMethod(name, property, alias);
        object[method.name] = method.body;
    },

    createMethod: function(name, property, alias) {
        if (!(name in this._methods)) {
            throw new Error('Method "' + name + '" does not exists!');
        }
        var method = this._methods[name](property, alias);

        if (_.isFunction(method)) {

            var propertyName = typeof alias !== 'undefined' ? alias : property;

            method = {
                name: name + propertyName[0].toUpperCase() + propertyName.slice(1),
                body: method
            }
        }

        return method;
    },

    addMethod: function(name, callback) {
        if (name in this._methods) {
            throw new Error('Method "' + name + '" is already exists!');
        }
        this._methods[name] = callback;
        return this;
    },

    hasMethod: function(name) {
        return name in this._methods;
    },

    removeMethod: function(name) {
        if (!(name in this._methods)) {
            throw new Error('Method "' + name + '" does not exists!');
        }
        delete this._methods[name];
        return this;
    },

    _methods: {
        get: function(property) {
            return function(/* fields */) {
                return this.__getPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
            };
        },
        set: function(property) {
            return function(/* fields, value */) {
                return this.__setPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
            };
        },
        is: function(property, alias) {
            var propertyName = !_.isUndefined(alias) ? alias : property;

            return {
                name: 0 !== propertyName.indexOf('is') ? 'is' + propertyName[0].toUpperCase() + propertyName.slice(1) : propertyName,
                body: function(/* fields, value */) {
                    return this.__isPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                }
            }
        },
        has: function(property) {
            return function(/* fields */) {
                return this.__hasPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
            }
        },
        clear: function(property) {
            return function(/* fields */) {
                return this.__clearPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
            };
        },
        remove: function(property) {
            return function(/* fields */) {
                return this.__removePropertyValue.apply(this , [property].concat(_.toArray(arguments)));
            }
        }
    }
});

