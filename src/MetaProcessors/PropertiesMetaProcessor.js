var PropertiesMetaProcessor = {

    process: function(object, properties) {
        for (var property in properties) {
            this.Meta.process(object, properties[property], property)
        }
    },

    Meta: new Meta({

        type: {
            process: function(object, type, option, property) {
                var self = this, params = {};
                if (Object.prototype.toString.apply(type) === '[object Array]') {
                    params = type[1];
                    type   = type[0];
                }
                if (!(type in this.TYPES)) {
                    throw new Error('Unsupported property type "' + type + '"!');
                }

                object.__setProperty(property, 'type',  type);

                object.__addSetter(property, function(value) {
                    return self.checkValue(value, type, params);
                });
            },

            checkValue: function(value, type, params) {
                return this.TYPES[type].call(this, value, params);
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
                    if ('pattern' in params && !params['pattern'].test(value)) {
                        throw new Error('Value "' + value + '" does not match pattern "' + params['pattern'] + '"!');
                    }
                    return value;
                },
                datetime: function(value) {
                    if (!(value instanceof Date)) {
                        value = new Date(Date.parse(value));
                    }
                    return value;
                },
                array: function(value, params) {
                    return typeof value === 'string' ? value.split(params['delimiter'] || ',') : [].concat(value);
                },
                hash: function(value, params) {
                    if ({}.constructor !== value.constructor) {
                        throw new Error('Incorrect value: not hash type!');
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
                }
            }
        },

        default: {
            process: function(object, defaultValue, option, property) {
                var type;

                if (typeof defaultValue === 'function') {
                    defaultValue = defaultValue();
                }

                object.__setProperty(property, 'default', defaultValue);
            }
        },

        methods: {

            process: function(object, methods, option, property) {
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
        },

        converters: function(object, converters, option, property) {

            object.__addSetter(property, 1000, function(value) {
                for (var name in converters) {
                    value = converters[name].call(this, value);
                }
                return value;
            })
        },

        constraints: function(object, constraints, option, property) {

            object.__addSetter(property, function(value) {
                for (var name in constraints) {
                    if (!constraints[name].call(this, value)) {
                        throw new Error('Constraint "' + name + '" was failed!');
                    }
                }
                return value;
            })
        }
    })
}