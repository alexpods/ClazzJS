/**
 * Constants meta processor
 * Applies constants and implement constants interface if object is clazz
 */
meta('Constants', {

    /**
     * Applies constants to specified object
     *
     * @param {object} object   Object for constants implementation
     * @param {object} metaData Meta data with "constants" field
     *
     * @this {metaProcessor}
     */
    process: function(object, metaData) {
        this.applyConstants(object, metaData.constants || {});
    },

    /**
     * Implements constants interface if object is clazz and applies constants to clazz
     *
     * @param {object} object    Object for constants implementation
     * @param {object} constants Clazz constants
     *
     * @this {metaProcessor}
     */
    applyConstants: function(object, constants) {
        if (!object.__isInterfaceImplemented('constants')) {
            object.__implementInterface('constants', this.interface);
        }

        object.__initConstants();

        _.each(constants, function(constant, name) {
            object.__constants[name] = constant;
        });
    },

    /**
     * Constants interface
     */
    interface: {

        /**
         * Constants initialization
         *
         * @this {clazz|object}
         */
        __initConstants: function() {
            this.__constants = {};
        },

        /**
         * Gets all constants
         *
         * @returns {object} Gets constants
         *
         * @this {clazz|object}
         */
        __getConstants: function() {
            return this.__collectAllPropertyValues('__constants', 99);
        },

        /**
         * Get specified clazz
         *
         * @returns {*} Constant value
         *
         * @throw {Error} if specified constant does not exist
         *
         * @this {clazz|object}
         */
        __getConstant: function(/* fields */) {

            var fields   = _.toArray(arguments);
            var constant = this.__collectAllPropertyValues.apply(this, ['__constants', 99].concat(fields));

            for (var i = 0, ii = fields.length; i < ii; ++i) {
                if (!(fields[i] in constant)) {
                    throw new Error('Constant "' + fields.splice(0, i).join('.') + '" does not exist!');
                }
                constant = constant[fields[i]];
            }

            return constant;
        }
    }
});