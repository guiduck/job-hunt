/* eslint-disable new-cap */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const gulp = require("gulp");
const map = require("map-stream");
const args = require("yargs");

gulp.task("Removing unecessary permissions", () => {
  return gulp
    .src("./build/manifest.json")
    .pipe(
      map((file, done) => {
        const buildMode =
          process.env.REACT_APP_ENV_TYPE ||
          process.env.npm_config_flavor ||
          args.argv.flavor ||
          "development";

        let newFile = {
          ...file,
        };

        if (buildMode === "production") {
          const jsonContent = JSON.parse(file.contents.toString());

          const permissionsToBeRemoved = ["management"];

          jsonContent.permissions = jsonContent.permissions.filter((item) => {
            return !permissionsToBeRemoved.includes(item);
          });

          newFile = {
            ...file,
            contents: new Buffer.from(JSON.stringify(jsonContent)),
          };
        }

        done(null, newFile);
      })
    )
    .pipe(gulp.dest("."));
});

gulp.task("Removing unecessary scripts", () => {
  return gulp
    .src("./build/index.html")
    .pipe(
      map((file, done) => {
        let contents = file.contents.toString();

        contents = contents
          .replace(
            '<script defer="defer" src="/static/js/content.js"></script>',
            ""
          )
          .replace(
            '<script defer="defer" src="/static/js/background.js"></script>',
            ""
          );

        const newFile = {
          ...file,
          contents: new Buffer.from(contents),
        };

        done(null, newFile);
      })
    )
    .pipe(gulp.dest("."));
});

gulp.task(
  "default",
  gulp.series("Removing unecessary permissions", "Removing unecessary scripts")
);
