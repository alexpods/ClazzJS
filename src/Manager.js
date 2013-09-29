var Manager = {

    _clazz: {},
    _meta: {},

    adjustName: function(name, namespace) {
        if (typeof namespace === 'undefined') {
            namespace = NameSpace.current();
        }
        return (namespace+'.'+name).replace(NameSpace.getDelimitersRegexp(), '.');
    },

    setMeta: function(name, parent, meta) {
        if (typeof meta === 'undefined') {
            meta   = parent;
            parent = undefined;
        }
        this._meta[this.adjustName(name)] = [parent, meta];

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
        this._clazz[this.adjustName(name)] = clazz;

        return this;
    },

    get: function(name , dependencies) {

        if (!this.hasClazz(name, dependencies)) {
            var meta = this.getMeta(name);
            this.setClazz(Factory.create(name, meta[0], meta[1], dependencies));
        }
        return this.getClazz(name, dependencies);
    },

    has: function(name) {
        return this.hasClazz(name) || this.hasMeta(name);
    }
}