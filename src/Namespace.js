var Namespace = function(manager, factory, baseNamespace, space, global, Class) {
    Class = Class || Clazz;

    var namespace = function(space, callback) {
        var newNamespace = new Namespace(manager, factory, namespace, space, global);
        var newClazz     = new Class(manager, factory, newNamespace);

        if (callback) {
            Namespace.setCallback(newNamespace, newClazz, callback);
        }

        return newClazz;
    };

    namespace.getManager = function() {
        return manager;
    };

    namespace.getFactory = function() {
        return factory;
    };

    namespace.getBaseNamespace = function() {
        return baseNamespace;
    };

    namespace.getGlobal = function() {
        return global;
    };

    namespace.getPath = function() {
        return Namespace.adjust((baseNamespace ? baseNamespace.getPath() : Namespace.getGlobalPath())+(space ? Namespace.getDelimiter()+space : ''));
    };

    namespace.getPaths = function() {
        var paths = [].concat(this.getPath());

        if (-1 === paths.indexOf(Namespace.getGlobalPath())) {
            paths.push(Namespace.getGlobalPath());
        }
        return paths;
    };

    namespace.apply = function(space, path) {
        if (0 === space.search('[\\' + Namespace.DELIMITERS.join('\\') + ']')) {
            return Namespace.adjust(space);
        }
        return Namespace.adjust((path || this.getPath())+Namespace.getDelimiter()+space);
    };

    namespace.callback = function(clazzName) {
        return Namespace.executeNextCallback(clazzName);
    };

    return namespace;
};

Namespace.DEFAULT_DELIMITER = '/';
Namespace.DELIMITERS        = ['\\', '/', '_', '-', '.'];

Namespace._delimiter = null;
Namespace._callbacks = {};

Namespace.setDelimiter = function(delimiter) {
    if (!(delimiter in this.DELIMITERS)) {
        throw new Error('Unsupported delimiter');
    }
    this._delimiter = delimiter;
    return this;
};

Namespace.getDelimiter = function() {
    return this._delimiter || this.DEFAULT_DELIMITER
};

Namespace.getGlobalPath = function() {
    return this.getDelimiter();
}

Namespace.adjust = function(space) {
    var regexp = '[\\' + this.DELIMITERS.join('\\') + ']';

    return space
        .replace(new RegExp(regexp + '+', 'g'), this.getDelimiter())
        .replace(new RegExp(regexp + '$'), '')
};

Namespace.setCallback = function(namespace, clazz, callback) {
    var path = namespace.getPath();

    if (!(path in this._callbacks)) {
        this._callbacks[path] = [];
    }

    this._callbacks[path].push(function() {
        callback(clazz, namespace);
    })
};

Namespace.executeNextCallback = function(clazzName) {
    var part, callback;

    var delimiter = this.getDelimiter();
    var parts     = clazzName.split(delimiter);

    parts.pop();

    while (parts.length) {
        part = parts.join(delimiter);
        if (part in this._callbacks) {
            callback = this._callbacks[part].shift();
            if (!this._callbacks[part].length) {
                delete this._callbacks[part];
            }
            callback();
            return true;
        }
        parts.pop();
    }
    return false;
};