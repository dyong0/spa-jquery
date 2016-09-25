module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['jshint', 'concat', 'uglify'],
                options: {
                    spawn: false,
                },
            },
        },
        jshint: {
            all: ['src/**/*.js'],
            options: {
                reporter: require('jshint-stylish', { beep: true })
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            dist: {
                src: ['src/spa-jquery.js', 'src/component.js', 'src/state.js'],
                dest: 'dist/spa-jquery.js',
            },
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'dist/spa-jquery.js',
                dest: 'dist/spa-jquery.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};
