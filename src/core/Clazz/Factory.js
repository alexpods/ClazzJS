var Factory = function(options) {
    options = options || {};

    this._clazzUID      = 0;
    this._metaProcessor = options.metaProcessor || null;
    this._baseClazz     = options.baseClazz     || null;
};

_.extend(Factory.prototype, {

    CLAZZ_NAME: 'Clazz{uid}',

    getBaseClazz: function() {
        return this._baseClazz;
    },

    setBaseClazz: function(baseClazz) {
        if (!_.isFunction(baseClazz)) {
            throw new Error('Base clazz must be a function!');
        }
        this._baseClazz = baseClazz;
        return this;
    },

    getMetaProcessor: function() {
        return this._metaProcessor;
    },

    setMetaProcessor: function(metaProcessor) {
        if (!_.isFunction(metaProcessor.process)) {
            throw new Error('Meta processor must have "process" method!');
        }
        this._metaProcessor = metaProcessor;
        return this;
    },

    create: function(data) {

        var name         = data.name || this.generateName();
        var parent       = data.parent;
        var metaParent   = data.metaParent;
        var meta         = data.meta         || {};
        var dependencies = data.dependencies || [];
        var clazz        = data.clazz;

        var newClazz = this.createClazz();

        newClazz.__name  = name;
        newClazz.__clazz = clazz;

        if (_.isFunction(meta)) {
            meta = meta.apply(newClazz, [newClazz].concat(dependencies)) || {};
        }

        if (!meta.parent && metaParent) {
            meta.parent = metaParent;
        }

        parent = parent || meta.parent;

        if (_.isString(parent)) {
            parent = [parent];
        }

        if (_.isArray(parent)) {
            parent = clazz.get.apply(clazz, parent);
        }

        this.applyParent(newClazz, parent);

        newClazz.prototype.__clazz = newClazz;
        newClazz.prototype.__proto = newClazz.prototype;

        this.applyMeta(newClazz, meta);

        return newClazz;
    },

    createClazz: function() {
        return function self() {
            var result;

            if (!(this instanceof self)) {
                return _.construct(self, _.toArray(arguments));
            }

            if (_.isFunction(this.__construct)) {
                result = this.__construct.apply(this, _.toArray(arguments));
            }
            else if (self.__parent) {
                result = self.__parent.apply(this, _.toArray(arguments));
            }

            if (!_.isUndefined(result)) {
                return result;
            }
        };
    },

    applyParent: function(clazz, parent) {

        parent = parent || this.getBaseClazz();

        if (parent) {
            for (var property in parent) {
                if (property in clazz) {
                    continue;
                }
                else if (_.isFunction(parent[property])) {
                    clazz[property] = parent[property];
                }
                else if (property[0] === '_') {
                    clazz[property] = undefined;
                }
            }
        }

        clazz.prototype = _.extend(Object.create(parent ? parent.prototype : {}), clazz.prototype);

        clazz.__parent = parent || null;
        clazz.prototype.constructor = clazz;
        clazz.prototype.__parent    = parent ? parent.prototype : null;

        return clazz;
    },

    applyMeta: function(clazz, meta) {
        this.getMetaProcessor().process(clazz, meta);
        return clazz;
    },

    generateName: function() {
        return this.CLAZZ_NAME.replace('{uid}', ++this._clazzUID);
    }
});