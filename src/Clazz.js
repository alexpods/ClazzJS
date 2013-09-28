var Clazz = function() {
    var name, parent, meta;

    var first  = arguments[0];
    var second = arguments[1];
    var last   = arguments[arguments.length - 1];

    if (typeof first === 'string') {
        name = first;
    }

    if ((typeof second === 'string') || (typeof second === 'object' && second.prototype instanceof Base)) {
        parent = second;
    }

    if (last.constructor === {}.constructor || typeof last === 'function') {
        meta = last;
    }

    if (meta) {
        if (!name) {
            return Factory.create(name, parent, meta, Array.prototype.slice.call(arguments, arguments.length - 1));
        }
        Manager.setMeta(name, parent, meta);
    }
    else {
        return Manager.get(name, Array.prototype.slice.call(arguments, 1));
    }
}