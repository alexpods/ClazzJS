var Manager = {

    _objectUID: 0,

    _clazz: {},
    _meta: {},

    adjustName: function(name, namespace) {
        if (typeof namespace === 'undefined') {
            namespace = NameSpace.current();
        }
        return (namespace+'.'+name).replace(NameSpace.getDelimitersRegexp(), '.');
    },

    setMeta: function(name, meta) {

        if (meta.metaTypes) {
            for (var i = 0, ii = meta.metaTypes.length; i < ii; ++i) {
                if (typeof meta.metaTypes[i] === 'string') {
                    meta.metaTypes[i] = Meta.Manager.getType(meta.metaTypes[i]);
                }
            }
        }

        this._meta[this.adjustName(name)] = meta;

        return this;
    },

    hasMeta: function(name) {
        var i, ii, namespaces = NameSpace.whereLookFor();

        for (i = 0, ii = namespaces.length; i < ii; ++i) {
            if (this.adjustName(name, namespaces[i]) in this._meta) {
                return true;
            }
        }
        return false;
    },

    getMeta: function(name) {
        var i, ii, aname, namespaces = NameSpace.whereLookFor();

        for (i = 0, ii = namespaces.length; i < ii; ++i) {
            aname = this.adjustName(name, namespaces[i]);
            if (aname in this._meta) {
                return this._meta[aname];
            }
        }
        throw new Error('Meta does not exists for "' + name + '"!');
    },

    getClazz: function(name, dependencies) {
        var i, ii, j, jj, clazz, aname, namespaces = NameSpace.whereLookFor(), isFound;

        for (i = 0, ii = namespaces.length; i < ii; ++i) {
            aname = this.adjustName(name, namespaces[i]);
            if (aname in this._clazz) {
                clazz = this._clazz[aname];
                break;
            }
        }

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                dependencies = [];
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz[i].DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz[i].DEPENDENCIES[j] !== dependencies[j]) {
                        isFound = false;
                        break;
                    }
                }

                if (isFound) {
                    return clazz[i];
                }
            }
        }
        throw new Error('Clazz "' + name + '" does not exists!');
    },

    hasClazz: function(name, dependencies) {
        var i, ii, j, jj, clazz, aname, namespaces = NameSpace.whereLookFor(), isFound;

        for (i = 0, ii = namespaces.length; i < ii; ++i) {
            aname = this.adjustName(name, namespaces[i]);
            if (aname in this._clazz) {
                clazz = this._clazz[aname];
                break;
            }
        }

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                return true;
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz[i].DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz[i].DEPENDENCIES[j] !== dependencies[j]) {
                        isFound = false;
                        break;
                    }
                }

                if (isFound) {
                    return true;
                }
            }
        }
        return false;
    },

    setClazz: function(name, clazz) {
        if (typeof name === 'function') {
            clazz = name;
            name  = clazz.NAME;
        }
        if (typeof clazz !== 'function') {
            throw new Error('Clazz must be a function!');
        }
        var aname = this.adjustName(name);
        if (!(aname in this._clazz)) {
            this._clazz[aname] = [];
        }
        this._clazz[aname].push(clazz);

        return this;
    },

    get: function(name , dependencies) {

        if (!this.hasClazz(name, dependencies)) {
            var meta = this.getMeta(name);
            meta.name         = name;
            meta.dependencies = dependencies;

            this.setClazz(Factory.create(meta));
        }
        return this.getClazz(name, dependencies);
    },

    has: function(name) {
        return this.hasClazz(name) || this.hasMeta(name);
    },

    getNextObjectUID: function() {
        return ++this._objectUID;
    }
}