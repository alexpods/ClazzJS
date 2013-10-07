Meta('Clazz.Property.Type', {

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
            return self.checkValue(value, type, params, property);
        });
    },

    checkValue: function(value, type, params, property) {
        return this.TYPES[type].call(this, value, params, property);
    },

    TYPES: {
        boolean: function(value) {
            return Boolean(value);
        },
        number: function(value, params) {
            value = Number(value);
            if ('min' in params && value < params['min']) {
                throw new Error('Value "' + value + '" must not be less then "' + params['min'] + '"!');
            }
            if ('max' in params && value > params['max']) {
                throw new Error('Value "' + value + '" must not be greater then "' + params['max'] + '"!');
            }
            return value;
        },
        string: function(value, params) {
            value = String(value);
            if ('pattern' in params && !params.pattern.test(value)) {
                throw new Error('Value "' + value + '" does not match pattern "' + params.pattern + '"!');
            }
            if ('variants' in params && -1 === params.variants.indexOf(value)) {
                throw new Error('Value "' + value + '" must be one of "' + params.variants.join(', ') + '"!');
            }
            return value;
        },
        datetime: function(value) {
            if (!(value instanceof Date)) {
                value = new Date(Date.parse(value));
            }
            return value;
        },
        object: function(value, params, property) {
            if (typeof value !== 'object' || Object.prototype.toString.call(value) === '[object Array]') {
                throw new Error('Incorrect value: not object type for property "' + property + '"!');
            }
            if ('instanceof' in params) {
                var clazz = params.instanceof;

                if (Object.prototype.toString.call(clazz) === '[object Array]') {
                    clazz = Clazz(clazz[0], clazz[1] || []);
                }
                if (!(value instanceof clazz)) {
                    throw new Error('Value does not instance of clazz "' + clazz.NAME + '"!');
                }
            }
            return value
        },
        array: function(value, params) {
            return typeof value === 'string' ? value.split(params['delimiter'] || ',') : [].concat(value);
        },
        hash: function(value, params, property) {
            if ({}.constructor !== value.constructor) {
                throw new Error('Incorrect value: not hash type for property "' + property +'"!');
            }
            if ('keys' in params) {
                for (var prop in value) {
                    if (!(prop in params.keys)) {
                        throw new Error('Unsupported hash key "' + prop + '"!');
                    }
                }
            }
            if ('element' in params) {
                this.checkValue.apply(this, [].concat(params.element));
            }
            return value;
        },
        clazz: function(value, params, property) {
            if (typeof value !== 'function' || !('NAME' in value) || !('parent' in value)) {
                throw new Error('Incorrect value: not clazz type for property "' + property +'"!');
            }
            return value;
        }
    }
})