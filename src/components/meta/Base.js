/**
 * Base meta processor for clazz creation
 * Applies base interfaces to clazz, call sub processors and sets clazz defaults
 */
meta('Base', {

    /**
     * Meta processors
     *
     * @private
     */
    _processors: {
        constants:  'Constants',
        properties: 'Properties',
        methods:    'Methods',
        events:     'Events'
    },

    /**
     * Process meta data for specified clazz
     *
     * @param {clazz}  clazz    Clazz
     * @param {object} metaData Meta data
     *
     * @throw {Error} if wrong meta data are passed
     *
     * @this {metaProcessor}
     */
    process: function(clazz, metaData) {

        // Apply clazz interface
        if (!clazz.__isClazz) {
            _.extend(clazz, this.clazz_interface);
        }

        // Apply interface common for clazz and its prototype
        if (!clazz.__interfaces) {
            clazz.__interfaces = [];
            clazz.prototype.__interfaces = [];

            _.extend(clazz, this.common_interface);
            _.extend(clazz.prototype, this.common_interface);
        }

        // Calls sub processors

        clazz.__metaProcessors = metaData.meta_processors || {};

        var parent = metaData.parent;

        if (parent) {
            if (!clazz.__isSubclazzOf(parent)) {
                throw new Error('Clazz "' + clazz.__name +
                    '" must be sub clazz of "' + parent.__isClazz ? parent.__name : parent + '"!');
            }
        }

        var processors = clazz.__getMetaProcessors();

        _.each(processors, function(processor) {
            processor.process(clazz, metaData);
        });

        // Sets clazz defaults

        if (_.isFunction(clazz.__setDefaults)) {
            clazz.__setDefaults();
        }
    },

    /**
     * Gets sub processors
     *
     * @returns {array} Sub processors
     *
     * @this {metaProcessor}
     */
    get: function() {
        var processors = this._processors;

        _.each(processors, function(processor, name) {
            if (_.isString(processor)) {
                processors[name] = meta(processor);
            }
        });

        return processors;
    },

    /**
     * Sets sub processors
     *
     * @param {array} processors Sub processors
     * @returns {metaProcessor} this
     *
     * @throws {Error} if sub processor already exist
     *
     * @this {metaProcessor}
     */
    set: function(processors) {
        var that = this;
        _.each(processors, function(processor, name) {
            if (name in that._processors) {
                throw new Error('Processor "' + name + '" already exists!');
            }
            that._processors[name] = processor;
        });

        return this;
    },

    /**
     * Checks whether specified sub processor exist
     *
     * @param {string} name Sup processor name
     * @returns {boolean} true if specified sub processor is exist
     *
     * @this {metaProcessor}
     */
    has: function(name) {
        return name in this._processors;
    },

    /**
     * Removes specified sub processor
     *
     * @param {string} name Sub processor
     * @returns {metaProcessor} this
     *
     * @throw {Error} if specified processor does not exist
     *
     * @this {metaProcessor}
     */
    remove: function(name) {
        if (!(name in this._processors)) {
            throw new Error('Processor "' + name + '" does not exist!');
        }
        delete this._processors[name];
        return this;
    },

    /**
     * Clazz interface. Applied to all clazzes but not to its prototypes
     */
    clazz_interface: {

        /**
         * Object is a clazz
         */
        __isClazz: true,

        /**
         * Constructor logic
         *
         * @this {object}
         */
        __construct: function() {
            for (var method in this) {
                if (0 === method.indexOf('__init') && _.isFunction(this[method])) {
                    this[method]();
                }
            }
            if (_.isFunction(this.init)) {
                this.init.apply(this, _.toArray(arguments));
            }

            if (_.isFunction(this.__setDefaults)) {
                this.__setDefaults();
            }

            if (_.isFunction(this.__clazz.__emitEvent)) {
                this.__clazz.__emitEvent('instance.created', this);
            }
        },

        /**
         * Checks whether this clazz is sub clazz of specified one
         *
         * @param   {clazz|string} parent Parent clazz
         * @returns {boolean} true if this clazz is sub clazz of specified one
         *
         * @this {clazz}
         */
        __isSubclazzOf: function(parent) {
            var clazzParent = this;

            while (clazzParent) {
                if (clazzParent === parent || clazzParent.__name === parent) {
                    return true;
                }
                clazzParent = clazzParent.__parent;
            }

            return false;
        }
    },

    /**
     * Common clazz interface. Applied both for clazzes and its prototypes
     */
    common_interface: {

        /**
         * Checks whether specified interface is implemented
         *
         * @param   {string}  name Interface name
         * @returns {boolean} true if specified interface is implemented
         *
         * @this {clazz|object}
         */
        __isInterfaceImplemented: function(name) {
            return -1 !== this.__interfaces.indexOf(name);
        },

        /**
         * Implements interface
         *
         * @param {string} name      Interface name
         * @param {object} interfaze Interface
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __implementInterface: function(name, interfaze) {
            if (-1 !== this.__interfaces.indexOf(name)) {
                throw new Error('Interface "' + name + '" is already implemented!');
            }
            this.__interfaces.push(name);
            _.extend(this, interfaze);
            return this;
        },

        /**
         * Collects all property value from current and parent clazzes
         *
         * @param {string} property Property name
         * @returns {*} Property value
         *
         * @this {clazz|object}
         */
        __collectAllPropertyValue: function(property) {
            if (this.hasOwnProperty(property) && !_.isUndefined(this[property])) {
                return this[property];
            }

            if (this.__proto && this.__proto.hasOwnProperty(property) && !_.isUndefined(this.__proto[property])) {
                return this.__proto[property];
            }

            var parent = this.__parent;

            while (parent) {
                if (parent.hasOwnProperty(property) && !_.isUndefined(parent[property])) {
                    return parent[property];
                }
                parent = parent.__parent;
            }
        },

        /**
         * Collect all property values from current and parent clazzes
         *
         * @param {string} property Property name
         * @param {number} level    Level of property search depth
         * @returns {*} Collected property values
         *
         * @this {clazz|object}
         */
        __collectAllPropertyValues: function(property, level /* fields */) {

            var propertyContainers = [];

            if (this.hasOwnProperty(property)) {
                propertyContainers.push(this[property]);
            }

            if (this.__proto && this.__proto.hasOwnProperty(property)) {
                propertyContainers.push(this.__proto[property]);
            }

            var parent  = this.__parent;

            while (parent) {
                if (parent.hasOwnProperty(property)) {
                    propertyContainers.push(parent[property]);
                }
                parent = parent.__parent;
            }

            var fields = _.toArray(arguments).slice(2);
            var propertyValues = {};

            for (var i = 0, ii = propertyContainers.length; i < ii; ++i) {
                this.__collectValues(propertyValues, propertyContainers[i], level || 1, fields);
            }

            return propertyValues;
        },

        /**
         * Collect values to specified collector
         *
         * @param {object}  collector Collected values will be added to it
         * @param {object}  container Searched for specified fields
         * @param {number}  level     Lever of property search depth
         * @param {array}   fields    Searching
         * @param {boolean} reverse   If true overwrite collector property value
         *
         * @returns {object} Collector
         *
         * @this {clazz|object}
         */
        __collectValues: function self(collector, container, level, fields, reverse) {
            fields = [].concat(fields || []);

            _.each(container, function(value, name) {
                if (fields[0] && (name !== fields[0])) {
                    return;
                }

                if (level > 1 && _.isSimpleObject(value)) {
                    if (!(name in collector)) {
                        collector[name] = {};
                    }
                    self(collector[name], value, level-1, fields.slice(1));
                } else if (reverse || (!(name in collector))) {
                    collector[name] = value;
                }
            });

            return collector;
        },

        /**
         * Gets meta processors for this clazz
         *
         * @returns {Object} Meta processors
         *
         * @this {clazz|object}
         */
        __getMetaProcessors: function() {
            var object = this.__isClazz ? this : this.__clazz;
            return this.__collectValues(object.__collectAllPropertyValues('__metaProcessors', 1), meta('Base').get());
        }
    }
});