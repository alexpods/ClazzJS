clazz('Animal', {});

namespace('Animals', function(clazz, namespace) {

    clazz('Cat', '/Animal', {});

    clazz('Dog', '/Animal', {});

    namespace('Cats', 'namespace', 'clazz', function(namespace, clazz) {

        clazz('Lion', '/Animals/Cat', {});

        clazz('Tiger', '/Animals/Cat', {});

        clazz('Domestic', '/Animals/Cat', {});

        namespace('Domestic', 'clazz', function(clazz) {

            clazz('SomeOrdinaryCat', '/Animals/Cats/Domestic', {});
        });
    });
});

var Animal = clazz('/Animal');

var Cat    = clazz('/Animals/Cat');
var Dog    = clazz('/Animals/Dog');

var Lion      = clazz('/Animals/Cats/Lion');
var Tiger     = clazz('/Animals/Cats/Tiger');
var Domestic = clazz('/Animals/Cats/Domestic');

var SomeOrdinaryCat = clazz('/Animals/Cats/Domestic/SomeOrdinaryCat');

document.write('Cat.__isSubclazzOf(Animal): ' + Cat.__isSubclazzOf(Animal) + '<br>');
document.write('Dog.__isSubclazzOf(Animal): ' + Dog.__isSubclazzOf(Animal) + '<br>');
document.write('Cat.__isSubclazzOf(Dog): '    + Cat.__isSubclazzOf(Dog)    + '<br>');

document.write('Lion.__isSubclazzOf(Cat): '    + Lion.__isSubclazzOf(Cat)    + '<br>');
document.write('Lion.__isSubclazzOf(Dog): '    + Lion.__isSubclazzOf(Dog)    + '<br>')
document.write('Lion.__isSubclazzOf(Animal): ' + Lion.__isSubclazzOf(Animal) + '<br>');

document.write('SomeOrdinaryCat.__isSubclazzOf(Domestic): ' + SomeOrdinaryCat.__isSubclazzOf(Domestic) + '<br>');