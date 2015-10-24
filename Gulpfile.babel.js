import gulp    from 'gulp';
import stylus  from 'gulp-stylus';
import uglify  from 'gulp-uglify';
import concat  from 'gulp-concat';
import csso    from 'gulp-csso';
import nib     from 'nib';
import rupture from 'rupture';

gulp.task('stylus', () => {
    return gulp.src('views/stylus/main.styl')
               .pipe( stylus({
                    whitespace:    true,
                    compress:      true,
                    'include css': true,
                    use: [
                        nib(),
                        rupture()
                    ]
               }))
               .pipe( csso() )
               .pipe( gulp.dest('views/styles/') );
});

gulp.task('watch', () => {
    gulp.watch('views/stylus/*.styl', ['stylus']);
});

gulp.task('default', ['stylus', 'watch']);
