var utils = {

    copy: function(object) {
        var copy, toString = Object.prototype.toString.apply(object);

        if ('[object Date]' === toString) {
            copy = new Date(object.getTime())
        }
        else if ('[object Array]' === toString) {
            copy = [];
            for (var i = 0, ii = object.length; i < ii; ++i) {
                copy[i] = this.copy(object[i]);
            }
        }
        else if ('[object RegExp]' === toString) {
            copy = new RegExp(object.source);
        }
        else if (object && {}.constructor == object.constructor) {
            copy = {};
            for (var property in object) {
                copy[property] = this.copy(object[property]);
            }
        }
        else {
            copy = object;
        }

        return copy;
    }

};