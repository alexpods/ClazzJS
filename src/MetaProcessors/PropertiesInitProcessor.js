var PropertiesInitProcessor = function(object, properties) {
    var property, meta;

    for (property in properties) {
        object['_' + property] = undefined;

        if (Object.prototype.toString.call(properties[property]) === '[object Array]') {
            properties[property] = { type: properties[property] }
        }
        else if (typeof meta !== 'object' || meta === null) {
            properties[property] = { default: properties[property] }
        }

        if (!('methods' in properties[property])) {
            properties[property].methods = ['get', 'set', 'has', 'is']
        }
    }
}