meta('Methods', {

    process: function(object, methods) {
        for (var method in methods) {
            if (!_.isFunction(methods[method])) {
                throw new Error('Method "' + method + '" must be a function!');
            }
            object[method] = methods[method]
        }
    }

});