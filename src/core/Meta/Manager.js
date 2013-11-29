var Manager = function() {
    this._processors = {};
};

_.extend(Manager.prototype, {

    getProcessor: function(name) {
        this.checkProcessor(name);
        return this._processors[name];
    },

    hasProcessor: function(name) {
        return name in this._processors;
    },

    setProcessor: function(name, processor) {

        if (_.isFunction(processor)) {
            processor = { process: processor }
        }

        if (!('__name' in processor)) {
            processor.__name = name;
        }

        this._processors[name] = processor;
        return this;
    },

    removeProcessor: function(name) {
        this.checkProcessor(name);

        var processor = this._processors[name];
        delete this._processors[name];

        return processor;
    },

    getProcessors: function() {
        return this._processors;
    },

    setProcessors: function(processors) {
        for (var name in processors) {
            this.setProcessor(name, processors[name]);
        }
        return this;
    },

    checkProcessor: function(name) {
        if (!this.hasProcessor(name)) {
            throw new Error('Meta processor "' + name + '" does not exists!');
        }
    }

});