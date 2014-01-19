/**
 * Clazz manager
 *
 * @constructor
 */
var Manager = function() {
    this._clazz = {};
    this._data  = {};
};

_.extend(Manager.prototype, {

    /**
     * Sets clazz data
     *
     * @param {string} name  Clazz name
     * @param {object} data  Clazz data
     * @returns {Manager} this
     *
     * @this {Manager}
     */
    setData: function(name, data) {
        this._data[name] = data;
        return this;
    },

    /**
     * Checks whether data exists for specified clazz
     *
     * @param   {string} name Clazz name
     * @returns {boolean} true if data exists for specified clazz
     *
     * @this {Manager}
     */
    hasData: function(name) {
        return name in this._data;
    },

    /**
     * Gets data for specified clazz
     *
     * @param   {string} name Clazz name
     * @returns {object} Clazz data
     *
     * @throw {Error} if data does not exist for specified clazz
     *
     * @this {Manager}
     */
    getData: function(name) {
        if (!this.hasData(name)) {
            throw new Error('Data does not exist for clazz "' + name + '"!');
        }
        return this._data[name];
    },

    /**
     * Gets clazz
     *
     * @param {string} name          Clazz name
     * @param {clazz}  parent        Parent clazz
     * @param {array}  dependencies  Clazz dependencies
     * @returns {clazz} Clazz
     *
     * @throw {Error} if specified clazz does not exist
     *
     * @this {Manager}
     */
    get: function(name, parent, dependencies) {

        if (name in this._clazz) {
            var clazzes = this._clazz[name];

            for (var i = 0, ii = clazzes.length; i < ii; ++i) {
                if (parent) {
                    if (clazzes[i][1] !== parent) {
                        continue;
                    }
                }

                var isFound = true;
                if (dependencies) {
                    for (var j = 0, jj = clazzes[i][2].length; j < jj; ++j) {
                        if (clazzes[i][2][j] !== dependencies[j]) {
                            isFound = false;
                            break;
                        }
                    }
                }

                if (isFound) {
                    return clazzes[i][0];
                }
            }

        }
        throw new Error('Clazz "' + name + '" does not exist!');
    },

    /**
     * Checks whether specified clazz is exist
     *
     * @param {string} name          Clazz name
     * @param {clazz}  parent        Parent clazz
     * @param {array}  dependencies  Clazz dependencies
     * @returns {boolean} true if specified clazz is exist
     *
     * @this {Manager}
     */
    has: function(name, parent, dependencies) {

        if (name in this._clazz) {
            var clazzes = this._clazz[name];

            for (var i = 0, ii = clazzes.length; i < ii; ++i) {
                if (parent) {
                    if (clazzes[i][1] !== parent) {
                        continue;
                    }
                }

                var isFound = true;
                if (dependencies) {
                    for (var j = 0, jj = clazzes[i][2].length; j < jj; ++j) {
                        if (clazzes[i][2][j] !== dependencies[j]) {
                            isFound = false;
                            break;
                        }
                    }

                }

                if (isFound) {
                    return true;
                }
            }

        }
        return false;
    },

    /**
     * Sets clazz
     *
     * @param {string} name             Clazz name
     * @param {clazz}  clazz            Clazz
     * @param {clazz}  parent           Parent clazz
     * @param {array}  dependencies     Clazz dependencies
     * @returns {Manager}
     *
     * @throw {Error} if clazz is not a function
     *
     * @this {Manager}
     */
    set: function(name, clazz, parent, dependencies) {
        if (!_.isFunction(clazz)) {
            throw new Error('Clazz must be a function!');
        }

        if (!(name in this._clazz)) {
            this._clazz[name] = [];
        }

        this._clazz[name].push([clazz, parent, dependencies || []]);

        return this;
    }
});