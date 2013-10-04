var Factory = function(BaseClazz, meta) {
    this._clazzUID = 0;
    this.BaseClazz = BaseClazz;
    this.meta      = meta;
}

Factory.prototype = {

    DEFAULT_PROCESSORS: {
        clazz: ['Clazz.Clazz'],
        proto: ['Clazz.Proto']
    },
    CLASS_NAME: 'Clazz{uid}',

    create: function(params) {

        var name           = params.name || this.generateName();
        var parent         = params.parent;
        var processors     = params.process || this.DEFAULT_PROCESSORS;
        var meta           = params.meta;
        var dependencies   = params.dependencies || [];

        var clazz = this.createClazz(name, parent);

        clazz.DEPENDENCIES = dependencies;

        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }
        
        if (meta) {
            this.applyMeta(clazz, meta, processors);
        }

        return clazz;
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = this.BaseClazz;
        }

        var clazz = function () {
            var response = parent.apply(this, Array.prototype.slice.call(arguments));

            if (typeof response !== 'undefined') {
                return response;
            }
        }

        // Copy all parent methods and initialize properties
        for (var property in parent) {
            if (typeof parent[property] === 'function') {
                clazz[property] = parent[property];
            }
            else if (property[0] === '_') {
                clazz[property] = undefined;
            }
        }

        clazz.NAME   = name || this.generateName();
        clazz.parent = parent;

        clazz.prototype = Object.create(parent.prototype);

        clazz.prototype.clazz  = clazz;
        clazz.prototype.parent = parent.prototype;

        return clazz;
    },

    applyMeta: function(clazz, meta, processors) {

        var types = { clazz: clazz, proto: clazz.prototype }, typeProcessors, processor, i, ii;

        for (var type in types) {
            if (type in processors) {
                typeProcessors = processors[type]
                if (Object.prototype.toString.call(typeProcessors) !== '[object Array]') {
                    typeProcessors = [typeProcessors];
                }
                for (i = 0, ii = typeProcessors.length; i < ii; ++i) {
                    processor = typeProcessors[i];
                    if (typeof processor === 'string') {
                        processor = this.meta.processor(processor);
                    }
                    processor.process(types[type], meta);
                }
            }
        }
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    }
}