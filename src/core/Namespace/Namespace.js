/**
 * Namespace constructor
 *
 * @param   {Scope}  scope Scope to which this namespace belongs
 * @param   {string} path  Namespace path
 * @returns {Namespace} Namespace class
 *
 * @constructor
 */
var Namespace = function(scope, path) {

    /**
     * Namespace class
     *
     * @typedef {function} Namespace
     *
     * @param   {string} path Namespace path
     * @returns {Namespace}
     */
    var self = function(path /* injects.. , callback */) {
        var namespace = self.getScope().getNamespace(self.adjustPath(path));

        if (arguments.length > 1) {
            namespace.space.apply(namespace, _.toArray(arguments).slice(1));
        }

        return namespace;
    };

    _.extend(self, Namespace.prototype);

    self._scope     = scope;
    self._path      = path;
    self._spaces    = [];
    self._objects   = {};

    return self;
};

_.extend(Namespace.prototype, {

    /**
     * Gets namespace path
     *
     * @returns {string} Namespace path
     *
     * @this {Namespace}
     */
    getPath: function() {
        return this._path;
    },

    /**
     * Gets namespace scope
     *
     * @returns {Scope} Namespace scope
     *
     * @this {Namespace}
     */
    getScope: function() {
        return this._scope;
    },

    /**
     * Adjusts namespace path
     *
     * @param   {string} path Namespace path
     * @returns {string} Adjusted namespace path
     *
     * @see Scope::adjustPath()
     *
     * @this {Namespace}
     */
    adjustPath: function(path) {
        return this._scope.isAbsolutePath(path)
            ? this._scope.adjustPath(path)
            : this._scope.concatPaths(this.getPath(), path);
    },

    /**
     * Gets object assigned to namespace
     * If object does not exist - namespace will try to create it by using factory method from scope
     *
     * @param  {string} name Object name
     * @returns {*} Object
     *
     * @this {Namespace}
     */
    get: function(name) {
        if (!(name in this._objects)) {
            this._objects[name] = this._scope.get(name).call(this);
        }
        return this._objects[name];
    },

    /**
     * Checks whether object with specified name exist
     *
     * @param   {string} name Object name
     * @returns {boolean} true if object with specified name exists
     *
     * @this {Namespace}
     */
    has: function(name) {
        return this._scope.has(name);
    },

    /**
     * Add namespace callback (space)
     *
     * @returns {Namespace}
     *
     * @this {Namespace}
     */
    space: function(/* injects.. , callback */) {
        var self = this;

        var injects  = _.toArray(arguments).slice(0, -1);
        var callback = _.last(arguments);
        var objects  = [];

        if (!injects.length) {
            injects = this._scope.getDefaultInjects();
        }

        for (var i = 0, ii = injects.length; i < ii; ++i) {
            objects[i] = this.get(injects[i]);
        }

        this._spaces.push(function() {
            callback.apply(self, objects);
        });

        return this;
    },

    /**
     * Executes one space
     *
     * @returns {boolean} true if space was executed, false if there are no spaces
     */
    executeSpace: function() {
        if (!this._spaces.length) {
            return false;
        }
        this._spaces.pop()();
        return true;
    }

});