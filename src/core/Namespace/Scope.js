/**
 * Scope
 * (Namespace collection)
 *
 * @param {string}    [options.innerDelimiter]   Inner delimiter for namespaces. By default: '/'
 * @param {string[]}  [options.delimiters]       List of supported delimiters. By default: ['\', '/', '.']
 * @param {Array}     [options.defaultsInjects]  Default injects. By default: []
 *
 * @constructor
 */
var Scope = function(options) {
    options = options || {};

    this._innerDelimiter   = options.innerDelimiter || '/';
    this._delimiters       = options.delimiters     || ['\\', '/', '.'];
    this._defaultInjects   = options.defaultInjects || [];

    this._namespaces       = {};
    this._factories        = {};
};

_.extend(Scope.prototype, {

    /**
     * Gets inner delimiter
     *
     * @returns {string} Inner delimiter
     *
     * @this {Scope}
     */
    getInnerDelimiter: function() {
        return this._innerDelimiter;
    },

    /**
     * Sets inner delimiter
     *
     * @param   {string} delimiter Inner delimiter. Must be in list of supported delimiters.
     * @returns {Scope}  this
     *
     * @this {Scope}
     */
    setInnerDelimiter: function(delimiter) {
        if (!this.hasDelimiter(delimiter)) {
            throw new Error('Delimiter "' + delimiter + '" does not supported!');
        }
        this._innerDelimiter = delimiter;
        return this;
    },

    /**
     * Gets supported delimiters
     *
     * @returns {string[]} Supported delimiters;
     *
     * @this {Scope}
     */
    getDelimiters: function() {
        return this._delimiters;
    },

    /**
     * Adds supported delimiter
     *
     * @param   {string} delimiter Supported delimiter
     * @returns {Scope}  this
     *
     * @this {Scope}
     */
    addDelimiter: function(delimiter) {
        if (this.hasDelimiter(delimiter)) {
            throw new Error('Delimiter "' + delimiter + '" is already exists!');
        }
        return this;
    },

    /**
     * Removes supported delimiter
     *
     * @param   {string} delimiter Supported delimiter
     * @returns {Scope}  this
     *
     * @this {Scope}
     */
    removeDelimiter: function(delimiter) {
        if (!this.hasDelimiter(delimiter)) {
            throw new Error('Delimiter "' + delimiter + '" does not exist!');
        }
        return this;
    },

    /**
     * Check whether specified delimiter is supported
     *
     * @param   {string}  delimiter Delimiter which must be checked
     * @returns {boolean} true if specified delimiter is supported
     *
     * @this {Scope}
     */
    hasDelimiter: function(delimiter) {
        return -1 !== this._delimiters.indexOf(delimiter);
    },

    /**
     * Gets namespace by specified path.
     * If namespace does not exist, it will be created.
     *
     * @param   {string}   path         Namespace path
     * @returns {Namespace} Namespace for specified path
     *
     * @this {Scope}
     */
    getNamespace: function(path) {
        path = this.adjustPath(path);

        if (!(path in this._namespaces)) {
            this._namespaces[path] = Namespace(this, path);
        }

        return this._namespaces[path];
    },

    /**
     * Gets root namespace
     *
     * @returns {Namespace} Root namespace
     *
     * @this {Scope}
     */
    getRootNamespace: function() {
        return this.getNamespace(this.getRootPath());
    },

    /**
     * Gets path for root namespace
     *
     * @returns {string} Path for root namespace
     *
     * @this {Scope}
     */
    getRootPath: function() {
        return this._innerDelimiter;
    },

    /**
     * Adjusts namespace path
     *
     * 1) Replaces all supported delimiters by inner delimiter
     * 2) Replaces several delimiters in a row by one
     * 3) Removes trailing delimiter
     *
     * @param   {string} path Namespace path
     * @returns {string} Adjusted namespace path
     *
     * @this {Scope}
     */
    adjustPath: function(path) {

        var innerDelimiter  = this.getInnerDelimiter();
        var delimiters      = this.getDelimiters();

        return path
            .replace(new RegExp('[\\' + delimiters.join('\\') + ']', 'g'), innerDelimiter)
            .replace(new RegExp(innerDelimiter + '+', 'g'), innerDelimiter)
            .replace(new RegExp('(.+)' + innerDelimiter + '$'), function($1) { return $1; });
    },

    /**
     * Checks whether path is absolute
     *
     * @param   {string}  path Namespace path
     * @returns {boolean} true if path is absolute
     *
     * @this {Scope}
     */
    isAbsolutePath: function(path) {
        return 0 === path.indexOf(this.getRootNamespace().getPath());
    },

    /**
     * Concatenates several namespace paths
     *
     * @returns {string} Concatentated namespace path
     *
     * @this {Scope}
     */
    concatPaths: function(/* paths */) {
        return this.adjustPath(_.toArray(arguments).join(this.getInnerDelimiter()));
    },

    /**
     * Sets object factory
     *
     * @param   {string}   name     Name of object factory
     * @param   {Function} factory  Object factory
     *
     * @returns {Scope} this
     *
     * @this {Scope}
     */
    set: function(name, factory) {
        if (name in this._factories) {
            throw new Error('Factory for object "' + name + '" is already exists!');
        }
        this._factories[name] = factory;
        return this;
    },

    /**
     * Gets object factory
     *
     * @param   {string} name Name of object factory
     * @returns {Scope} this
     *
     * @throws {Error} if factory with specified name does not exist
     *
     * @this {Scope}
     */
    get: function(name) {
        if (!(name in this._factories)) {
            throw new Error('Factory for object "' + name + '" does not exist!');
        }
        return this._factories[name];
    },

    /**
     * Checks whether object factory exists for specified name
     *
     * @param   {string}  name Object factory name
     * @returns {boolean} true if factory with specified name exists
     *
     * @this {Scope}
     */
    has: function(name) {
        return name in this._factories;
    },

    /**
     * Removes object factory with specified name
     *
     * @param   {string} name Object factory name
     * @returns {Scope} this
     *
     * @throws {Error} if factory with specified name does not exist
     *
     * @this {Scope}
     */
    remove: function(name) {
        if (!(name in this._factories)) {
            throw new Error('Factory for object "' + name + '" does not exist!');
        }
        delete this._factories[name];
        return this;
    },

    /**
     * Search callback
     * Used in Scope::search() method for retrieving searched object
     *
     * @typedef {function} searchCallback
     *
     * @param   {string} path Namespace path
     * @returns {*|undefined} Search object or undefined if object was not found
     */

    /**
     * Searches for specified path
     *
     * @param {string}         path      Namespace path
     * @param {searchCallback} callback  Logic for retrieving of searched objects
     * @returns {*|undefined} Searched object or undefined if nothing was found
     *
     * @this {Scope}
     */
    search: function(path, callback) {
        path = this.adjustPath(path);

        var result = callback(path);

        if (!_.isUndefined(result)) {
            return result;
        }

        var delimiter = this.getInnerDelimiter();
        var parts     = path.split(delimiter);

        var name = parts.pop();

        while (parts.length) {
            var subpath = parts.join(delimiter);

            if (subpath in this._namespaces) {
                var namespace = this._namespaces[subpath];

                while (namespace.executeSpace()) {
                    result = callback(subpath + delimiter + name);
                    if (!_.isUndefined(result)) {
                        return result;
                    }
                }
            }
            name = parts.pop();
        }
    },

    /**
     * Gets default injects
     * (List of objects names which must be injected into namespace by default)
     *
     * @returns {string[]} Object names which must be injected into namespace
     *
     * @this {Scope}
     */
    getDefaultInjects: function() {
        return this._defaultInjects;
    },

    /**
     * Adds default inject
     * (Name of object which must be injected into namespace by default)
     *
     * @param   {string} name Object name
     * @returns {Scope} this
     *
     * @throws {Error} if default inject already exists
     *
     * @this {Scope}
     */
    addDefaultInject: function(name) {
        if (-1 !== this._defaultInjects.indexOf(name)) {
            throw new Error('Default inject "' + name + '" is already exists!');
        }
        this._defaultInjects.push(name);
        return this;
    },

    /**
     * Removed defaul inject
     * (Name of object which must be injected into namespace by default)
     *
     * @param   {string} name Object name
     * @returns {Scope} this
     *
     * @throws {Error} if default injects does not exist
     *
     * @this {Scope}
     */
    removeDefaultInject: function(name) {
        var i = this._defaultInjects.indexOf(name);
        if (-1 === i) {
            throw new Error('Default inject "' + name + '" does not exist!');
        }
        this._defaultInjects.splice(i, 1);
        return this;
    }

});