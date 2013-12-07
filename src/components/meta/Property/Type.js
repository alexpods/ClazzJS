meta('Type', {

    SETTER_NAME: '__type__',

    SETTER_WEIGHT: -1000,

    process: function(object, type, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME, this.SETTER_WEIGHT, function(value, fields) {

            var fieldsType = type || {};

            for (var i = 0, ii = fields.length; i < ii; ++i) {

                var params = fieldsType[1] || {};

                if (!('element' in params)) {
                    return value;
                }
                fieldsType = params.element;
            }

            return self.apply(value, fieldsType, property, fields, object);
        });
    },

    apply: function(value, type, property, fields, object) {
        if (_.isUndefined(value) || _.isNull(value)) {
            return value;
        }
        var params = {};

        if (_.isArray(type)) {
            params = type[1] || {};
            type   = type[0];
        }

        if (!(type in this._types)) {
            throw new Error('Property type "' + type + '" does not exists!');
        }

        return this._types[type].call(this, value, params, property, fields, object);
    },

    addType: function(name, callback) {
        if (name in this._types) {
            throw new Error('Property type "' + name + '" is already exists!');
        }
        this._types[name] = callback;
        return this;
    },

    hasType: function(name) {
        return name in this._types;
    },

    removeType: function(name) {
        if (!(name in this._types)) {
            throw new Error('Property type "' + name + '" does not exists!');
        }
        delete this._types[name];
        return this;
    },

    setDefaultArrayDelimiter: function(delimiter) {
        if (!_.isString(delimiter) && !_.isRegExp(delimiter)) {
            throw new Error('Delimiter must be a string or a regular expression!');
        }
        this._defaultArrayDelimiter = delimiter;
        return this;
    },

    getDefaultArrayDelimiter: function() {
        return this._defaultArrayDelimiter;
    },

    _defaultArrayDelimiter:  /\s*,\s*/g,

    _types: {
        boolean: function(value) {
            return Boolean(value);
        },
        number: function(value, params, property) {
            value = Number(value);

            if ('min' in params && value < params.min) {
                throw new Error('Value "' + value + '" of property "' + property + '" must not be less then "' + params.min + '"!');
            }
            if ('max' in params && value > params.max) {
                throw new Error('Value "' + value + '" of property "' + property + '" must not be greater then "' + params.max + '"!');
            }
            return value;
        },
        string: function(value, params, property) {
            value = String(value);

            if ('pattern' in params && !params.pattern.test(value)) {
                throw new Error('Value "' + value + '" of property "' + property + '" does not match pattern "' + params.pattern + '"!');
            }
            if ('variants' in params && -1 === params.variants.indexOf(value)) {
                throw new Error('Value "' + value + '" of property "' + property + '" must be one of "' + params.variants.join(', ') + '"!');
            }
            return value;
        },
        datetime: function(value, params, property) {
            if (_.isNumber(value) && !isNaN(value)) {
                value = new Date(value);
            }
            else if (_.isString(value)) {
                value = new Date(Date.parse(value));
            }

            if (!(value instanceof Date)) {
                throw new Error('Value of property "' + property + '" must have datetime type!');
            }

            return value;
        },
        array: function(value, params, property, fields, object) {

            if (_.isString(value)) {
                value = value.split(params.delimiter || this._defaultArrayDelimiter);
            }

            if ('element' in params) {
                for (var i = 0, ii = value.length; i < ii; ++i) {
                    value[i] = this.apply(value[i], params.element, property, fields.concat(i), object);
                }
            }

            return value;
        },
        hash: function(value, params, property, fields, object) {

            if (!_.isObject(value)) {
                throw new Error('Value of property "' + [property].concat(fields).join('.') +'" must have object type!');
            }

            if ('keys' in params) {
                for (var key in value) {
                    if (-1 === params.keys.indexOf(key)) {
                        throw new Error('Unsupported hash key "' + key + '" for property "' + [property].concat(fields).join('.') + '"!');
                    }
                }
            }
            if ('element' in params) {
                for (var key in value) {
                    value[key] = this.apply.call(this, value[key], params.element, property, fields.concat(key), object);
                }
            }
            return value;
        },
        object: function(value, params, property, fields, object) {

            if (!_.isObject(value)) {
                throw new Error('Value of property "' + property + '" must have an object type!');
            }

            if ('instanceOf' in params) {

                var instanceOf = params.instanceOf;
                var clazzClazz = object.__isClazz ? object.__clazz : object.__clazz.__clazz;

                if (_.isString(instanceOf)) {
                    instanceOf = clazzClazz.getNamespace().adjustPath(instanceOf);

                    if (!value.__clazz) {
                        instanceOf = clazzClazz(instanceOf);
                    }
                }

                if (value.__clazz ? !value.__clazz.__isSubclazzOf(instanceOf) : !(value instanceof instanceOf)) {

                    var className = instanceOf.__isClazz
                        ? instanceOf.__name
                        : (_.isString(instanceOf) ? instanceOf : 'another');


                    throw new Error('Value of property "' + property + '" must be instance of ' + className + ' clazz!');
                }
            }

            return value;
        },
        function: function(value, params, property) {
            if (!_.isFunction(value)) {
                throw new Error('Value of property "' + property + '" must have function type');
            }
            return value;
        }
    }
});