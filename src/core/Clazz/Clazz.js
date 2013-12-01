var Clazz = function(manager, factory, namespace) {

    var self = function(name, parent, metaOrDependencies) {
        var last = _.last(arguments);

        if ((!_.isFunction(last) || last.prototype.__clazz) && Object.prototype.toString.call(last) !== '[object Object]') {
            return self.get(name, parent, /* dependencies */ metaOrDependencies);
        }
        self.set(name, parent, /* meta */ metaOrDependencies);
    };

    _.extend(self, Clazz.prototype);

    self._manager   = manager;
    self._factory   = factory;
    self._namespace = namespace;

    return self;
};

_.extend(Clazz.prototype, {

    getManager: function() {
        return this._manager;
    },

    getFactory: function() {
        return this._factory;
    },

    getNamespace: function() {
        return this._namespace;
    },

    has: function(name) {
        return !!this.resolveName(name);
    },

    get: function(originalName, parent, dependencies) {

        if (_.isUndefined(dependencies) && _.isArray(parent)) {
            dependencies = parent;
            parent       = undefined;
        }

        var name = this.resolvePath(originalName);

        if (!name) {
            throw new Error('Clazz "' + originalName + '" does not exists!');
        }

        dependencies = dependencies || [];

        var manager  = this.getManager();

        if (!manager.hasClazz(name, parent, dependencies)) {

            var factory   = this.getFactory();
            var clazzData = manager.getClazzData(name);

            manager.setClazz(name, factory.create({
                name:         clazzData.name,
                parent:       parent,
                metaParent:   clazzData.parent,
                meta:         clazzData.meta,
                dependencies: dependencies
            }, this), parent, dependencies);
        }
        return manager.getClazz(name, parent, dependencies);
    },

    set: function(name, parent, meta) {

        if (_.isUndefined(meta)) {
            meta   = parent;
            parent = undefined;
        }

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        if (_.isUndefined(meta)) {
            meta    = parent;
            parent = null;
        }

        name = namespace.adjustPath(name);

        if (_.isString(parent)) {
            parent = namespace.adjustPath(parent);
        }

        manager.setClazzData(name, {
            name:       name,
            parent:     parent,
            meta:       meta
        });

        return this;
    },

    resolvePath: function(path) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        return namespace.getScope().search(namespace.adjustPath(path), function(path) {
            if (manager.hasClazzData(path)) {
                return path;
            }
        })
    }
});