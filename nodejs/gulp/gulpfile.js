import gulp from 'gulp';

const {src, dest} = gulp;

gulp.task('greet', async () => {
  console.log('greet');
});

gulp.task('run', async () => {
  console.log('run');
});

gulp.task('default', gulp.series('greet', 'run'))

gulp.task('copy', () => {
  return src('../csv/*.ts').pipe(dest('../temp-gulp/'))
});
