meta.processor('Clazz.Properties.Init', function(object, properties) {

    object.__setters = {};
    object.__getters = {};
    object.__properties = {};

    for (var property in properties) {
        object['_' + property] = undefined;
    }
})