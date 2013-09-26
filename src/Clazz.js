var Meta = function(options) {
    this._options = {};

    if (typeof options !== 'undefined') {
        this.setOptions(options);
    }
}

Meta.prototype = {

    process: function(object, meta) {
        var metaOption, option;

        for (option in meta) {

            metaOption = this.hasOption(option)
                ? (this.getOption(option))
                : (this.hasOption('__DEFAULT__') ? this.getOption('__DEFAULT__') : null)

            if (metaOption) {
                metaOption.process.apply(metaOption, [object, meta[option]].concat(Array.prototype.slice.call(arguments,2)) );
            }
        }
    },

    getOption: function(name) {
        if (!(name in this._options)) {
            throw new Error('Meta option "' + name + '" does not exists!');
        }
        return this._options[name];
    },

    hasOption: function(name) {
        return name in this._options;
    },

    setOption: function(option) {
        if (!(option instanceof MetaOption)) {
            throw new Error('Meta option must be instance of "Option" class!');
        }
        this._options[option.getName()] = option;
        return this;
    },

    getOptions: function() {
        return this._options;
    },

    setOptions: function(options) {

        if (Object.prototype.toString.apply(options) === '[object Array]') {
            for (var i = 0, ii = options.length; i < ii; ++i) {
                this.setOption(options[i]);
            }
        }
        else {
            for (var name in options) {
                this.setOption(new MetaOption(name, options[name]));
            }
        }

        return this;
    }
}