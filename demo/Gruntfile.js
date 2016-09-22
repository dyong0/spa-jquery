module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['jshint', 'concat', 'browserify'],
                options: {
                    spawn: false,
                },
            },
        },
        jshint: {
            all: ['src/**/*.js'],
            options: {
                reporter: require('jshint-stylish')
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            dist: {
                src: ['src/*.js'],
                dest: 'build/app.js',
            },
        },
        browserify: {
            dist: {
                files: {
                        'build/app.js': ['build/app.js']
                    }
                }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-browserify');
};
