var Base = function() {
    if (typeof this.init === 'function') {
        this.init.apply(this, Array.prototype.toString.apply(arguments));
    }
}

Base.NAME   = '__BASE_CLAZZ__';
Base.parent = null;

Base.create = function() {
    return new this.apply(this, Array.prototype.slice(arguments));
}

Base.prototype = {
    parent: null,
    clazz:  Base
}