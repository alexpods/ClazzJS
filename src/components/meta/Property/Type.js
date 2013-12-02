meta('Type', {

    SETTER_NAME: '__type__',

    process: function(object, type, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME, function(value) {
            return self.apply(value, type, property);
        });
    },

    apply: function(value, type, property) {
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

        return this._types[type].call(this, value, params, property);
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
        array: function(value, params, property) {
            var i, ii, type;

            if (_.isString(value)) {
                value = value.split(params.delimiter || this._defaultArrayDelimiter);
            }
            if ('element' in params) {
                type = [].concat(params.element);
                for (i = 0, ii = value.length; i < ii; ++i) {
                    value[i] = this.apply.call(this, value[i], type, property + '.' + i);
                }
            }
            return value;
        },
        hash: function(value, params, property) {
            var key, type;

            if (!_.isObject(value)) {
                throw new Error('Value of property "' + property +'" must have object type!');
            }

            if ('keys' in params) {
                for (key in value) {
                    if (!(key in params.keys)) {
                        throw new Error('Unsupported hash key "' + key + '" for property "' + property + '"!');
                    }
                }
            }
            if ('element' in params) {
                type = [].concat(params.element);
                for (key in value) {
                    value[key] = this.apply.call(this, value[key], type, property + '.' + key);
                }
            }
            return value;
        },
        object: function(value, params, property) {

            if ('instanceof' in params) {
                if (!(value instanceof params.instanceof)) {
                    value = new klass(value);
                }
            }

            if (!_.isObject(value)) {
                throw new Error('Value of property "' + property + '" must have object type!');
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