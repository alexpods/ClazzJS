/**
 * Property getters meta processor
 * Add property getters to object
 */
meta('Getters', {

    /**
     * Add property getters to object
     *
     * @param {object} object   Some object
     * @param {object} getters  Hash of property getters
     * @param {string} property Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, getters, property) {

        _.each(getters, function(getter, name) {
            object.__addGetter(property, name, getter);
        });
    }

});