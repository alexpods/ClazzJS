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
        if (!(name in this._meta)) {
            throw new Error('Meta does not exists for "' + name + '"!');
        }
        return this._meta[name];
    },

    getClazz: function(name) {
        if (!(name in this._clazz)) {
            throw new Error('Clazz does not exists for "' + name + '"!');
        }
        return this._clazz[name];
    },

    hasClazz: function(name) {
        return name in this._clazz;
    },

    setClazz: function(name, clazz) {
        if (typeof clazz !== 'function') {
            throw new Error('Clazz must be a function!');
        }
        this._clazz[name] = clazz;
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