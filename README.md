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

Declaring of common Person clazz:
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

Declaring of Teacher clazz inherited from Person:
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
            }
        }
    }
});
```

Creation and manipulation of instances:
```js

// Create just common person - John
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
john.getPhone(); // 7-925-123567

john.setPhone('7-925-1'); // Throw phone pattern fail error with message: 'Value "7-925-1" does not match pattern "/\d{1,2}-\d{3}-\d{5,7}/"'

john.isSex("male");   // true
john.isSex("female"); // false

john.setSex('unsupportedSex'); // Throw existedSex constraint fail error

john.setSex('female'); // Successfully change sex of John

john.getSex();        // 'female'
john.isSex("male");   // false
john.isSex("female"); // true

john.getBirthday() instanceof Date; // true
john.getBirthday().getMonth();      // 12
john.getBirthday().getFullYear();   // 189

// Create math teacher - Mr. George Smith
var mathTeacher = clazz('Teacher').create({
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
