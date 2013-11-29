var Scope = function(options) {
    options = options || {};

    this._innerDelimiter   = options.innerDelimiter || '/';
    this._delimiters       = options.delimiters     || ['\\', '/', '.'];
    this._defaultInjects   = options.defaultInjects || [];

    this._namespaces       = {};
    this._factories        = {};
    this._search           = [];
};

_.extend(Scope.prototype, {

    getInnerDelimiter: function() {
        return this._innerDelimiter;
    },

    setInnerDelimiter: function(delimiter) {
        if (!this.hasDelimiter(delimiter)) {
            throw new Error('Delimiter "' + delimiter + '" does not supported!');
        }
        this._innerDelimiter = delimiter;
        return this;
    },

    getDelimiters: function() {
        return this._delimiters;
    },

    addDelimiter: function(delimiter) {
        if (this.hasDelimiter(delimiter)) {
            throw new Error('Delimiter "' + delimiter + '" is already exists!');
        }
        return this;
    },

    removeDelimiter: function(delimiter) {
        if (!this.hasDelimiter(delimiter)) {
            throw new Error('Delimiter "' + delimiter + '" does not exists!');
        }
    },

    hasDelimiter: function(delimiter) {
        return -1 !== this._delimiters.indexOf(delimiter);
    },

    getNamespace: function(path) {
        path = this.adjustPath(path);

        if (!(path in this._namespaces)) {
            this._namespaces[path] = Namespace(this, path);
        }

        return this._namespaces[path];
    },

    getRootNamespace: function() {
        return this.getNamespace(this.getRootPath());
    },

    getRootPath: function() {
        return this._innerDelimiter;
    },

    adjustPath: function(path) {

        var innerDelimiter  = this.getInnerDelimiter();
        var delimiters      = this.getDelimiters();

        return path
            .replace(new RegExp('[\\' + delimiters.join('\\') + ']', 'g'), innerDelimiter)
            .replace(new RegExp(innerDelimiter + '+', 'g'), innerDelimiter)
            .replace(new RegExp('(.+)' + innerDelimiter + '$'), function($1) { return $1; });
    },

    isAbsolutePath: function(path) {
        return 0 === path.indexOf(this.getRootNamespace().getPath());
    },

    concatPaths: function() {
        return this.adjustPath(_.toArray(arguments).join(this.getInnerDelimiter()));
    },

    set: function(name, factory) {
        if (name in this._factories) {
            throw new Error('Factory for object "' + name + '" is already exists!');
        }
        this._factories[name] = factory;
        return this;
    },

    get: function(name) {
        if (!(name in this._factories)) {
            throw new Error('Factory for object "' + name + '" does not exists!');
        }
        return this._factories[name];
    },

    has: function(name) {
        return name in this._factories;
    },

    remove: function(name) {
        delete this._factories[name];
        return this;
    },

    getInSearchError: function(path) {
        var error = new Error('Path "' + path + '" is in search state!');
        error.inSearch = true;
        error.path     = path;
        return error;
    },

    isInSearchError: function(e) {
        return e.inSearch;
    },

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

    getDefaultInjects: function() {
        return this._defaultInjects;
    },

    addDefaultInject: function(name) {
        if (-1 !== this._defaultInjects.indexOf(name)) {
            throw new Error('Default inject "' + name + '" is already exists!');
        }
        this._defaultInjects.push(name);
        return this;
    },

    removeDefaultInject: function(name) {
        var i = this._defaultInjects.indexOf(name);
        if (-1 === i) {
            throw new Error('Default inject "' + name + '" does not exists!');
        }
        this._defaultInjects.splice(i, 1);
        return this;
    }

});