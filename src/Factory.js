var Factory = {

    CLASS_NAME: 'Clazz{uid}',

    _clazzUID: 0,

    create: function(name, parent, meta) {
        if (typeof meta === 'undefined') {
            meta   = parent;
            parent = null;
        }
        if (typeof meta === 'undefined') {
            meta = name;
            name = null;
        }
        if (typeof parent === 'string') {
            parent = Manager.get(parent);
        }

        return this.processMeta(this.createClazz(name, parent), meta);
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = Base;
        }

        var clazz = function () {
            parent.apply(this, Array.prototype.slice.call(arguments));
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

        clazz.prototype.clazz  = clazz;
        clazz.prototype.parent = parent.prototype;

        return clazz;
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    },

    processMeta: function(clazz, meta) {
        if (typeof meta === 'function') {
            meta = meta.apply(clazz)
        }

        if (meta) {
            Clazz.Meta.Clazz.process(clazz, meta);
            Clazz.Meta.Object.process(clazz.prototype, meta);
        }
        return clazz;
    }
}