/**
 * Property setters meta processor
 * Add property setters to object
 */
meta('Setters', {

    /**
     * Add property setters to object
     *
     * @param {object} object   Some object
     * @param {object} setters  Hash of property setters
     * @param {string} property Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, setters, property) {

        _.each(setters, function(setter, name) {
            object.__addSetter(property, name, setter);
        });
    }

});