var Factory = {

    META_TYPE:  'ClazzJS.Clazz',
    CLASS_NAME: 'Clazz{uid}',

    _clazzUID: 0,

    create: function(params) {
        var clazz, i, ii;

        var name           = params.name || this.generateName();
        var parent         = params.parent;
        var metaTypes      = params.metaTypes || [this.META_TYPE];
        var meta           = params.meta;
        var dependencies   = params.dependencies || [];

        if (typeof parent === 'string') {
            parent = [parent];
        }
        if (Object.prototype.toString.call(parent) === '[object Array]') {
            parent = Manager.get(parent[0], parent[1] || [])
        }

        clazz = this.createClazz(name, parent);
        clazz.DEPENDENCIES = dependencies;

        if (meta) {
            if (typeof meta === 'function') {
                meta = meta.apply(clazz, dependencies);
            }

            for (i = 0, ii = metaTypes.length; i < ii; ++i) {
                if (typeof metaTypes[i] === 'string') {
                    metaTypes[i] = Meta.Manager.getType(metaTypes[i]);
                }
                metaTypes[i].process(clazz, meta);
            }
        }

        return clazz;
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = Base;
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

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    }
}