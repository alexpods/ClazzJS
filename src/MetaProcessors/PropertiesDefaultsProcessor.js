var PropertiesDefaultsProcessor = function(object) {

    var property, datas = object.__getProperties();

    for (property in datas) {
        object['_' + property] = datas[property].default;
    }

}