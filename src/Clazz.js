var Clazz = function(name, parent, meta) {
    if (typeof meta === 'undefined') {
        meta   = parent;
        parent = null;
    }

    if (Object.prototype.toString.call(arguments) === '[object Array]') {
        return Manager.get(name, /* dependencies */ meta);
    }

    Manager.setMeta(name, parent, meta);
}