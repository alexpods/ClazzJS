ClazzJS
=======

ClazzJS is portable JavaScript library for class-style OOP programming. It's main goal to provide expressive DSL to
write your JavaScript programs in easy-to-understand, well-known, convenient and flexible clazz base manner. It's works
well both on client and server sides.

Features include:
- Single inheritance
- Expressive, extensible DSL for declaring your class with constants, methods, properties, events and so on.
- Event emitting
- Object properties changes observing
- Namespaces

You'll find some examples bellow to have a common idea what i'm talking about.

**Caution:** 
> This library is still under development. I don't think that it's API will be changed much. But you must take this into considiration.

Documentation
-------------

1. [Installation](docs/1_Installation.md)

Examples
--------

```js
clazz("Person", {
    constants: {
        SEX: ['male', 'female']
    },
    properties: {
        name: {
            type: 'string',
            methods: ['get']
        },
        phone: {
            type: ['string', {
                pattern: /\d{1,2}-\d{3}-\d{5,7}/
            }],
            methods: ['get', 'set']
        },
        birthday: {
            type: 'datetime',
            methods: ['get', 'set'],
            constratins: {
                inPast: function(birthday) {
                    return birthday.getTime() < Date.now();
                }
            }
        },
        sex: {
            type: 'string',
            methods: ['get', 'set', 'is'],
            converters: {
                toFull: function(sex) {
                  switch(sex.toLowerCase()) {
                      case 'm': sex = 'male'; break;
                      case 'f': sex = 'female'; break;
                  }
                  return sex;
                }
            },
            constraints: {
                existedSex: function(sex) {
                    return -1 !== this.clazz.const('SEX').indexOf(sex);
                }
            }
        }
    },
    methods: {
        getAge: function() {
          return (new Date()).getFullYear() - this.getBirthday().getFullYear();
        }
    }
});
```
```js
clazz('Teacher', 'Person', {
    constants: {
        SUBJECT: ['physics', 'literature', 'mathematics']
    },
    properties: {
        subject: {
            type: 'string',
            constraints: {
                existedSubject: function(subject) {
                  return -1 !== this.clazz.const('SUBJECT').indexOf(subject);
                }
            },
            methods: ['get', 'set']
        }
    }
});
```

License
-------
Copyright (c) 2013 Aleksey Podskrebyshev. Licensed under the MIT license.
