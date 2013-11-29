"use strict";

module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsbeautifier')

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            dev: {
                dest: "dist/<%= pkg.title %>.js",
                src: [
                    "src/.prefix",

                    "src/core/Namespace/.prefix",
                    "src/core/Namespace/*.js",
                    "src/core/Namespace/.suffix",

                    "src/core/Meta/.prefix",
                    "src/core/Meta/*.js",
                    "src/core/Meta/.suffix",

                    "src/core/Clazz/.prefix",
                    "src/core/Clazz/*.js",
                    "src/core/Clazz/.suffix",

                    "src/core/Clazz.js",
                    "src/core/Namespace.js",
                    "src/core/Base.js",
                    "src/core/Factory.js",
                    "src/core/Manager.js",

                    "src/.build",

                    "src/components/.prefix",
                    "src/components/meta/*.js",
                    "src/components/meta/Property/.prefix",
                    "src/components/meta/Property/*.js",
                    "src/components/meta/Property/.suffix",
                    "src/components/clazz/*.js",
                    "src/components/.suffix",

                    "src/.suffix"
                ]
            }
        },
        uglify: {
            min: {
                options: {
                    mangle: true,
                    compress: {
                        unused: false
                    },
                    report: 'gzip',
                    sourceMap: 'dist/<%= pkg.title %>.min.map',
                    preserveComments: false
                },
                dest: "dist/<%= pkg.title %>.min.js",
                src:  "<%= concat.dev.dest %>"
            }
        },
        jsbeautifier: {
            dev: {
                src:  ["<%= concat.dev.dest %>"]
            }
        }
    });

    grunt.registerTask('default', ['concat', 'uglify', 'jsbeautifier']);
};