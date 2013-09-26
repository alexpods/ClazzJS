var PropertiesDefaultsProcessor = function(object) {

    var property, defaults = object.getDefaults();

    for (property in defaults) {
        object['_' + property] = defaults[property];
    }

}