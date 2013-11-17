meta.processor('Clazz.Properties.Meta', function(object, properties) {
    for (var property in properties) {

        var pmeta = properties[property];

        if (Object.prototype.toString.call(pmeta) === '[object Array]') {
            properties[property] = pmeta = 3 === pmeta.length ? { type: [pmeta[0], pmeta[2]], default: pmeta[1] } : { type: pmeta }
        }
        else if (typeof pmeta !== 'object' || pmeta === null) {
            properties[property] = pmeta = { default: pmeta }
        }

        if (!('methods' in pmeta)) {
            pmeta.methods = ['get', 'set', 'has', 'is', 'clear', 'remove']
        }

        if ('alias' in pmeta) {
            pmeta.methods.alias = [].concat(pmeta.alias);
        }

        meta.processor('Clazz.Property').process(object, pmeta, property);
    }
})