var PropertiesInitProcessor = function(object, properties) {

    if (typeof object === 'function' && object.parent) {
        for (var property in object.parent) {
            if (property[0] === '_' && typeof object.parent[property] !== 'function') {
                continue;
            }
            object[property] = undefined;
        }
    }

    for (var property in properties) {
        object['_' + property] = undefined;
    }
}