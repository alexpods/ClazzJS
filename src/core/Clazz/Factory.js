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

    create: function(params) {

        var name         = params.name;
        var parent       = params.parent || this.getBaseClazz() || null;
        var meta         = params.meta;
        var dependencies = params.dependencies || [];

        return this.processMeta(this.createClazz({ name: name, parent: parent }), meta, dependencies);
    },

    createClazz: function(params) {

        var name    = params.name || this.generateName();
        var parent  = params.parent;
        var body    = params.body;

        var clazz = body || function() {
            var result;

            if (_.isFunction(this.__construct)) {
                result = this.__construct.apply(this, _.toArray(arguments));
            }
            else if (parent) {
                result = parent.apply(this, _.toArray(arguments));
            }

            if (!_.isUndefined(result)) {
                return result;
            }
        };

        if (parent) {
            for (var property in parent) {
                if (_.isFunction(parent[property])) {
                    clazz[property] = parent[property];
                }
                else if (property[0] === '_') {
                    clazz[property] = undefined;
                }
            }
        }

        _.extend(clazz, {
            __name:   name,
            __parent: parent || null
        });

        clazz.prototype = _.extend(Object.create(parent ? parent.prototype : {}), {
            constructor: clazz,
            __parent:    parent ? parent.prototype : null,
            __clazz:     clazz,
            __proto:     clazz.prototype
        });

        return clazz;
    },

    processMeta: function(clazz, meta, dependencies) {

        dependencies = dependencies || []
        var metaProcessor = this.getMetaProcessor();

        if (metaProcessor) {
            if (_.isFunction(meta)) {
                meta = meta.apply(clazz, dependencies);
            }

            if (_.isObject(meta)) {
                metaProcessor.process(clazz, meta);
            }
        }

        return clazz;
    },

    generateName: function() {
        return this.CLAZZ_NAME.replace('{uid}', ++this._clazzUID);
    }
});