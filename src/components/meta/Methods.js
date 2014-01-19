/**
 * Methods meta processor
 * Applies methods to clazz and its prototype
 */
meta('Methods', {

    /**
     * Applies methods to clazz and its prototype
     *
     * @param {clazz}  clazz    Clazz
     * @param {object} metaData Meta data with properties 'methods' and 'clazz_methods'
     *
     * @this {metaProcessor}
     */
    process: function(clazz, metaData) {
        this.applyMethods(clazz, metaData.clazz_methods || {});
        this.applyMethods(clazz.prototype, metaData.methods || {});
    },

    /**
     * Applies methods to specified object
     *
     * @param {object} object  Object for methods applying
     * @param {object} methods Hash of methods
     *
     * @this {Error} if method is not a funciton
     *
     * @this {metaProcessor}
     */
    applyMethods: function(object, methods) {
        _.each(methods, function(method, name) {
            if (!_.isFunction(method)) {
                throw new Error('Method "' + name + '" must be a function!');
            }
            object[name] = method
        });
    }

});