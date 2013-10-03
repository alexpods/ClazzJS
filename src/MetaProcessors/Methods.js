Meta.Manager.setProcessor('ClazzJS.Methods', function(object, methods) {

    // Copy parent clazz methods
    if (typeof object === 'function' && object.parent) {
        for (var method in object.parent) {
            if (typeof object.parent[method] !== 'function') {
                continue;
            }
            object[method] = object.parent[method];
        }
    }

    // Creates specified methods
    for (var method in methods) {
        if (typeof methods[method] !== 'function') {
            throw new Error('Method "' + method + '" must be a function!');
        }
        object[method] = methods[method]
    }
})