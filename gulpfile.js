const gulp = require("gulp");
const args = require("minimist")(process.argv.slice(2));
const spawn = require('child_process');
const split = require('split');

const coreTsConfig = "projects/core/tsconfig.json";
const examplesTsConfig = "projects/examples/tsconfig.json";

function build(tsConfig, isWatch = false) {
    if (isWatch) {
        console.log("watch : " + tsConfig);
        let p = spawn.exec("tsc -b " + tsConfig + " -w --verbose", (error, stdout, stderr) => {
            if (stdout && stdout.length > 0) console.log(stdout);
            if (stderr && stderr.length > 0) console.log(stderr);
            if (error) console.log(`exec error: ${error}`);
        });
        p.stdout.pipe(split())
        .on("data", (line) => {
            console.log(line);
        });
    } else {
        spawn.exec("tsc -b " + tsConfig + " --verbose", (error, stdout, stderr) => {
            if (stdout && stdout.length > 0) console.log(stdout);
            if (stderr && stderr.length > 0) console.log(stderr);
            if (error) console.log(`exec error: ${error}`);
        });
    }
}

gulp.task("build-core", () => {
    build(coreTsConfig);
});

gulp.task("build-core-watch", () => {
    build(coreTsConfig, true);
});

gulp.task("build-examples", () => {
    build(examplesTsConfig);
});

gulp.task("build-examples-watch", () => {
    build(examplesTsConfig, true);
});