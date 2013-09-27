var Manager = {

    _clazz: {},
    _meta: {},

    setMeta: function(name, parent, meta) {
        if (typeof meta === 'undefined') {
            meta   = parent;
            parent = undefined;
        }
        this._meta[name] = [parent, meta];
        return this;
    },

    hasMeta: function(name) {
        return name in this._meta;
    },

    getMeta: function(name) {
        if (!(this.hasMeta(name))) {
            throw new Error('Meta does not exists for "' + name + '"!');
        }
        return this._meta[name];
    },

    getClazz: function(name) {
        var clazz, part, parts, namespaces = NameSpace.whereLookFor();

        for (var i = 0, ii = namespaces.length; i < ii; ++i) {
            clazz = this._clazz;
            parts = (namespaces[i] + '.' + name).split(NameSpace.DELIMITERS)

            for (part in parts) {
                if (!(part in clazz)) {
                    break;
                }
                clazz = clazz[part];
            }

        }
        if (typeof clazz !== 'function') {
            throw new Error('Clazz "' + name + '" does not exists!');
        }

        return clazz;
    },

    hasClazz: function(name) {
        var clazz, part, parts, namespaces = NameSpace.whereLookFor();

        for (var i = 0, ii = namespaces.length; i < ii; ++i) {
            clazz = this._clazz;
            parts = (namespaces[i] + '.' + name).split(NameSpace.DELIMITERS)

            for (part in parts) {
                if (!(part in clazz)) {
                    break;
                }
                clazz = clazz[part];
            }

        }
        return typeof clazz === 'function';
    },

    setClazz: function(name, clazz) {
        if (typeof clazz !== 'function') {
            throw new Error('Clazz must be a function!');
        }
        var part, parts = (NameSpace.current() + '.' + name).split(NameSpace.DELIMITERS), name = parts.pop(), container = this._clazz;

        for (part in parts) {
            if (typeof container[part] === 'undefined') {
                container[part] = {};
            }
            container = container[part];
        }
        container[name] = clazz;

        return this;
    },

    get: function(name) {
        if (!this.hasClazz(name)) {
            var meta = this.getMeta(name);
            this.setClazz(name, Factory.create(name, meta[0], meta[1]));
        }
        return this.getClazz(name);
    },

    has: function(name) {
        return this.hasClazz(name) || this.hasMeta(name);
    }
}