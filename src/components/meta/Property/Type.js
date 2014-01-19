/**
 * Property type meta processor
 * Add property setter which checks and converts property value according to its type
 */
meta('Type', {

    SETTER_NAME: '__type__',
    SETTER_WEIGHT: -1000,

    /**
     * Default array delimiter (for 'array' property type)
     */
    _defaultArrayDelimiter:  /\s*,\s*/g,

    /**
     * Add property setter which checks and converts property value according to its type
     *
     * @param {object} object   Some object
     * @param {string} type     Property type
     * @param {string} property Property name
     *
     * @this {metaProcessor}
     */
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

    /**
     * Check and converts property value according to its type
     *
     * @param {*}      value    Property value
     * @param {string} type     Property type
     * @param {string} property Property name
     * @param {array}  fields   Property fields
     * @param {object} object   Object to which property belongs
     *
     * @throws {Error} if specified property type does not exist
     *
     * @this {metaProcessor}
     */
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
            throw new Error('Property type "' + type + '" does not exist!');
        }

        return this._types[type].call(this, value, params, property, fields, object);
    },

    /**
     * Sets property type
     *
     * @param {string}   name     Type name
     * @param {function} callback Type handler
     * @returns {metaProcessor} this
     *
     * @throws {Error} if property type already exists
     *
     * @this {metaProcessor}
     */
    set: function(name, callback) {
        if (name in this._types) {
            throw new Error('Property type "' + name + '" already exists!');
        }
        this._types[name] = callback;
        return this;
    },

    /**
     * Checks whether specified property type exists
     *
     * @param {string}  name Type name
     * @returns {boolean} true if property type exists
     *
     * @this {metaProcessor}
     */
    has: function(name) {
        return name in this._types;
    },

    /**
     * Removes specified property type
     *
     * @param {string} name Type name
     * @returns {metaProcessor} this
     *
     * @throws {Error} if property type does not exist
     *
     * @this {metaProcessor}
     */
    remove: function(name) {
        if (!(name in this._types)) {
            throw new Error('Property type "' + name + '" does not exist!');
        }
        delete this._types[name];
        return this;
    },

    /**
     * Sets default array delimiter
     *
     * @param {string} delimiter Array delimiter
     * @returns {metaProcessor} this
     *
     * @throws {Error} if delimiter is not a string
     *
     * @this {metaProcessor}
     */
    setDefaultArrayDelimiter: function(delimiter) {
        if (!_.isString(delimiter) && !_.isRegExp(delimiter)) {
            throw new Error('Delimiter must be a string or a regular expression!');
        }
        this._defaultArrayDelimiter = delimiter;
        return this;
    },

    /**
     * Gets default array delimiter
     *
     * @returns {string} Array delimiter
     *
     * @this {metaProcessor}
     */
    getDefaultArrayDelimiter: function() {
        return this._defaultArrayDelimiter;
    },

    /**
     * Property types
     */
    _types: {

        /**
         * Boolean property type
         * Converts value to boolean
         *
         * @param {*} value Property value
         *
         * @returns {boolean} Processed property value
         *
         * @this {metaProcessor}
         */
        boolean: function(value) {
            return !!value;
        },

        /**
         * Number property type
         * Converts value to number, applies 'min' and 'max' parameters
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         *
         * @throws {Error} if value less then 'min' parameter
         * @throws {Error} if value greater then 'max' parameter
         *
         * @returns {number} Processed property value
         *
         * @this {metaProcessor}
         */
        number: function(value, params, property) {
            value = +value;

            if ('min' in params && value < params.min) {
                throw new Error('Value "' + value +
                    '" of property "' + property + '" must not be less then "' + params.min + '"!');
            }
            if ('max' in params && value > params.max) {
                throw new Error('Value "' + value +
                    '" of property "' + property + '" must not be greater then "' + params.max + '"!');
            }
            return value;
        },

        /**
         * String property type
         * Converts value to string, applies 'pattern' and 'variants' parameters
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         *
         * @throws {Error} if value does not match 'pattern'
         * @throws {Error} if value does not one of 'variants' values
         *
         * @returns {string} Processed property value
         *
         * @this {metaProcessor}
         */
        string: function(value, params, property) {
            value = ''+value;

            if ('pattern' in params && !params.pattern.test(value)) {
                throw new Error('Value "' + value +
                    '" of property "' + property + '" does not match pattern "' + params.pattern + '"!');
            }
            if ('variants' in params && -1 === params.variants.indexOf(value)) {
                throw new Error('Value "' + value +
                    '" of property "' + property + '" must be one of "' + params.variants.join(', ') + '"!');
            }
            return value;
        },

        /**
         * Datetime property type
         * Converts value to Date
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         *
         * @throws {Error} if value could not be successfully converted to Date
         *
         * @returns {Date} Processed property value
         *
         * @this {metaProcessor}
         */
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

        /**
         * Array property type
         * Converts value to array, applies 'element' parameter
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         * @param {array}  fields   Property fields
         * @param {object} object   Object to which property belongs
         *
         * @returns {array} Processed property value
         *
         * @this {metaProcessor}
         */
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

        /**
         * Hash property type
         * Check 'simple object' type of value, applies 'keys' and 'element' parameters
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         * @param {array}  fields   Property fields
         * @param {object} object   Object to which property belongs
         *
         * @throws {Error} if property value does not a simple object
         * @throws {Error} if hash has unsupported keys
         *
         * @returns {object} Processed property value
         *
         * @this {metaProcessor}
         */
        hash: function(value, params, property, fields, object) {
            var that = this;

            if (!_.isSimpleObject(value)) {
                throw new Error('Value of property "' +
                    [property].concat(fields).join('.') +'" must be a simple object!');
            }

            if ('keys' in params) {
                _.each(params.keys, function(key) {
                    if (-1 === params.keys.indexOf(key)) {
                        throw new Error('Unsupported hash key "' + key +
                            '" for property "' + [property].concat(fields).join('.') + '"!');
                    }
                });
            }
            if ('element' in params) {
                _.each(value, function(key) {
                    value[key] = that.apply(value[key], params.element, property, fields.concat(key), object);
                }) ;
            }

            return value;
        },

        /**
         * Object property type
         * Check 'object' type of value, applies 'instanceOf' parameters
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         * @param {array}  fields   Property fields
         * @param {object} object   Object to which property belongs
         *
         * @throws {Error} if property value does not an object
         * @throws {Error} if hash has unsupported keys
         *
         * @returns {object} Processed property value
         *
         * @this {metaProcessor}
         */
        object: function(value, params, property, fields, object) {

            if (!_.isObject(value)) {
                throw new Error('Value of property "' + property + '" must be an object!');
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


                    throw new Error('Value of property "' + property +
                        '" must be instance of ' + className + ' clazz!');
                }
            }

            return value;
        },

        /**
         * Object property type
         * Check 'function' type of value
         *
         * @param {*}      value    Property value
         * @param {object} params   Property parameters
         * @param {string} property Property name
         *
         * @throws {Error} if property value does not a function
         *
         * @returns {object} Processed property value
         *
         * @this {metaProcessor}
         */
        "function": function(value, params, property) {
            if (!_.isFunction(value)) {
                throw new Error('Value of property "' + property + '" must be a function');
            }
            return value;
        }
    }
});