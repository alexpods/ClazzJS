/**
 * Property methods meta processor
 * Add common methods for property
 */
meta('Methods', {

    /**
     * Add common methods for property
     *
     * @param {object} object   Some object
     * @param {array}  methods  List of property methods
     * @param {string} property Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, methods, property) {

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethodToObject(methods[i], object, property);
        }
    },

    /**
     * Add specified method to object
     *
     * @param {string} name     Object name
     * @param {object} object   Object to which method will be added
     * @param {string} property Property name
     *
     * @this {metaProcessor}
     */
    addMethodToObject:  function(name, object, property) {
        var method = this.createMethod(name, property);
        object[method.name] = method.body;
    },

    /**
     * Creates method for specified property
     *
     * @param {string} name      Method name
     * @param {string} property  Property name
     *
     * @returns {function|object} Function or hash with 'name' and 'body' fields
     *
     * @throws {Error} if method does not exist
     *
     * @this {metaProcessor}
     */
    createMethod: function(name, property) {
        if (!(name in this._methods)) {
            throw new Error('Method "' + name + '" does not exist!');
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

    /**
     * Gets method name for specified property
     * Prepend property name with method name and capitalize first character of property name
     *
     * @param {string} property Property name
     * @param {string} method   Method name
     *
     * @returns {string} Method name for specified property
     *
     * @this {metaProcessor}
     */
    getMethodName: function(property, method) {

        var prefix = '';

        property = property.replace(/^(_+)/g, function(str) {
            prefix = str;
            return '';
        });

        var methodName = 'is' === method && 0 === property.indexOf('is')
                ? property
                : method + property[0].toUpperCase() + property.slice(1);


        return prefix + methodName;

    },


    /**
     * Sets property method
     *
     * @param {string}   name     Method name
     * @param {function} callback Method body
     *
     * @returns {metaProcessor} this
     *
     * @throws {Error} if method with specified name already exist
     *
     * @this {metaProcessor}
     */
    set: function(name, callback) {
        if (name in this._methods) {
            throw new Error('Method "' + name + '" already exist!');
        }
        this._methods[name] = callback;
        return this;
    },

    /**
     * Checks whether property method with specified name exist
     *
     * @param {string} name Method name
     * @returns {boolean} true if method exist
     *
     * @this {metaProcessor}
     */
    has: function(name) {
        return name in this._methods;
    },

    /**
     * Removes property method
     *
     * @param {string} name Method name
     * @returns {metaProcessor} this
     *
     * @this {metaProcessor}
     */
    remove: function(name) {
        if (!(name in this._methods)) {
            throw new Error('Method "' + name + '" does not exist!');
        }
        delete this._methods[name];
        return this;
    },

    /**
     * Property methods
     * @private
     */
    _methods: {

        /**
         * Property getter
         *
         * @param {string} property Property name
         * @returns {Function}
         */
        get: function(property) {
            return function(fields) {
                fields = _.isString(fields) ? fields.split('.') : fields || [];
                return this.__getPropertyValue([property].concat(fields));
            };
        },

        /**
         * Property setter
         *
         * @param {string} property Property name
         * @returns {Function}
         */
        set: function(property) {
            return function(fields, value) {
                if (_.isUndefined(value)) {
                    value  = fields;
                    fields = undefined;
                }
                fields = _.isString(fields) ? fields.split('.') : fields || [];
                return this.__setPropertyValue([property].concat(fields), value);
            };
        },

        /**
         * Checker whether property value is equals specified one.
         * If value does not specified - checks whether property value is not false
         *
         * @param {string} property Property name
         * @returns {Function}
         */
        is: function(property) {
            return function(fields, value) {
                if (_.isUndefined(value)) {
                    value  = fields;
                    fields = undefined;
                }
                fields = _.isString(fields) ? fields.split('.') : fields || [];
                return this.__isPropertyValue([property].concat(fields), value);
            }
        },

        /**
         * Check whether specified property with specified fields exist
         *
         * @param property
         * @returns {Function}
         */
        has: function(property) {
            return function(fields) {
                fields = _.isString(fields) ? fields.split('.') : fields || [];
                return this.__hasPropertyValue([property].concat(fields));
            }
        },

        /**
         * Clears property value
         * Array and hash properties sets to [] and {} respectively. Others set to `undefined`
         *
         * @param {string} property Property name
         * @returns {Function}
         */
        clear: function(property) {
            return function(fields) {
                fields = _.isString(fields) ? fields.split('.') : fields || [];
                return this.__clearPropertyValue([property].concat(fields));
            };
        },

        /**
         * Removes property value.
         * Really remove property in contrast to `clear` method
         *
         * @param property
         * @returns {Function}
         */
        remove: function(property) {
            return function(fields) {
                fields = _.isString(fields) ? fields.split('.') : fields || [];
                return this.__removePropertyValue([property].concat(fields));
            }
        }
    }
});

