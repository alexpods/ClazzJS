/**
 * Clazz constructor
 *
 * @param {Manager}   manager   Clazz manager
 * @param {Factory}   factory   Clazz factory
 * @param {Namespace} namespace Namespace
 * @returns {Clazz} Clazz class
 *
 * @constructor
 */
var Clazz = function(manager, factory, namespace) {

    /**
     * Clazz
     * Create new clazz or gets specified clazz
     *
     * @typedef {function} Clazz
     *
     * @param {string}       name                   Clazz name
     * @param {clazz}        parent                 Parent clazz
     * @param {object|array} metaOrDependencies     Meta data for clazz creation or clazz dependencies
     *
     * @returns {clazz|undefined} New clazz or undefined if clazz was created
     */
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

    /**
     * Gets clazz manager
     *
     * @returns {Manager} Clazz manager
     *
     * @this {Clazz}
     */
    getManager: function() {
        return this._manager;
    },

    /**
     * Gets clazz factory
     *
     * @returns {Factory} Clazz factory
     *
     * @this {Clazz}
     */
    getFactory: function() {
        return this._factory;
    },

    /**
     * Gets namespace
     *
     * @returns {Namespace} Namespace
     *
     * @this {Clazz}
     */
    getNamespace: function() {
        return this._namespace;
    },

    /**
     * Checks whether clazz exists
     *
     * @param {string} name Clazz name
     * @returns {boolean} true if clazz exist
     *
     * @this {Clazz}
     */
    has: function(name) {
        return !!this.resolveName(name);
    },

    /**
     * Gets clazz
     *
     * @param {string} originalName  Clazz name
     * @param {clazz}  parent        Parent clazz
     * @param {array}  dependencies  Clazz dependencies
     * @returns {clazz} Clazz
     *
     * @throw {Error} if clazz does not exist
     *
     * @this {Clazz}
     */
    get: function(originalName, parent, dependencies) {

        if (_.isUndefined(dependencies) && _.isArray(parent)) {
            dependencies = parent;
            parent       = undefined;
        }

        var name = this.resolveName(originalName);

        if (!name) {
            throw new Error('Clazz "' + originalName + '" does not exist!');
        }

        dependencies = dependencies || [];

        var manager  = this.getManager();

        if (!manager.has(name, parent, dependencies)) {

            var factory   = this.getFactory();
            var clazzData = manager.getData(name);

            manager.set(name, factory.create({
                name:         clazzData.name,
                parent:       parent || clazzData.parent || null,
                meta:         clazzData.meta,
                dependencies: dependencies,
                clazz:        clazzData.clazz
            }), parent, dependencies);
        }

        return manager.get(name, parent, dependencies);
    },

    /**
     * Sets clazz
     *
     * @param {string} name    Clazz name
     * @param {clazz}  parent  Parent clazz
     * @param {array}  meta    Meta data
     * @returns {Clazz} this
     *
     * @this {Clazz}
     */
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

        manager.setData(name, {
            name:       name,
            parent:     parent,
            meta:       meta,
            clazz:      this
        });

        return this;
    },

    /**
     * Resolves clazz name
     *
     * @param   {string} name Clazz name
     * @returns {string|undefined} Resolved clazz name or undefined if name could not be resolved
     *
     * @this {Clazz}
     */
    resolveName: function(name) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        return namespace.getScope().search(namespace.adjustPath(name), function(name) {
            if (manager.hasData(name)) {
                return name;
            }
        })
    }
});