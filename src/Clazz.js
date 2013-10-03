var Clazz = function(manager, factory, namespace) {

    var clazz = function(name, parent, handlers, meta) {

        var last = arguments[arguments.length-1];

        // Getting of existed clazz
        if (typeof last !== 'function' && Object.prototype.toString.call(last) !== '[object Object]') {
            return clazz.get(name, last);
        }
        clazz.set(name, parent, handlers, meta);
    }

    for (var property in Clazz.prototype) {
        clazz[property] = Clazz.prototype[property];
    }

    clazz.getManager = function() {
        return manager;
    }

    clazz.getFactory = function() {
        return factory;
    }

    clazz.getNamespace = function() {
        return namespace;
    }

    return clazz;
}

Clazz.prototype = {
    get: function(name, dependencies) {

        name = this.resolveName(name);
        if (!name) {
            throw new Error('Clazz with name "' + name + '" does not exits!');
        }

        dependencies = dependencies || [];

        var manager   = this.getManager();
        var factory   = this.getFactory();

        if (!manager.hasClazz(name, dependencies)) {
            var meta = manager.getMeta(name);

            manager.setClazz(factory.create({
                name:         name,
                dependencies: dependencies,
                handlers:     this.adjustHandlers(meta.handlers),
                parent:       this.adjustParent(meta.parent),
                meta:         meta.meta
            }));
        }
        return manager.getClazz(name, dependencies)
    },

    has: function(name) {
        return !!this.resolveName(name);
    },

    set: function(name, parent, handlers, meta) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        // Creation of new clazz
        if (typeof name === 'object') {
            parent    = name.parent;
            handlers  = name.handlers;
            meta      = name.meta;
            name      = name.name;
        }
        else {
            if (typeof meta === 'undefined') {
                meta     = handlers;
                handlers = null;
            }
            if (typeof meta === 'undefined') {
                meta = parent;
                parent = null;
            }

            if (Object.prototype.toString.call(parent) === '[object Array]') {
                handlers = parent;
                parent   = null;
            }
        }
        name = namespace.apply(name);

        manager.setMeta(name, {
            parent:     parent ,
            handlers:   handlers,
            meta:       meta
        });

        return this;
    },

    resolveName: function(name) {
        var paths, aname, i, ii;

        var manager   = this.getManager();
        var namespace = this.getNamespace();

        paths = namespace.getPaths();
        for (i = 0, ii = paths.length; i < ii; ++i) {
            aname = namespace.apply(name, paths[i]);
            if (manager.hasMeta(aname)) {
                return aname;
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
    },

    adjustHandlers: function(handlers) {
        var newHandlers = {}, type, typeHandlers, handler;

        for (type in handlers) {
            if (-1 === ['clazz', 'proto'].indexOf(type)) {
                throw new Error('Incorrect clazz meta handler type "' + type + '"!');
            }

            newHandlers[type] = [];
            typeHandlers = handlers[type];


            if (Object.prototype.toString.call(typeHandlers) !== '[object Array]') {
                typeHandlers = [typeHandlers];
            }
            for (var i = 0, ii = typeHandlers.length; i < ii; ++i) {
                handler = typeHandlers[i];
                if (typeof handler === 'string') {
                    handler = Meta.Manager.getHandler(handler);
                }
                newHandlers[type][i].push(handler);
            }
        }
        return newHandlers;
    }
}