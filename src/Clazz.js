var Clazz = function(manager, factory, namespace, meta) {

    var clazz = function(name, parent, process, meta) {

        var last = arguments[arguments.length-1];

        // Getting of existed clazz
        if (typeof last !== 'function' && Object.prototype.toString.call(last) !== '[object Object]') {
            return clazz.get(name, last);
        }
        clazz.set(name, parent, process, meta);
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

    clazz.getMeta = function() {
        return meta;
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
                process:      this.adjustMetaProcessors(meta.process),
                parent:       this.adjustParent(meta.parent),
                meta:         meta.meta
            }));
        }
        return manager.getClazz(name, dependencies)
    },

    has: function(name) {
        return !!this.resolveName(name);
    },

    set: function(name, parent, process, meta) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        // Creation of new clazz
        if (typeof name === 'object') {
            parent   = name.parent;
            process  = name.process;
            meta     = name.meta;
            name     = name.name;
        }
        else {
            if (typeof meta === 'undefined') {
                meta     = process;
                process  = null;
            }
            if (typeof meta === 'undefined') {
                meta = parent;
                parent = null;
            }

            if (Object.prototype.toString.call(parent) === '[object Array]') {
                process  = parent;
                parent   = null;
            }
        }
        name = namespace.apply(name);

        manager.setMeta(name, {
            parent:     parent ,
            process:    process,
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

    adjustMetaProcessors: function(metaProcessors) {
        var i, ii, processors = {}, type, typeProcessors, processor;

        for (type in metaProcessors) {
            if (-1 === ['clazz', 'proto'].indexOf(type)) {
                throw new Error('Incorrect meta processor type "' + type + '"!');
            }

            processors[type] = [];
            typeProcessors = metaProcessors[type];


            if (Object.prototype.toString.call(typeProcessors) !== '[object Array]') {
                typeProcessors = [typeProcessors];
            }
            for (i = 0, ii = typeProcessors.length; i < ii; ++i) {
                processor = typeProcessors[i];
                if (typeof processor === 'string') {
                    processor = this.getMeta().processor(processor);
                }
                processors[type][i].push(processor);
            }
        }

        for (var p in processors) {
            return processors;
        }
        return null;
    }
}