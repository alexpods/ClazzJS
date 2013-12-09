meta('Methods', {

    process: function(clazz, metaData) {
        this.applyMethods(clazz, metaData.clazz_methods || {});
        this.applyMethods(clazz.prototype, metaData.methods || {});
    },

    applyMethods: function(object, methods) {
        for (var method in methods) {
            if (!_.isFunction(methods[method])) {
                throw new Error('Method "' + method + '" must be a function!');
            }
            object[method] = methods[method]
        }
    }

});