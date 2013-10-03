Meta.Manager.setProcessor('ClazzJS.ConstantsInit', function(object, constants) {
    object['__constants'] = {};

    for (var constant in constants) {
        object['__constants'][constant] = constants[constant];
    }
})