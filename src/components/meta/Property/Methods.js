meta('Methods', {

    process: function(object, methods, property) {

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethodToObject(methods[i], object, property);
        }
    },

    addMethodToObject:  function(name, object, property) {
        var method = this.createMethod(name, property);
        object[method.name] = method.body;
    },

    createMethod: function(name, property) {
        if (!(name in this._methods)) {
            throw new Error('Method "' + name + '" does not exists!');
        }
        var method = this._methods[name](property);

        if (_.isFunction(method)) {
            method = {
                name: this.getMethodName(property, name),
                body: method
            }
        }
        return method;
    },

    getMethodName: function(propertyName, method) {

        var prefix = '';

        propertyName = propertyName.replace(/^(_+)/g, function(str) {
            prefix = str;
            return '';
        });

        var methodName = 'is' === method && 0 === propertyName.indexOf('is')
                ? propertyName
                : method + propertyName[0].toUpperCase() + propertyName.slice(1);


        return prefix + methodName;

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
        is: function(property) {
            return function(fields, value) {
                if (_.isUndefined(value)) {
                    value  = fields;
                    fields = undefined;
                }
                return this.__isPropertyValue([property].concat(_.isString(fields) ? fields.split('.') : fields || []), value);
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

