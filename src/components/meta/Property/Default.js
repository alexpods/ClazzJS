/**
 * Property default value meta processor
 * Set default value for object property
 */
meta('Default', {

    /**
     * Set default value for object property
     *
     * @param {object} object       Some object
     * @param {*}      defaultValue Default value
     * @param {string} property     Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, defaultValue, property) {
        if (!_.isUndefined(defaultValue)) {
            object.__setPropertyParam(property, 'default', defaultValue);
        }
    }

});