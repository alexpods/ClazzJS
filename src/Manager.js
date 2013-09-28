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

    getClazz: function(name, dependencies) {
        var i, ii, j, jj, isFound, clazz, part, parts, namespaces = NameSpace.whereLookFor();

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

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                dependencies = [];
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz.DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz.DEPENDENCIES[j] !== dependencies[j]) {
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
        var i, ii, j, jj, isFound, clazz, part, parts, namespaces = NameSpace.whereLookFor();

        for (i = 0, ii = namespaces.length; i < ii; ++i) {
            clazz = this._clazz;
            parts = (namespaces[i] + '.' + name).split(NameSpace.DELIMITERS)

            for (part in parts) {
                if (!(part in clazz)) {
                    break;
                }
                clazz = clazz[part];
            }
        }

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                return true;
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz.DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz.DEPENDENCIES[j] !== dependencies[j]) {
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
        var part, parts = (NameSpace.current() + '.' + name).split(NameSpace.DELIMITERS), name = parts.pop(), container = this._clazz;

        for (part in parts) {
            if (typeof container[part] === 'undefined') {
                container[part] = {};
            }
            container = container[part];
        }
        if (!(name in container)) {
            container[name] = [];
        }
        container[name].push(clazz);

        return this;
    },

    get: function(name , dependencies) {

        if (!this.hasClazz(name, dependencies)) {
            var meta = this.getMeta(name);
            this.setClazz(name, Factory.create(name, meta[0], meta[1], dependencies));
        }
        return this.getClazz(name, dependencies);
    },

    has: function(name) {
        return this.hasClazz(name) || this.hasMeta(name);
    }
}