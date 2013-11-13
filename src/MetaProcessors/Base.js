meta.processor('Clazz.Base', {

    _types: {
        clazz: function(clazz) { return clazz; },
        proto: function(clazz) { return clazz.prototype; }
    },

    _processors: {
        clazz: {
            clazz: 'Clazz.Clazz'
        },
        proto: {
            proto: 'Clazz.Proto'
        }
    },

    process: function(clazz, metaData) {
        var self = this;

        var type, processingObject, processor, i, ii, j, jj, processorsContainer;

        var parentProcessors = clazz.parent && ('__getMetaProcessors' in clazz.parent)
            ? clazz.parent.__getMetaProcessors()
            : this._processors;
        var metaProcessors = metaData.meta_processors || {};

        var processorsContainers = [parentProcessors, metaProcessors];

        var processors = {};

        for (j = 0, jj = processorsContainers.length; j < jj; ++j) {
            processorsContainer = processorsContainers[j];

            for (type in  processorsContainer) {
                if (!(type in processors)) {
                    processors[type] = [];
                }

                processorsContainer[type] = [].concat(processorsContainer[type]);

                for (i = 0, ii = processorsContainer[type].length; i < ii; ++i) {
                    processor = processorsContainer[type][i];
                    if (typeof processor === 'string') {
                        processor = meta.processor(processor);
                    }
                    if (!(processor in processors[type])) {
                        processors[type].push(processor);
                    }
                }
            }
        }

        for (type in processors) {
            processingObject = self._types[type](clazz);

            for (i = 0, ii = processors[type].length; i < ii; ++i) {
                processors[type][i].process(processingObject, metaData);
            }
        }

        clazz.__getMetaProcessors =  function(type) {
            return typeof type !== 'undefined' ? processors[type] : processors;
        }
    },

    addType: function(name, getter) {
        if (!(name in this._processors)) {
            this._processors[name] = {};
        }
        this._types[name] = getter;
        return this;
    },

    removeType: function(name) {
        if (name in this._processors) {
            delete this._processors[name];
        }
        delete this._types[name];
        return this;
    },

    addProcessor: function(type, name, processor) {
        this._processors[type][name] = processor;
        return this;
    },

    removeProcessor: function(type, name) {
        delete this._processors[type][name];
        return this;
    }

});