ClazzJS
=======

ClazzJS is portable JavaScript library for class-style OOP programming. Its main goal to provide expressive DSL to
write your JavaScript programs in easy-to-understand, well-known, convenient and flexible class base manner. It's works
well both on client and server sides.

Features include:
* Single inheritance
* Expressive, extensible DSL for declaring of your class
* Methods generation
* Events emitting
* Object properties changes observing
* Namespaces

You'll find the example bellow to have a common idea what I'm talking about.

**Caution:** 
> This library is still under development. I don't think that its API will be changed much. But you must take into considiration.

Documentation
-------------

1. [Installation](https://github.com/alexpods/ClazzJS/blob/master/docs/1.installation.md)
2. [Clazz declaration](https://github.com/alexpods/ClazzJS/blob/master/docs/2.clazz_declaration.md)
3. [Properties](https://github.com/alexpods/ClazzJS/blob/master/docs/3.properties.md)
4. [Methods](https://github.com/alexpods/ClazzJS/blob/master/docs/4.methods.md)
5. [Constants](https://github.com/alexpods/ClazzJS/blob/master/docs/5.constants.md)
6. [Events](https://github.com/alexpods/ClazzJS/blob/master/docs/6.events.md)
7. [Namespaces](https://github.com/alexpods/ClazzJS/blob/master/docs/7.namespaces.md)

Example
--------

Main goal of this example is to give you a common idea about ClazzJS. It's not discover all features of the library. Online working version of this example is available on plnkr: [http://plnkr.co/edit/c5Xveb](http://plnkr.co/edit/c5Xveb). Feel free to play around with it!


Declaration of common 'Person' clazz:
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
            }]
        },
        birthday: {
            type: 'datetime',
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
                    return -1 !== this.const('SEX').indexOf(sex);
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

Declaration of 'Teacher' clazz inherited from 'Person':
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
                    return -1 !== this.const('SUBJECT').indexOf(subject);
                }
            }
        }
    }
});
```

Creation and manipulation of instances:
```js

// Create just common person - John (without 'new' operator)
var john = clazz('Person').create({
    name: 'John Stewart',
    sex: 'M',
    phone: '1-925-123567',
    birthday: "1989-12-13"
});

john instanceof clazz("Person"); // true 

john.getName();  // 'John Stewart'
john.getAge();   // 24
john.getSex();   // 'male'
john.getPhone(); // 1-925-123567

john.setPhone('7-925-1'); // Throw phone pattern fail error with message: 
                          // 'Value "7-925-1" does not match
                          // pattern "/\d{1,2}-\d{3}-\d{5,7}/"'

john.isSex("male");   // true
john.isSex("female"); // false

john.setSex('unsupportedSex'); // Throw existedSex constraint fail error with message:
                               // 'Constraint "existedSex" was failed!'

john.setSex('female'); // Successfully change sex of John

john.getSex();        // 'female'
john.isSex("male");   // false
john.isSex("female"); // true

john.getBirthday() instanceof Date; // true
john.getBirthday().getMonth();      // 12
john.getBirthday().getFullYear();   // 1989

// Create math teacher - Mr. George Smith. (with 'new' operator)
var mathTeacher = new clazz('Teacher')({
    name: 'George Smith',
    sex: 'male',
    birthday: '1973-12-34',
    subject: 'mathematics'
});

mathTeacher instanceof clazz('Person');    // true
mathTeacher instanceof clazz('Teacher'));  // true

mathTeacher.getName(); // John Smith
```

License
-------
Copyright (c) 2013 Aleksey Podskrebyshev. Licensed under the MIT license.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/5d748264f9d97780c4564ce024981317 "githalytics.com")](http://githalytics.com/alexpods/clazzjs)

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/alexpods/clazzjs/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

