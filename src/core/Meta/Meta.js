/**
 * Meta constructor
 *
 * @param {Manager}     manager     Manager of meta processors
 * @param {Namespace}   namespace   Namespace
 * @returns {Meta} Meta class
 *
 * @constructor
 */
var Meta = function(manager, namespace) {

    /**
     * Meta class
     *
     * @typedef {function} Meta
     *
     * @param name      Name of new meta processor
     * @param processor Meta processor
     *
     * @returns {Meta}
     */
    var self = function(name, processor) {
       return  _.isUndefined(processor) ?  self.get(name) : self.set(name, processor);
    };

    _.extend(self, Meta.prototype);

    self._manager   = manager;
    self._namespace = namespace;

    return self
};

_.extend(Meta.prototype, {

    /**
     * Gets meta processors manager
     *
     * @returns {Manager}
     *
     * @this {Meta}
     */
    getManager: function() {
        return this._manager;
    },

    /**
     * Gets namespace
     *
     * @returns {Namespace}
     *
     * @this {Meta}
     */
    getNamespace: function() {
        return this._namespace;
    },

    /**
     * Gets meta processor by name
     *
     * @param   {string} originalName Meta processor name
     * @returns {metaProcessor} Meta processor
     *
     * @throws {Error} if meta processor does not exist
     *
     * @this {Meta}
     */
    get: function(originalName) {

        var manager = this.getManager();
        var name    = this.resolveName(originalName);

        if (!name) {
            throw new Error('Meta processor "' + originalName + '" does not exist!');
        }

        return manager.get(name);
    },

    /**
     * Sets meta processor
     *
     * @param {string}        name      Meta processor name
     * @param {metaProcessor} processor Meta processor
     * @returns {Meta} this
     *
     * @this {Meta}
     */
    set: function(name, processor) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        manager.set(namespace.adjustPath(name), processor);

        return this;
    },

    /**
     * Resolves meta processor name
     *
     * @param {string} name Meta processor name
     * @returns {string|undefined} Resolved meta processor name or undefined if name could not be resolved
     *
     * @this {Meta}
     */
    resolveName: function(name) {

        var manager = this.getManager();
        var namespace = this.getNamespace();

        return namespace.getScope().search(namespace.adjustPath(name), function(name) {
            if (manager.has(name)) {
                return name;
            }
        });
    }
});