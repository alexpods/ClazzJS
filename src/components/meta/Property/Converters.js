/**
 * Property converters meta processor
 * Applies property converters setter to object
 */
meta('Converters', {

    SETTER_NAME: '__converters__',
    SETTER_WEIGHT: 100,

    /**
     * Add converters setter to object
     *
     * @param {object} object      Object to which constraints will be applied
     * @param {object} converters  Hash of converters
     * @param {string} property    Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, converters, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME , this.SETTER_WEIGHT, function(value, fields) {
            return self.apply(value, converters, property, fields, this);
        });
    },

    /**
     * Applies property converters to object
     *
     * @param {*}      value        Property value
     * @param {object} converters   Hash of property converters
     * @param {string} property     Property name
     * @param {array}  fields       Property fields
     * @param {object} object       Object
     *
     * @returns {*} value Converted property value
     *
     * @this {metaProcessor}
     */
    apply: function(value, converters, property, fields, object) {

        _.each(converters, function(converter) {
            value = converter.call(object, value, fields, property);

        });

        return value;
    }
});