meta('Property', {

    process: function(object, propertyMeta, property) {
        object['_' + property] = undefined;

        if (_.isArray(propertyMeta)) {
            propertyMeta = propertyMeta.length === 3 || !_.isSimpleObject(propertyMeta[1])
                ? { type: [propertyMeta[0], propertyMeta[2] || {}], default: propertyMeta[1] }
                : { type: propertyMeta }
        }
        else if (!_.isSimpleObject(propertyMeta)) {
            propertyMeta = { default: propertyMeta }
        }

        if (!('methods' in propertyMeta)) {
            propertyMeta.methods = ['get', 'set', 'has', 'is', 'clear', 'remove']
        }

        object.__setPropertyParam(property, {});

        for (var option in propertyMeta) {
            if (option in this._options) {
                var processor = this._options[option];

                if (_.isString(processor)) {
                    processor = meta(processor);
                }
                processor.process(object, propertyMeta[option], property);
            }
        }
    },

    addOption: function(option, metaProcessor) {
        if (option in this._options) {
            throw new Error('Option "' + option + '" is already exists!');
        }
        this._options[option] = metaProcessor;
        return this;
    },

    hasOption: function(option) {
        return option in this._options;
    },

    removeOption: function(option) {
        if (!(option in this._options)) {
            throw new Error('Option "' + option + '" does not exists!');
        }
        delete this._options[option];
        return this;
    },

    _options: {
        type:        'Property/Type',
        default:     'Property/Default',
        methods:     'Property/Methods',
        constraints: 'Property/Constraints',
        converters:  'Property/Converters',
        getters:     'Property/Getters',
        setters:     'Property/Setters'
    }
});