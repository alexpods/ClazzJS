var Manager = function() {
    this._clazz      = {};
    this._clazzData  = {};
};

_.extend(Manager.prototype, {

    setClazzData: function(name, meta) {
        this._clazzData[name] = meta;
        return this;
    },

    hasClazzData: function(name) {
        return name in this._clazzData;
    },

    getClazzData: function(name) {
        if (!this.hasClazzData(name)) {
            throw new Error('Data does not exists for clazz "' + name + '"!');
        }
        return this._clazzData[name];
    },

    getClazz: function(name, dependencies) {
        dependencies = dependencies || [];

        if (name in this._clazz) {
            var clazzes = this._clazz[name];

            for (var i = 0, ii = clazzes.length; i < ii; ++i) {

                var isFound = true;
                for (var j = 0, jj = clazzes[i][1].length; j < jj; ++j) {
                    if (clazzes[i][1][j] !== dependencies[j]) {
                        isFound = false;
                        break;
                    }
                }

                if (isFound) {
                    return clazzes[i][0];
                }
            }

        }
        throw new Error('Clazz "' + name + '" does not exists!');
    },

    hasClazz: function(name, dependencies) {
        dependencies = dependencies || [];

        if (name in this._clazz) {
            var clazzes = this._clazz[name];

            for (var i = 0, ii = clazzes.length; i < ii; ++i) {

                var isFound = true;
                for (var j = 0, jj = clazzes[i][1].length; j < jj; ++j) {
                    if (clazzes[i][1][j] !== dependencies[j]) {
                        isFound = false;
                        break;
                    }
                }

                if (isFound) {
                    return true;
                }
            }

        }
        return false;
    },

    setClazz: function(name, clazz, dependencies) {
        if (!_.isFunction(clazz)) {
            throw new Error('Clazz must be a function!');
        }

        if (!(name in this._clazz)) {
            this._clazz[name] = [];
        }

        this._clazz[name].push([clazz, dependencies || []]);

        return this;
    }
});