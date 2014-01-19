/**
 * Property constraints meta processor
 * Applies property constraints setter to object
 */
meta('Constraints', {

    SETTER_NAME:  '__constraints__',
    SETTER_WEIGHT: -100,

    /**
     * Add constraints setter to object
     *
     * @param {object} object      Object to which constraints will be applied
     * @param {object} constraints Hash of constraints
     * @param {string} property    Property name
     *
     * @this {metaProcessor}
     */
    process: function(object, constraints, property) {
        var that = this;

        object.__addSetter(property, this.SETTER_NAME, this.SETTER_WEIGHT, function(value, fields) {
            return that.apply(value, constraints, property, fields, this);
        });
    },

    /**
     * Applies property constraints to object
     *
     * @param {*}      value        Property value
     * @param {object} constraints  Hash of property constraints
     * @param {string} property     Property name
     * @param {array}  fields       Property fields
     * @param {object} object       Object
     *
     * @returns {*} value Processed property value
     *
     * @throws {Error} if some constraint was failed
     *
     * @this {metaProcessor}
     */
    apply: function(value, constraints, property, fields, object) {

        _.each(constraints, function(constraint, name) {
            if (!constraint.call(object, value, fields, property)) {
                throw new Error('Constraint "' + name + '" was failed!');
            }
        });

        return value;
    }

});