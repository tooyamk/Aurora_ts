const gulp = require("gulp");
//const args = require("minimist")(process.argv.slice(2));
const spawn = require('child_process');
const split = require('split');

const coreTsConfig = "projects/Core/tsconfig.json";
const fbxFileTsConfig = "projects/FbxFile/tsconfig.json";
const wxplatformTsConfig = "projects/WxPlatform/tsconfig.json";
const examplesTsConfig = "projects/Examples/tsconfig.json";

function build(tsConfig, isWatch = false) {
    if (isWatch) {
        console.log("watch : " + tsConfig);
        const p = spawn.exec("tsc -b " + tsConfig + " -w --verbose", (error, stdout, stderr) => {
            if (stdout) console.log(stdout);
            if (stderr) console.log(stderr);
            if (error) console.log(`exec error: ${error}`);
        });
        p.stdout.pipe(split())
        .on("data", (line) => {
            console.log(line);
        });
    } else {
        spawn.exec("tsc -b " + tsConfig + " --verbose", (error, stdout, stderr) => {
            if (stdout) console.log(stdout);
            if (stderr) console.log(stderr);
            if (error) console.log(`exec error: ${error}`);
        });
    }
}

gulp.task("build-Core", () => {
    build(coreTsConfig);
});

gulp.task("build-Core-watch", () => {
    build(coreTsConfig, true);
});

gulp.task("build-FbxFile", () => {
    build(fbxFileTsConfig);
});

gulp.task("build-FbxFile-watch", () => {
    build(fbxFileTsConfig, true);
});

gulp.task("build-WxPlatform", () => {
    build(wxplatformTsConfig);
});

gulp.task("build-WxPlatform-watch", () => {
    build(wxplatformTsConfig, true);
});

gulp.task("build-Examples", () => {
    build(examplesTsConfig);
});

gulp.task("build-Examples-watch", () => {
    build(examplesTsConfig, true);
});