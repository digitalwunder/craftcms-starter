// Gulp related
import gulp, { src, dest, watch, series, parallel } from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import postcss from 'gulp-postcss';
import replace from 'gulp-replace';

// Tools
import autoprefixer from 'autoprefixer';
import dotenv from 'dotenv';
import cssnano from 'cssnano';
import browserSync from 'browser-sync';
import 'dotenv/config';

// File paths
const files = {
    scssPath: 'source/scss/**/*.scss',
    jsPath: 'source/js/**/*.js'
}

// Sass task: compiles the style.scss file into style.css
function scssTask(){
    return src([
          files.scssPath
        ])
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass()) // compile SCSS to CSS
        .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
        .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
        .pipe(dest('web/assets/css')
    ); // put final CSS in dist folder
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask(){
    return src([
          'node_modules/jquery/dist/jquery.js',
          'node_modules/bootstrap/dist/js/bootstrap.js',
          files.jsPath,
          //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
        ])
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(dest('web/assets/js')
    );
}

// Cachebust
var cbString = new Date().getTime();
function cacheBustTask(){
    return src(['templates/layout.twig'])
        .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
        .pipe(dest('templates'));
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask(){
    watch([files.scssPath, files.jsPath],
        parallel(scssTask, jsTask));
}

// Starting Server
function serve(done) {
	browserSync.init({
		proxy: process.env.DEFAULT_SITE_URL,
		files: [
			'templates/**/*.twig',
			'web/assets/js/**/*.js',
			'web/assets/css/**/*.css'
		]
	});
  done();
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
	serve,
	parallel(scssTask, jsTask),
	cacheBustTask,
	watchTask
);
