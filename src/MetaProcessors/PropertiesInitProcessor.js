var PropertiesInitProcessor = function(object, properties) {
    for (var property in properties) {
        object['_' + property] = undefined;
    }
}