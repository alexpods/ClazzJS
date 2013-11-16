meta.processor('Clazz.Property.Type', {

    process: function(object, type, property) {
        var self = this, params = {};

        if (Object.prototype.toString.apply(type) === '[object Array]') {
            params = type[1] || [];
            type   = type[0];
        }
        if (!(type in this.TYPES)) {
            throw new Error('Unsupported property type "' + type + '"!');
        }

        object.__setProperty(property, 'type',  type);

        object.__addSetter(property, function(value) {
            return self.convertAndCheckValue(value, type, params, property);
        });
    },

    convertAndCheckValue: function(value, type, params, property) {
        if (!(type in this.TYPES)) {
            throw new Error('Type "' + type + '" does not exists!');
        }

        return this.TYPES[type].call(this, value, params, property);
    },

    DEFAULT_ARRAY_DELIMITER: /\s*,\s*/g,

    TYPES: {
        boolean: function(value) {
            return Boolean(value);
        },
        number: function(value, params, property) {
            value = Number(value);

            if ('min' in params && value < params['min']) {
                throw new Error('Value "' + value + '" must not be less then "' + params['min'] + '"!');
            }
            if ('max' in params && value > params['max']) {
                throw new Error('Value "' + value + '" of property "' + property + '" must not be greater then "' + params['max'] + '"!');
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
            if (!isNaN(value) && (typeof value === 'number' || value instanceof Number)) {
                value = new Date(value);
            }
            else if (typeof value === 'string' || value instanceof String) {
                value = new Date(Date.parse(value));
            }
            if (!(value instanceof Date)) {
                throw new Error('Value of property "' + property + '" must be compatible with datetime type!');
            }
            return value;
        },
        array: function(value, params, property) {
            var i, ii, type;

            if (typeof value === 'string' || value instanceof String) {
                value = value.split(params.delimiter || this.DEFAULT_ARRAY_DELIMITER);
            }
            if ('element' in params) {
                type = [].concat(params.element);
                for (i = 0, ii = value.length; i < ii; ++i) {
                    value[i] = this.convertAndCheckValue.call(this, value[i], type[0], type[1] || {}, property + '.' + i);
                }
            }
            return value;
        },
        hash: function(value, params, property) {
            var key, type;

            if ({}.constructor !== value.constructor) {
                throw new Error('Value of property "' + property +'" must be compatible with hash type!');
            }

            if ('keys' in params) {
                for (key in value) {
                    if (!(key in params.keys)) {
                        throw new Error('Unsupported hash key "' + prop + '" for property "' + property + '"!');
                    }
                }
            }
            if ('element' in params) {
                type = [].concat(params.element);
                for (key in value) {
                    value[key] = this.convertAndCheckValue.call(this, value[key], type[0], type[1] || {}, property + '.' + key);
                }
            }
            return value;
        },
        object: function(value, params, property) {

            if ('instanceof' in params) {
                var klass = params.instanceof;

                if (typeof klass === 'string' || klass instanceof String) {
                    klass = [String(klass)];
                }
                if (Object.prototype.toString.call(clazz) === '[object Array]') {
                    klass = clazz(klass[0], klass[1] || []);
                }
                if (!(value instanceof klass)) {
                    value = new klass(value);
                }
            }

            if (typeof value !== 'object') {
                throw new Error('Value of property "' + property + '" must be compatible with object type!');
            }

            return value;
        }
    }
});