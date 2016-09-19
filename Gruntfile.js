module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['jshint', 'concat'],
                options: {
                    spawn: false,
                },
            },
        },
        jshint: {
            all: ['src/**/*.js', '/demo/**/*.js'],
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
                dest: 'dist/spa.js',
            },
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};