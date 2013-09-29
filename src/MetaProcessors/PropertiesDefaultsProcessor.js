var PropertiesDefaultsProcessor = function(object) {

    var property, properties = object.__properties

    for (property in properties) {
        object['_' + property] = properties[property]['default'];
    }

}