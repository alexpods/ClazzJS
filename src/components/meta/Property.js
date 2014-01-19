/**
 * Property meta processor
 * Process single property for clazz
 */
meta('Property', {

    /**
     * Property options meta processors
     * @private
     */
    _options: {
        type:        'Property/Type',
        default:     'Property/Default',
        methods:     'Property/Methods',
        constraints: 'Property/Constraints',
        converters:  'Property/Converters',
        getters:     'Property/Getters',
        setters:     'Property/Setters',
        readable:    'Property/Readable',
        writable:    'Property/Writable'
    },

    /**
     * Process single property for clazz
     *
     * @param {clazz|object} object         Clazz or its prototype
     * @param {object}       propertyMeta   Property meta data
     * @param {string}       property       Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, propertyMeta, property) {
        var that = this;

        object['_' + property] = undefined;

        // Adjust property 'type' and 'default fields
        if (_.isArray(propertyMeta)) {
            propertyMeta = propertyMeta.length === 3 || !_.isSimpleObject(propertyMeta[1])
                ? { type: [propertyMeta[0], propertyMeta[2] || {}], default: propertyMeta[1] }
                : { type: propertyMeta }
        }
        else if (!_.isSimpleObject(propertyMeta)) {
            propertyMeta = { default: propertyMeta }
        }

        // Sets default property methods
        if (!('methods' in propertyMeta)) {
            propertyMeta.methods = ['get', 'set', 'has', 'is', 'clear', 'remove']
        }

        object.__setPropertyParam(property, {});

        // Process property meta data by options processors
        _.each(propertyMeta, function(option) {
            if (!(option in that._options)) {
                return;
            }

            var processor = that._options[option];

            if (_.isString(processor)) {
                processor = meta(processor);
            }

            processor.process(object, propertyMeta[option], property);
        });
    },

    /**
     * Sets property option meta processor
     *
     * @param {string}        option        Option name
     * @param {metaProcessor} metaProcessor Meta processor
     * @returns {metaProcessor} this
     *
     * @throws {Error} if options already exist
     *
     * @this {metaProcessor}
     */
    set: function(option, metaProcessor) {
        if (option in this._options) {
            throw new Error('Option "' + option + '" is already exist!');
        }
        this._options[option] = metaProcessor;
        return this;
    },

    /**
     * Checks whether specified option meta processor exist
     *
     * @param {string} option Option name
     * @returns {boolean} true if specified option meta processor exist
     *
     * @this {metaProcessor}
     */
    has: function(option) {
        return option in this._options;
    },

    /**
     * Removes property option meta processor
     *
     * @param   {string} option Option name
     * @returns {metaProcessor} this
     *
     * @throws {Error} if specified option does not exist
     *
     * @this {metaProcessor}
     */
    remove: function(option) {
        if (!(option in this._options)) {
            throw new Error('Option "' + option + '" does not exist!');
        }
        delete this._options[option];
        return this;
    }
});