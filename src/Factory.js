var Factory = function(BaseClazz) {
    this.__clazzUID = 0;
    this.BaseClazz = BaseClazz;
}

Factory.prototype = {

    DEFAULT_HANDLER: {
        clazz: ['ClazzJS.Clazz'],
        proto: ['ClazzJS.Prototype']
    },
    CLASS_NAME: 'Clazz{uid}',

    create: function(params) {

        var name           = params.name || this.generateName();
        var parent         = params.parent;
        var handlers       = params.handlers || [this.DEFAULT_HANDLER];
        var meta           = params.meta;
        var dependencies   = params.dependencies || [];

        var clazz = this.createClazz(name, parent);

        clazz.DEPENDENCIES = dependencies;

        if (meta) {
            this.applyMeta(clazz, meta, handlers);
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

    applyMeta: function(clazz, meta, handlers) {
        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }

        if ('clazz' in handlers) {
            for (var i = 0, ii = handlers.clazz.length; i < ii; ++i) {
                handlers.clazz[i].process(clazz, meta);
            }
        }
        if ('proto' in handlers) {
            for (var i = 0, ii = handlers.proto.length; i < ii; ++i) {
                handlers.proto[i].process(clazz.prototype, meta);
            }
        }
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    }
}