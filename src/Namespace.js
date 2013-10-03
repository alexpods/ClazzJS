var Namespace = function(manager, factory, meta, baseNamespace, space, global, Class) {
    Class = Class || Clazz;

    var namespace = function(space, callback) {
        var newNamespace = new Namespace(manager, factory, namespace, space, global);
        var newClazz     = new Class(manager, factory, namespace, meta);

        if (callback) {
            callback(newNamespace, newClazz);
        }

        return newClazz;
    }

    namespace.getManager = function() {
        return manager;
    }

    namespace.getFactory = function() {
        return factory;
    }

    namespace.getMeta = function() {
        return meta;
    }

    namespace.getBaseNamespace = function() {
        return baseNamespace;
    }

    namespace.getGlobal = function() {
        return global;
    }

    namespace.getPath = function() {
        return Namespace.adjust((baseNamespace ? baseNamespace.getPath() : Namespace.GLOBAL)+Namespace.getDelimiter()+space);
    }

    namespace.getPaths = function() {
        var paths = this.getPath();

        if (-1 === paths.indexOf(Namespace.GLOBAL)) {
            paths.push(Namespace.GLOBAL);
        }
        return [this.getPath()]
    }

    namespace.apply = function(space, path) {
        return Namespace.adjust(path || this.getPath()+Namespace.getDelimiter()+space);
    }

    return namespace;
}

Namespace.GLOBAL            = 'GLOBAL';
Namespace.DEFAULT_DELIMITER = '.';
Namespace.DELIMITERS        = ['\\', '/', '_', '-', '.']

Namespace._delimiter = null;

Namespace.setDelimiter = function(delimiter) {
    if (!(delimiter in this.DELIMITERS)) {
        throw new Error('Unsupported delimiter');
    }
}

Namespace.getDelimiter = function() {
    return this._delimiter || this.DEFAULT_DELIMITER
}

Namespace.adjust = function(space) {
    var regexp = '[\\' + this.DELIMITERS.join('\\') + ']';

    return space
        .replace(new RegExp(regexp + '+', 'g'), this.getDelimiter())
        .replace(new RegExp('^' + regexp + '|' + regexp + '$'), '')
}