// -------------------- Configuration Settings --------------------
var config = {};

//basics
config.siteName = 'Company';
config.proxyDomain = 'site.local';

//source directory
config.src = 'source/';

//destinations
config.dest = 'web/assets/';
config.destJS = config.dest + 'js';
config.destCSS = config.dest + 'styles';

//globs
config.globs = {
	scss : config.src + 'scss/**/*.scss',
	js : {
		individual : config.src + 'js/individual/**/*.js',
		combined : [
			config.src + 'js/combined/libs/*.js',
			config.src + 'js/combined/plugins/*.js',
			config.src + 'js/combined/pluginSubs/*.js',
			config.src + 'js/combined/site/*.js',
			config.src + 'js/combined/site.js'
		]
	},
	watched : [
		config.src + 'craft/templates/**/*',
		config.destJS + '/**/*.min.js',
		config.destCSS + '/**/*.min.css'
	]
};

//browser sync
config.browserSync = {
	files: config.globs.watched,
	proxy: config.proxyDomain
};

// -------------------- Require Statements --------------------
var gulp             = require('gulp'),
	autoprefixer     = require('gulp-autoprefixer'),
	concat           = require('gulp-concat'),
	livereload       = require('gulp-livereload'),
	browserSync      = require('browser-sync').create(),
	newer            = require('gulp-newer'),
	notify           = require('gulp-notify'),
	plumber          = require('gulp-plumber'),
	rename           = require('gulp-rename'),
	sass             = require('gulp-sass'),
	size             = require('gulp-size'),
	uglify           = require('gulp-uglify'),
	watch            = require('gulp-watch'),
	path             = require('path'),
	cssnano          = require('gulp-cssnano'),
	sourcemaps       = require('gulp-sourcemaps'),
	lazypipe         = require('lazypipe'),
	fs               = require('fs');

// -------------------- Notification Icon Detection --------------------
/**
 * Checks to see if a file exists.
 *
 * @param filePath
 * @returns {*}
 */
function fileExists(filePath)
{
	try {
		return fs.statSync(filePath).isFile();
	} catch (err) {
		return false;
	}
}

var iconPath = path.join(__dirname, 'gulp.png');
var icon = fileExists( iconPath ) ? iconPath : null;

// -------------------- Plumber Error Handler --------------------
var plumberErrorHandler = function(err) {
	console.log( 'plumber error! "' + err.message + '"' );
	notify.onError({
		title: config.siteName,
		message: "Error: <%= err.message %>",
		sound: 'Pop'
	});
	this.emit('end');
};

// -------------------- Processors --------------------
//individual scripts (not combined)
var jsIndividualScripts = lazypipe()
	.pipe(plumber, {errorHandler: plumberErrorHandler})
	.pipe(newer, { dest: config.destJS, ext: '.min.js' })
	.pipe(gulp.dest, config.destJS)
	.pipe(size, {showFiles: true})
	.pipe(uglify)
	.pipe(rename, { suffix: '.min' })
	.pipe(gulp.dest, config.destJS)
	.pipe(size, {showFiles: true});

//combined scripts
var jsCombinedScripts = lazypipe()
	.pipe(plumber, {errorHandler: plumberErrorHandler})
	.pipe(newer, config.dest + 'js/scripts.min.js')
	.pipe(concat, 'scripts.js')
	.pipe(gulp.dest, config.destJS)
	.pipe(size, {showFiles: true})
	.pipe(uglify)
	.pipe(rename, { suffix: '.min' })
	.pipe(gulp.dest, config.destJS)
	.pipe(size, {showFiles: true});

//scss compiling
var scssProcessing = lazypipe()
	.pipe(plumber, {errorHandler: plumberErrorHandler})
	.pipe(sass, {outputStyle: ':compact'})
	.pipe(autoprefixer, 'last 2 version')
	.pipe(gulp.dest, config.destCSS)
	.pipe(size, {showFiles: true})
	.pipe(rename, { suffix: '.min' })
	.pipe(sourcemaps.init)
	.pipe(cssnano)
	.pipe(sourcemaps.write, '.')
	.pipe(gulp.dest, config.destCSS)
	.pipe(size, {showFiles: true});

// -------------------- Tasks --------------------
//styles task
gulp.task('styles', function() {
	if ( browserSync.active ) {
		return gulp.src(config.globs.scss)
			.pipe(scssProcessing())
			.pipe(browserSync.reload({stream:true}));
	}
	return gulp.src(config.globs.scss).pipe(scssProcessing());
});

//scripts individual task
gulp.task('scripts-individual', function() {
	return gulp.src(config.globs.js.individual).pipe(jsIndividualScripts());
});

//scripts combined task
gulp.task('scripts-combined', function() {
	return gulp.src(config.globs.js.combined).pipe(jsCombinedScripts());
});

//watch task
gulp.task('live', function() {
	//watch all .scss files
	gulp.watch(config.globs.scss, ['styles']);

	//watch each individual .js file
	watch(config.globs.js.individual).pipe(jsIndividualScripts());

	//watch all combined .js files
	gulp.watch(config.globs.js.combined, ['scripts-combined']);
});

//default task - one time styles and scripts
gulp.task('default', ['styles', 'scripts-individual', 'scripts-combined']);

//start browser-sync server
gulp.task('serve-bs', ['live'], function() {
	browserSync.init(config.browserSync)
});

//start livereload
gulp.task('serve-lr', ['live'], function() {
	livereload.listen();

	//watch for changes on transpired templates, css, and js files
	gulp.watch(config.globs.watched, function(event) {
		gulp.src(event.path)
			.pipe(plumber({errorHandler: plumberErrorHandler}))
			.pipe(livereload())
			.pipe(notify({
					title: config.siteName,
					message: event.type + ': ' + event.path.replace(__dirname, '').replace(/\\/g, '/') + ' was reloaded'
					//,sound: 'Pop'
					, icon: icon
				})
			);
	});
});
