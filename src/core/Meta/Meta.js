var Meta = function(manager, namespace) {

    var self = function(name, processor) {
       return  _.isUndefined(processor) ?  self.get(name) : self.set(name, processor);
    };

    _.extend(self, Meta.prototype);

    self._manager   = manager;
    self._namespace = namespace;

    return self
};

_.extend(Meta.prototype, {

    getManager: function() {
        return this._manager;
    },

    getNamespace: function() {
        return this._namespace;
    },

    get: function(originalName) {

        var manager = this.getManager();
        var name    = this.resolveProcessorName(originalName);

        if (!name) {
            throw new Error('Meta processor "' + originalName + '" does not exist!');
        }

        return manager.getProcessor(name);
    },

    set: function(name, processor) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        manager.setProcessor(namespace.adjustPath(name), processor);

        return this;
    },

    resolveProcessorName: function(name) {

        var manager = this.getManager();
        var namespace = this.getNamespace();

        return namespace.getScope().search(namespace.adjustPath(name), function(name) {
            if (manager.hasProcessor(name)) {
                return name;
            }
        });
    }
});