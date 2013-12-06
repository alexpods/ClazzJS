meta('Methods', {

    process: function(object, metaData) {
        var option  = object.__isClazz ? 'clazz_methods' : 'methods';
        var methods = metaData[option] || {};

        for (var method in methods) {
            if (!_.isFunction(methods[method])) {
                throw new Error('Method "' + method + '" must be a function!');
            }
            object[method] = methods[method]
        }
    }

});