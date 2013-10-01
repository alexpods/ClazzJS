var PropertiesInitProcessor = function(object, properties) {
    var property, meta;

    for (property in properties) {
        object['_' + property] = undefined;

        var meta = properties[property];

        if (typeof meta !== 'object' || meta === null) {
            properties[property] = meta = Object.prototyp.toString.call(properties[property]) === '[object Array]'
                ? { type: meta }
                : { default: meta }
        }

        if (!('methods' in meta)) {
            meta.methods = ['get', 'set', 'has', 'is']
        }
    }
}