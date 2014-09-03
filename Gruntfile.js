
module.exports = function(grunt) {
	'use strict';

	// 1. All configuration goes here 
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		version: grunt.file.readJSON('package.json').version,
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= version %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= pkg.license %> */\n',
		
		less: {
			dist: {
				files: { 'assets/css/bundle.css':'src/static/less/views/snpages.less' },
				options: { cleancss: true },
			},
		},
		
		// coffee: {
		// 	options: {
		// 		bare: true,
		// 	},
		// 	glob_to_multiple: {
		// 		expand: true,
		// 		src: ['src/**/*.coffee','tasks/**/*.coffee'],
		// 		ext: '.js',
		// 	}
		// },

		watch: {
			options: {
				// livereload: true,
				// interrupt: true,
				atBegin: true,
			},
			// coffee: {
			// 	files: ['**/*.coffee'],
			// 	tasks: ['coffee'],
			// 	options: { spawn: true },
			// },
			react: {
				files: ['src/static/js/**/*.jsx'],
				tasks: ['react'],
			},
			css: {
				files: ['src/static/less/**/*.less'],
				tasks: ['less'],
				options: { spawn: true },
			},
		},

		browserify: {
			lib: {
				files: { "assets/js/bundle.js": "src/static/js/app/views/wall.js", },
				options: {
					preBundleCB: function (b) {
						// b.plugin('minifyify', {
						// 	// compressPath: function (p) {
						// 	// 	return require('path').relative(__dirname, p);
						// 	// },
						// 	// map: '/static/js/bundle.map',
						// 	// output: "assets/js/bundle.map "
						// });
						return b;
					},
				},
			},
			options: {
				watch: true,
				keepAlive: true,
				debug: true,
			}
		},

		nodemon: {
			server: {
				script: 'src/server.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					ignore: ['node_modules/**','src/static/**', '/src/static/js/app/components/', 'assests/**'],
					// watch: ['src'],
					ext: 'js,coffee',
					delay: 0,
					legacyWatch: true,
					cwd: __dirname,
				}
			},
		},

		react: {
			files: {
				expand: true,
				cwd: 'src/static/js/app',
				src: ['**/*.jsx'],
				dest: 'src/static/js/app',
				ext: '.js'
			}
		},

		concurrent: {
			watch: {
				tasks: ['watch', 'browserify'],
				options: {
					logConcurrentOutput: true
				}
			}
		},
	});

	// 3. Where we tell Grunt we plan to use this plug-in.
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	// grunt.loadNpmTasks('grunt-iced-coffee');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-react');

	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('serve', ['nodemon:server']);
	grunt.registerTask('watchy', ['concurrent:watch']);
};
