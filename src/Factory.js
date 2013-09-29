var Factory = {

    CLASS_NAME: 'Clazz{uid}',

    _clazzUID: 0,

    create: function(name, parent, meta, dependencies) {
        if (typeof parent === 'string') {
            parent = Manager.get(parent);
        }
        if (typeof dependencies === 'undefined') {
            dependencies = [];
        }

        var clazz = this.createClazz(name, parent)

        clazz.DEPENDENCIES = dependencies;

        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }
        if (typeof meta === 'function') {
            meta = { methods: { init: meta }}
        }

        if (meta) {
            this.processMeta(clazz, meta);
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
    },

    processMeta: function(clazz, meta) {

        Clazz.Meta.Clazz.process(clazz, meta);
        Clazz.Meta.Object.process(clazz.prototype, meta);

        return clazz;
    }
}