meta.processor('Clazz.Properties.Init', function(object, properties) {
    for (var property in properties) {
        object['_' + property] = undefined;
    }
})