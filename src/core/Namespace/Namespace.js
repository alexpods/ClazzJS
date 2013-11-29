var Namespace = function(scope, path) {

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

    getPath: function() {
        return this._path;
    },

    getScope: function() {
        return this._scope;
    },

    adjustPath: function(path) {
        return this._scope.isAbsolutePath(path) ? this._scope.adjustPath(path) : this._scope.concatPaths(this.getPath(), path);
    },

    get: function(name) {
        if (!(name in this._objects)) {
            this._objects[name] = this._scope.get(name).call(this);
        }
        return this._objects[name];
    },

    has: function(name) {
        return this._scope.has(name);
    },

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

    executeSpace: function() {
        if (!this._spaces.length) {
            return false;
        }
        this._spaces.pop()();
        return true;
    }

});