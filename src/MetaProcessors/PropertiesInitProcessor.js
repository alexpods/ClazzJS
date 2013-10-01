var PropertiesInitProcessor = function(object, properties) {
    var property, meta;

    for (property in properties) {
        object['_' + property] = undefined;

        var meta = properties[property];

        if (Object.prototype.toString.call(properties[property]) === '[object Array]') {
            properties[property] = meta = { type: meta }
        }
        else if (typeof meta !== 'object' || meta === null) {
            properties[property] = meta = { default: meta }
        }

        if (!('methods' in meta)) {
            meta.methods = ['get', 'set', 'has', 'is']
        }
    }
}