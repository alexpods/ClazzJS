/**
 * Properties meta processor
 * Process properties data for clazz, implements properties interface
 */
meta('Properties', {

    /**
     * Property meta processor
     */
    _processor: 'Property',

    /**
     * Applies properties to clazz and its prototype
     *
     * @param {clazz}  clazz    Clazz
     * @param {object} metaData Meta data with properties 'methods' and 'clazz_methods'
     *
     * @this {metaProcessor}
     */
    process: function(clazz, metaData) {
        this.applyProperties(clazz, metaData.clazz_properties || {});
        this.applyProperties(clazz.prototype, metaData.properties || {});
    },

    /**
     * Apply properties to object
     * Implements properties interface, call property meta processor for each property
     *
     * @param {clazz|object} object     Clazz of its prototype
     * @param {object}       properties Properties
     *
     * @this {metaProcessor}
     */
    applyProperties: function(object, properties) {
        if (!object.__isInterfaceImplemented('properties')) {
            object.__implementInterface('properties', this.interface);
        }

        object.__initProperties();

        var propertyMetaProcessor = this.getPropertyMetaProcessor();

        _.each(properties, function(data, property) {
            propertyMetaProcessor.process(object, data, property);
        });
    },

    /**
     * Gets property meta processor
     *
     * @returns {metaProcessor} Property meta processor
     *
     * @this {metaProcessor}
     */
    get function() {
        var processor = this._processor;

        if (_.isString(processor)) {
            this._processor = meta(processor);
        }

        return processor;
    },

    /**
     * Sets property meta processor
     *
     * @param   {metaProcessor|string} processor Meta processor or its name
     * @returns {metaProcessor} this
     *
     * @this {metaProcessor}
     */
    set: function(processor) {
        this._processor = processor;
        return this;
    },

    /**
     * Properties interface
     */
    interface: {

        /**
         * Initialization of properties
         *
         * @this {clazz|object}
         */
        __initProperties: function() {
            this.__properties     = {};
            this.__setters        = {};
            this.__getters        = {};
        },

        /**
         * Sets properties defaults values
         *
         * @this {clazz|object}
         */
        __setDefaults: function() {

            var that = this;
            var propertiesParams = that.__getPropertiesParam();

            _.each(propertiesParams, function(params, property) {

                var value = this.__getPropertyValue(property);

                if (_.isUndefined(value) && 'default' in params) {

                    var defaultValue = params.default;

                    if (_.isFunction(defaultValue)) {
                        defaultValue = defaultValue.call(this);
                    }

                    if (defaultValue) {
                        if ((_.isSimpleObject(defaultValue)) || _.isArray(defaultValue)) {
                            defaultValue = _.clone(defaultValue)
                        }
                    }

                    that.__setPropertyValue(property, defaultValue, false);
                }
            });
        },

        /**
         * Sets properties parameters
         *
         * @param   {object} parameters Properties parameters
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __setPropertiesParam: function(parameters) {
            var that = this;
            _.each(parameters, function(params, property) {
                that.__setPropertyParam(property, params);
            });
            return that;
        },

        /**
         * Gets properties parameters
         *
         * @returns {object} Properties parameters
         *
         * @this {clazz|object}
         */
        __getPropertiesParam: function() {
            return this.__collectAllPropertyValues('__properties', 2);
        },

        /**
         * Sets property parameter
         *
         * @param {string} property Property name
         * @param {string} param    Parameter name
         * @param {*}      value    Parameter value
         *
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __setPropertyParam: function(property, param, value) {
            var params = {};

            if (!_.isUndefined(value)) {
                params[param] = value;
            }
            else if (_.isObject(param)) {
                _.extend(params, param);
            }

            if (!(property in this.__properties)) {
                this.__properties[property] = {};
            }

            _.extend(this.__properties[property], params);

            return this;
        },

        /**
         * Gets single property parameter or all property parameters
         *
         * @param {string}           property Property name
         * @param {string|undefined} param    Parameter name.
         *                                    If it does not specified - all property parameters are returned.
         *
         * @returns {*} Single property parameter or all property parameters
         *
         * @this {clazz|object}
         */
        __getPropertyParam: function(property, param) {
            var params = this.__collectAllPropertyValues.apply(this, ['__properties', 2, property].concat(param || []))[property];
            return param ? params[param] : params;
        },

        /**
         * Checks whether specified property exists
         *
         * @param   {string} property Property name
         * @returns {boolean} true if property exists
         *
         * @this {clazz|object}
         */
        __hasProperty: function(property) {
            return ('_' + property) in this;
        },

        /**
         * Gets property value
         *
         * @param {string|array} fields   Property fields
         * @param {object}       options  Options (emit, check)
         * @returns {*} Property value
         *
         * @this {clazz|object}
         */
        __getPropertyValue: function(fields, options) {
            fields  = this.__resolveFields(fields);
            options = this.__resolveOptions(options);

            var property = fields.shift();

            if (options.check) {
                this.__checkProperty(property, {
                    readable: true,
                    method:  'get',
                    params:   _.toArray(arguments)
                });
            }

            var value = this.__applyGetters(property, this['_' + property]);

            for (var i = 0, ii = fields.length; i < ii; ++i) {

                var field = fields[i];

                if (!(field in value)) {
                    throw new Error('Property "' + [property].concat(fields.slice(0, i+1)).join('.') + '" does not exists!');
                }

                value = this.__applyGetters(property, value[field], fields.slice(0, i+1));
            }

            if (options.emit && this.__checkEmitEvent()) {
                var prop = [property].concat(fields).join('.');

                this.__emitEvent('property.' + prop + '.get',  value);
                this.__emitEvent('property.get', prop, value);
            }

            return value;
        },

        /**
         * Checks whether specified property exist whether
         *
         * @param {string|array} fields   Property fields
         * @param {object}       options  Options (emit, check)
         *
         * @returns {booelan} true if property exists
         *
         * @this {clazz|object}
         */
        __hasPropertyValue: function(fields, options) {
            fields  = this.__resolveFields(fields);
            options = this.__resolveOptions(options);

            var property = fields.shift();

            if (options.check) {
                this.__checkProperty(property, {
                    readable: true,
                    method:   'has',
                    params:  _.toArray(arguments)
                });
            }

            var result = null;
            var value  = this.__applyGetters(property, this['_' + property]);

            for (var i = 0, ii = fields.length; i < ii; ++i) {

                var field = fields[i];

                if (!(field in value)) {
                    result = false;
                    break;
                }

                value = this.__applyGetters(property, value[field], fields.slice(0, i+1));
            }

            if (_.isNull(result)) {
                result = !_.isUndefined(value) && !_.isNull(value);
            }

            if (options.emit && this.__checkEmitEvent()) {
                var prop = [property].concat(fields).join('.');

                this.__emitEvent('property.' + prop + '.has',  result);
                this.__emitEvent('property.has', prop, result);
            }

            return result;
        },

        /**
         * Checker whether property value is equals specified one.
         * If value does not specified - checks whether property value is not false
         *
         * @param {string|array} fields         Property fields
         * @param {*}            compareValue   Value for comparison
         * @param {object}       options        Options (emit, check)
         *
         * @returns {booelan} true if property value is equals to specified or or is not false
         *
         * @this {clazz|object}
         */
        __isPropertyValue: function(fields, compareValue, options) {
            fields  = this.__resolveFields(fields);
            options = this.__resolveOptions(options);

            var property = fields.shift();

            if (options.check) {
                this.__checkProperty(property, {
                    readable: true,
                    method:   'is',
                    params:   _.toArray(arguments)
                });
            }

            var value  = this.__getPropertyValue([property].concat(fields), false);
            var result = !_.isUndefined(compareValue) ? value === compareValue : !!value;

            if (options.emit && this.__checkEmitEvent()) {
                var prop = [property].concat(fields).join('.');

                this.__emitEvent('property.' +  prop + '.is',  result);
                this.__emitEvent('property.is', prop, result);
            }

            return result;
        },

        /**
         * Clears property value
         * Array and hash properties sets to [] and {} respectively. Others set to `undefined`
         *
         * @param {string|array} fields   Property fields
         * @param {object}       options  Options (emit, check)
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __clearPropertyValue: function(fields, options) {
            fields  = this.__resolveFields(fields);
            options = this.__resolveOptions(options);

            var property = fields.shift();

            if (options.check) {
                this.__checkProperty(property, {
                    writable: true,
                    method:   'clear',
                    params:   _.toArray(arguments)
                });
            }

            var field, container;

            if (fields.length) {
                field     = _.last(fields);
                container = this.__getPropertyValue([property].concat(fields).slice(0, -1), false);

                if (!(field in container)) {
                    throw new Error('Property "' + [property].concat(fields).join('.') + '" does not exists!');
                }
            }
            else {
                field     = '_' + property;
                container = this;
            }

            var oldValue =  container[field];
            var newValue = (_.isSimpleObject(oldValue) && {}) || (_.isArray(oldValue) && []) ||  undefined;

            container[field] = newValue;

            if (options.emit && this.__checkEmitEvent()) {
                this.__emitPropertyClear([property].concat(fields), oldValue, newValue);
            }

            return this;
        },

        /**
         * Removes property value.
         * Really remove property in contrast to `clear` method
         *
         * @param {string|array} fields   Property fields
         * @param {object}       options  Options (emit, check)
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __removePropertyValue: function(fields, options) {
            fields  = this.__resolveFields(fields);
            options = this.__resolveOptions(options);

            var property = fields.shift();

            if (options.check) {
                this.__checkProperty(property, {
                    writable: true,
                    method:   'remove',
                    params:  _.toArray(arguments)
                });
            }

            var field, container;

            if (fields.length) {
                field     = _.last(fields);
                container = this.__getPropertyValue([property].concat(fields).slice(0, -1));

                if (!(field in container)) {
                    return this;
                }
            }
            else {
                field     = '_' + property;
                container = this;
            }

            var oldValue =  container[field];

            if (fields.length) {
                delete container[field]
            }
            else {
                container[field] = undefined;
            }

            if (options.emit && this.__checkEmitEvent()) {
                this.__emitPropertyRemove([property].concat(fields), oldValue);
            }
            return this;
        },

        /**
         * Sets property value
         *
         * @param {string|array} fields   Property fields
         * @param {*}            value    Property value
         * @param {object}       options  Options (emit, check)
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __setPropertyValue: function(fields, value, options) {
            fields  = this.__resolveFields(fields);
            options = this.__resolveOptions(options);

            var property = fields.shift();

            if (options.check) {
                this.__checkProperty(property, {
                    writable: true,
                    method:   'set',
                    params:   _.toArray(arguments)
                });
            }

            var field, container;

            if (fields.length) {
                field     = _.last(fields);
                container = this.__getPropertyValue([property].concat(fields).slice(0, -1), false);
            }
            else {
                field     = '_' + property;
                container = this;
            }

            var wasExisted = field in container;
            var oldValue   = container[field];
            var newValue   = this.__applySetters(property, value, fields);

            container[field] = newValue;

            if (options.emit && this.__checkEmitEvent()) {
                this.__emitPropertySet([property].concat(fields), newValue, oldValue, wasExisted);
            }

            return this;
        },

        /**
         * Resolves property fields
         * If fields is string - converts it to array
         *
         * @param {string|array} fields Fields
         * @returns {array} Resolved fields
         *
         * @this {clazz|object}
         */
        __resolveFields: function(fields) {

            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            return fields;
        },

        /**
         * Resolves property method options
         * Add absent 'emit' and 'check' options
         *
         * @param   {object} options Property method options
         * @returns {object} Resolved property options
         *
         * @this {clazz|object}
         */
        __resolveOptions: function(options) {
            if (_.isUndefined(options)) {
                options = {};
            }
            if (!_.isObject(options)) {
                options = { emit: options, check: options };
            }
            return _.extend({ emit:  true, check: true }, options);
        },

        /**
         * Checks property on existence and several options
         *
         * @param {string} property Property name
         * @param {object} options  Checking options (writable, readable, method, params)
         * @returns {boolean} true if property is OK
         *
         * @this {clazz|object}
         */
        __isProperty: function(property, options) {
            return this.__checkProperty(property, options, false);
        },

        /**
         * Checks property on existence and several options
         *
         * @param {string}  property   Property name
         * @param {object}  options    Checking options (writable, readable, method, params)
         * @param {boolean} throwError if true throws errors, if false return result of check
         * @returns {boolean} Check result
         *
         * @this {clazz|object}
         */
        __checkProperty: function(property, options, throwError) {
            throwError = !_.isUndefined(throwError) ? throwError : true;

            var that = this;

            try {
                if (!this.__hasProperty(property)) {
                    throw 'Property "' + property + '" does not exists!';
                }

                if ('readable' in options || 'writable' in options) {

                    var params = this.__getPropertyParam(property);
                    var rights = ['readable', 'writable'];

                    for (var i = 0, ii = rights.length; i < ii; ++i) {
                        if (!checkRight(rights[i], options, params)) {
                            throw '"' + rights[i] + '" check was failed for property "' + property + '"!';
                        }
                    }
                }
            }
            catch (error) {
                if (!_.isString(error)) {
                    throw error;
                }
                if (throwError) {
                    throw new Error(error);
                }
                return false;
            }
            return true;


            function checkRight(right, options, params) {
                if (!(right in options)) {
                    return true;
                }

                var value = right in params
                    ? (_.isFunction(params[right]) ? params[right].call(that, options.method, options.params) : params[right])
                    : true;

                return options[right] == !!value;
            }
        },

        /**
         * Emits property remove events
         *
         * @param {string|array} fields   Property fields
         * @param {*}            oldValue Property value before removing
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __emitPropertyRemove: function(fields, oldValue) {
            fields = this.__resolveFields(fields);

            var prop, key;

            this.__checkEmitEvent(true);

            if (fields.length) {
                prop = fields.slice(0, -1).join('.');
                key  = _.last(fields);

                this.__emitEvent('property.' + prop + '.item_removed', key, oldValue);
                this.__emitEvent('property.item_removed', prop, key, oldValue);
            }

            prop = fields.join('.');

            this.__emitEvent('property.' + prop + '.remove',  oldValue);
            this.__emitEvent('property.remove', prop, oldValue);

            return this;
        },

        /**
         * Emits property clear events
         *
         * @param {string|array} fields   Property fields
         * @param {*}            oldValue Property value before clearing
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __emitPropertyClear: function(fields, oldValue) {
            fields = this.__resolveFields(fields);

            var prop, key, i, ii;

            this.__checkEmitEvent(true);

            if (_.isSimpleObject(oldValue)) {
                for (key in oldValue) {
                    this.__emitPropertyRemove(fields.concat(key), oldValue[key]);
                }
            }
            else if (_.isArray(oldValue)) {
                for (i = 0, ii = oldValue.length; i < ii; ++i) {
                    this.__emitPropertyRemove(fields.concat(i), oldValue[i]);
                }
            }

            prop = fields.join('.');

            this.__emitEvent('property.' + prop + '.clear', oldValue);
            this.__emitEvent('property.clear', prop, oldValue);

            return this;
        },

        /**
         * Emits property set events
         *
         * @param {string|array} fields    Property fields
         * @param {*}            newValue  New property value
         * @param {*}            oldValue  Old property value
         * @param {boolean}      wasExists true if property was exist before setting
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __emitPropertySet: function(fields, newValue, oldValue, wasExists) {
            fields = this.__resolveFields(fields);

            var prop, event, key, i, ii;

            this.__checkEmitEvent(true);

            var isEqual = true;

            if (_.isSimpleObject(newValue) && _.isSimpleObject(oldValue)) {
                for (key in oldValue) {
                    if (newValue[key] !== oldValue[key]) {
                        isEqual = false;
                        break;
                    }
                }
            }
            else if (_.isArray(newValue) && _.isArray(oldValue)) {
                for (i = 0, ii = oldValue.length; i < ii; ++i) {
                    if (newValue[i] !== oldValue[i]) {
                        isEqual = false;
                        break;
                    }
                }
            }
            else if (newValue !== oldValue) {
                isEqual = false;
            }

            if (!isEqual) {
                prop  = fields.join('.');

                this.__emitEvent('property.' + prop + '.' + 'set', newValue, oldValue);
                this.__emitEvent('property.set', prop, newValue, oldValue);

                if (fields.length && !wasExists) {
                    prop  = fields.slice(0,-1).join('.');
                    key   = _.last(fields);

                    this.__emitEvent('property.' + prop + '.item_added', key, newValue);
                    this.__emitEvent('property.item_added', prop, key, newValue);
                }
            }

            return this;
        },

        /**
         * Checks whether __emitEvent method exists
         *
         * @param  {boolean} throwError if true - throw error if method does not exist
         * @returns {boolean} true im method exist
         *
         * @throws {Error} if method does not exist
         *
         * @this {clazz|object}
         */
        __checkEmitEvent: function(throwError) {
            var check = _.isFunction(this.__emitEvent);

            if (throwError && !check) {
                throw new Error('__emitEvent method does not realized!');
            }

            return check;
        },

        /**
         * Adds property setter
         *
         * @param {string}   property Property name
         * @param {string}   name     Setter name
         * @param {number}   weight   Setter weight
         * @param {function} callback Setter handler
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __addSetter: function(property, name, weight, callback) {
            if (_.isUndefined(callback)) {
                callback = weight;
                weight   = 0;
            }
            if (_.isArray(callback)) {
                weight   = callback[0];
                callback = callback[1];
            }
            else if (!_.isFunction(callback)) {
                throw new Error('Setter callback must be a function!');
            }
            if (!(property in this.__setters)) {
                this.__setters[property] = {};
            }
            this.__setters[property][name] = [weight, callback];

            return this;
        },

        /**
         * Gets property setters
         *
         * @param {string}   property Property name
         * @param {boolean}  sorted   If true returns setters in sorted order
         * @returns {array}  Property setters;
         *
         * @this {clazz|object}
         */
        __getSetters: function(property, sorted) {
            var setters = this.__collectAllPropertyValues.apply(this, ['__setters', 1].concat(property || []));

            if (!property) {
                return setters;
            }

            setters = setters[property];

            if (!sorted) {
                return setters[property];
            }

            var sortedSetters = [];

            for (var name in setters) {
                sortedSetters.push(setters[name]);
            }

            sortedSetters = sortedSetters.sort(function(s1, s2) { return s2[0] - s1[0]; });

            for (var i = 0, ii = sortedSetters.length; i < ii; ++i) {
                sortedSetters[i] = sortedSetters[i][1];
            }

            return sortedSetters;
        },

        /**
         * Applies setters to value
         *
         * @param {string}       property Property name
         * @param {*}            value    Property value
         * @param {string|array} fields   Property fields
         *
         * @returns {*} Processed value
         *
         * @this {clazz|object}
         */
        __applySetters: function(property, value, fields) {
            fields = fields || [];

            var setters = this.__getSetters(property, true);

            for (var i = 0, ii = setters.length; i < ii; ++i) {

                var result = setters[i].call(this, value, fields);

                if (!_.isUndefined(result)) {
                    value = result;
                }
            }

            return value;
        },

        /**
         * Adds property getter
         *
         * @param {string}   property Property name
         * @param {string}   name     Getter name
         * @param {number}   weight   Getter weight
         * @param {function} callback Getter handler
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __addGetter: function(property, name, weight, callback) {
            if (_.isUndefined(callback)) {
                callback = weight;
                weight   = 0;
            }
            if (_.isArray(callback)) {
                weight   = callback[0];
                callback = callback[1];
            }
            else if (!_.isFunction(callback)) {
                throw new Error('Getter callback must be a function!');
            }
            if (!(property in this.__getters)) {
                this.__getters[property] = {};
            }
            this.__getters[property][name] = [weight, callback];

            return this;
        },

        /**
         * Gets property getters
         *
         * @param {string}   property Property name
         * @param {boolean}  sorted   If true returns getters in sorted order
         * @returns {array}  Property getters;
         *
         * @this {clazz|object}
         */
        __getGetters: function(property, sorted) {
            var getters = this.__collectAllPropertyValues.apply(this, ['__getters', 1].concat(property || []));

            if (!property) {
                return getters;
            }

            getters = getters[property];

            if (!sorted) {
                return getters[property];
            }

            var sortedGetters = [];

            for (var name in getters) {
                sortedGetters.push(getters[name]);
            }

            sortedGetters = sortedGetters.sort(function(s1, s2) { return s2[0] - s1[0]; });

            for (var i = 0, ii = sortedGetters.length; i < ii; ++i) {
                sortedGetters[i] = sortedGetters[i][1];
            }

            return sortedGetters;
        },

        /**
         * Applies getters to value
         *
         * @param {string}       property Property name
         * @param {*}            value    Property value
         * @param {string|array} fields   Property fields
         *
         * @returns {*} Processed value
         *
         * @this {clazz|object}
         */
        __applyGetters: function(property, value, fields) {
            fields = fields || [];
            var getters = this.__getGetters(property, true);

            for (var i = 0, ii = getters.length; i < ii; ++i) {
                var result = getters[i].call(this, value, fields);

                if (!_.isUndefined(result)) {
                    value = result;
                }
            }

            return value;
        },

        /**
         * Sets object data
         *
         * @param {object} data    Property data ({ property1: value1, property2: value2, .. })
         * @param {object} options Property options ({ emit: emitValue, check: checkValue })
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __setData: function(data, options) {
            for (var property in data) {
                if (!this.__hasProperty(property.split('.')[0])) {
                    continue;
                }

                var value = data[property];

                if (_.isUndefined(value) || _.isNull(value)) {
                    this.__removePropertyValue(property, options);
                }
                else if (_.isObject(value) && _.isEmpty(value)) {
                    this.__clearPropertyValue(property, options)
                }
                else {
                    this.__setPropertyValue(property, value, options);
                }
            }
            return this;
        },

        /**
         * Gets object data
         *
         * @returns {object} Object dat
         *
         * @this {clazz|object}
         */
        __getData: function() {

            var data = {};
            var properties = this.__getPropertiesParam();

            for (var property in properties) {
                data[property] = this.__processData(this.__getPropertyValue(property));
            }

            return data;
        },

        /**
         * Process object data
         *
         * @param {object} data    Object data
         * @param {object} methods Getter methods
         * @returns {object} Processed data
         *
         * @this {clazz|object}
         */
        __processData: function self_method(data, methods) {
            if (!data) {
                return data;
            }

            var i, ii, prop;

            if (data.constructor === ({}).constructor) {
                for (prop in data) {
                    if (_.isUndefined(data[prop])) {
                        delete data[prop];
                        continue;
                    }

                    data[prop] = self_method(data[prop], methods);
                }
            }
            else if (_.isArray(data)) {
                for (i = 0, ii = data.length; i < ii; ++i) {
                    if (_.isUndefined(data[i])) {
                        --i; --ii;
                        continue;
                    }

                    data[i] = self_method(data[i], methods);
                }
            }
            else {

                methods = _.extend({}, methods, { __getData: null });

                _.each(methods, function(params, method) {

                    if (!_.isFunction(data[method])) {
                        return;
                    }

                    if (_.isNull(params) || _.isUndefined(params)) {
                        params = [];
                    }
                    if (!_.isArray(params)) {
                        params = [params];
                    }

                    data = data[method].apply(data, params);
                });
            }

            return data;
        }
    }

});