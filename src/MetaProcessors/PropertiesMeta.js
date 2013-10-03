Meta.Manager.setProcessor('ClazzJS.PropertiesMeta', function(object, properties) {
    for (var property in properties) {

        var meta = properties[property];

        if (Object.prototype.toString.call(meta) === '[object Array]') {
            properties[property] = meta = 3 === meta.length ? { type: [meta[0], meta[2]], default: meta[1] }: { type: meta }
        }
        else if (typeof meta !== 'object' || meta === null) {
            properties[property] = meta = { default: meta }
        }

        if (!('methods' in meta)) {
            meta.methods = ['get', 'set', 'has', 'is']
        }

        Meta.Manager.getHandler('ClazzJS.Property').process(object, properties[property], property);
    }
})