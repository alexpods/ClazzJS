clazz('Person', {
    clazz_properties: {
        count: 1000,
        countries: {
            type: ['array', { element: ['string' , { pattern: /(\w+\s?)+/ }] }],
            default: []
        }
    },
    properties: {
        name: {
            type: 'string',
            constraints: {
                withoutNumbers: function(value) {
                    return (/[a-zA-Z]+/).test(value);
                }
            },
            methods: ['get', 'is' ]
        },
        birthday: ['datetime'],
        phone:    ['string', { pattern: /\d{1,2}-\d{3}-\d{5,7}/ }],
        sex: {
            converters: {
                fullForm: function(value) {
                    switch (value.toLowerCase()) {
                        case 'male':   value = 'M'; break;
                        case 'female': value = 'F'; break;
                    }
                    return value;
                },
                upperCase: function(value) {
                    return value.toUpperCase();
                }
            },
            constraints: {
                M_F: function(value) {
                    return -1 !== ['M','F'].indexOf(value)
                }
            },
            default: 'M',
        },
        skinColor: undefined,
        eyeColor: null,
        hairColor: 'black',
        address: function() {
            return 'some addres';
        }
    }
});