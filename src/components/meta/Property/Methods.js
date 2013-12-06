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
            return function(fields) {
                return this.__getPropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []));
            };
        },
        set: function(property) {
            return function(fields, value) {
                if (_.isUndefined(value)) {
                    value  = fields;
                    fields = undefined;
                }
                return this.__setPropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []), value);;
            };
        },
        is: function(property, alias) {
            var propertyName = !_.isUndefined(alias) ? alias : property;

            return {
                name: 0 !== propertyName.indexOf('is') ? 'is' + propertyName[0].toUpperCase() + propertyName.slice(1) : propertyName,
                body: function(fields, value) {
                    if (_.isUndefined(value)) {
                        value  = fields;
                        fields = undefined;
                    }
                    return this.__isPropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []), value);
                }
            }
        },
        has: function(property) {
            return function(fields) {
                return this.__hasPropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []));
            }
        },
        clear: function(property) {
            return function(fields) {
                return this.__clearPropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []));
            };
        },
        remove: function(property) {
            return function(fields) {
                return this.__removePropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []));
            }
        }
    }
});

