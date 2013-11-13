var Factory = function(BaseClazz, metaProcessor) {
    this._BaseClazz     = BaseClazz     || Base;
    this._metaProcessor = metaProcessor || meta.processor('Clazz.Base');
}
var clazzUID = 0;

Factory.prototype = {

    CLASS_NAME: 'Clazz{uid}',

    create: function(params) {

        var name           = params.name || this.generateName();
        var parent         = params.parent;
        var meta           = params.meta;
        var dependencies   = params.dependencies || [];

        var clazz = this.createClazz(name, parent);

        clazz.DEPENDENCIES = dependencies;

        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }

        if (meta) {
            this.applyMeta(clazz, meta);
        }

        return clazz;
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = this._BaseClazz;
        }

        var clazz = function () {
            var response = parent.apply(this, Array.prototype.slice.call(arguments));

            if (typeof response !== 'undefined') {
                return response;
            }
        };

        // Copy all parent methods and initialize properties
        for (var property in parent) {
            if (typeof parent[property] === 'function') {
                clazz[property] = parent[property];
            }
            else if (property[0] === '_') {
                clazz[property] = undefined;
            }
        }

        clazz.NAME   = name || this.generateName();
        clazz.parent = parent;

        clazz.prototype = Object.create(parent.prototype);

        clazz.prototype.clazz  = clazz;
        clazz.prototype.parent = parent.prototype;

        return clazz;
    },

    applyMeta: function(clazz, meta) {
        this._metaProcessor.process(clazz, meta);
    },

    combineProcessors: function(/* processors... */) {
        var i, ii, type, processors;

        var combined = { clazz: [], proto: [] };

        for (i = 0, ii = arguments.length; i < ii; ++i) {
            processors = arguments[i];
            if (Object.prototype.toString.call(processors) === '[object Array]') {
                processors = {
                    clazz: processors,
                    proto: processors
                };
            }
            for (type in combined) {
                if (!(type in processors)) {
                    continue;
                }
                combined[type] = combined[type].concat(processors[type]);
            }
        }

        return combined;
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++clazzUID);
    },

    getMetaProcessor: function() {
        return this._metaProcessor;
    },

    getBaseClazz: function() {
        return this._BaseClazz;
    }
};