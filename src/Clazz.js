var Clazz = function(manager, factory, namespace) {

    var clazz = function(name, parent, meta) {

        var last = arguments[arguments.length-1];

        // Getting of existed clazz
        if (typeof last !== 'function' && Object.prototype.toString.call(last) !== '[object Object]') {
            return clazz.get(name, /* actually dependencies */ parent);
        }
        clazz.set(name, parent, meta);
    };

    for (var property in Clazz.prototype) {
        clazz[property] = Clazz.prototype[property];
    }

    clazz.getManager = function() {
        return manager;
    };

    clazz.getFactory = function() {
        return factory;
    };

    clazz.getNamespace = function() {
        return namespace;
    };

    return clazz;
};

Clazz.prototype = {
    constructor: Clazz,

    get: function(originName, dependencies) {
        var name;

        name = this.resolveName(originName);
        if (!name) {
            throw new Error('Clazz with name "' + originName + '" does not exits!');
        }

        dependencies = dependencies || [];

        var manager   = this.getManager();
        var factory   = this.getFactory();

        if (!manager.hasClazz(name, dependencies)) {
            var meta = manager.getMeta(name);

            manager.setClazz(factory.create({
                name:         name,
                dependencies: dependencies,
                parent:       this.adjustParent(meta.parent),
                meta:         meta.meta
            }));
        }
        return manager.getClazz(name, dependencies)
    },

    has: function(name) {
        return !!this.resolveName(name);
    },

    set: function(name, parent, meta) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        // Creation of new clazz
        if (typeof name === 'object') {
            parent   = name.parent;
            meta     = name.meta;
            name     = name.name;
        }
        else if (typeof meta === 'undefined') {
            meta    = parent;
            parent = null;
        }
        name = namespace.apply(name);

        manager.setMeta(name, {
            parent:     parent,
            meta:       meta
        });

        return this;
    },

    resolveName: function(name) {
        var paths, aname, i, ii;

        var manager   = this.getManager();
        var namespace = this.getNamespace();

        var anames = [];

        paths = namespace.getPaths();
        for (i = 0, ii = paths.length; i < ii; ++i) {
            aname = namespace.apply(name, paths[i]);
            if (manager.hasMeta(aname)) {
                return aname;
            }
            anames.push(aname);
        }

        for (i = 0, ii = anames.length; i < ii; ++i) {
            while (namespace.callback(anames[i])) {
                if (manager.hasMeta(anames[i])) {
                    return anames[i];
                }
            }
        }

        return false;
    },

    adjustParent: function(parent) {
        if (typeof parent === 'string') {
            parent = [parent];
        }

        if (Object.prototype.toString.call(parent) === '[object Array]') {
            parent = this.get(parent[0], parent[1] || [])
        }

        return parent;
    }
};