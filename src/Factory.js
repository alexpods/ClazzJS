var Factory = function(BaseClazz) {
    this._clazzUID = 0;
    this.BaseClazz = BaseClazz;
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
        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }

        if ('clazz' in processors) {
            for (var i = 0, ii = processors.clazz.length; i < ii; ++i) {
                processors.clazz[i].process(clazz, meta);
            }
        }
        if ('proto' in processors) {
            for (var i = 0, ii = processors.proto.length; i < ii; ++i) {
                processors.proto[i].process(clazz.prototype, meta);
            }
        }
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    }
}