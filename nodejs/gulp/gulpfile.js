import gulp from 'gulp';

gulp.task('greet', async () => {
  console.log('greet');
});

gulp.task('run', async () => {
  console.log('run');
});

gulp.task('default', gulp.series('greet', 'run'))
