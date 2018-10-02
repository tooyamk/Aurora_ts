const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const args = require("minimist")(process.argv.slice(2));
const spawn = require('child_process');
const split = require('split');
//const gutil = require('gulp-util');

const coreTsConfig = "projects/core/tsconfig.json";
const examplesTsConfig = "projects/examples/tsconfig.json";

let tsConfigBase = {
    declaration: true,
    noImplicitAny: false,
    noImplicitReturns: true,
    noEmitOnError: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    sourceMap: true,
    module: "amd",
    target: "es6",
    removeComments: true,
    preserveConstEnums: true,
    listFiles: true,
    listEmittedFiles: true,
    noResolve: true
};

function createTsConfig(outFile) {
    let conf = {};
    for (let key in tsConfigBase) {
        conf[key] = tsConfigBase[key];
    }
    conf.outFile = outFile;

    return conf;
}

/*
function build(src, dest) {
    let tsProject = ts.createProject(createTsConfig(dest));
    
    let pipe = gulp.src(src);

    if (tsProject.options.sourceMap) {
        pipe = pipe.pipe(sourcemaps.init());
    }
    
    pipe = pipe.pipe(tsProject());

    if (tsProject.options.sourceMap) {
        pipe = pipe.pipe(sourcemaps.write("", {
            sourceRoot: (file) => {
                //console.log(file.cwd);
                return file.cwd;
            }
        }));
    }

    return pipe.pipe(gulp.dest(''));
}
*/

function buildByExternalTsConfig(path) {
    let tsProject = ts.createProject(path);
    
    let pipe = tsProject.src();

    if (tsProject.options.sourceMap) {
        pipe = pipe.pipe(sourcemaps.init());
    }
    
    pipe = pipe.pipe(tsProject());

    if (tsProject.options.sourceMap) {
        pipe = pipe.pipe(sourcemaps.write("", {
            sourceRoot: (file) => {
                console.log(file.cwd);
                return file.cwd;
            }
        }));
    }

    return pipe.pipe(gulp.dest(tsProject.projectDirectory));
}

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
    //console.log("tsc starting...");

    //return build("projects/core/**/*.ts", "dist/aurora.core.js");
    //return buildByExternalTsConfig(args.tsconfig);
    build(coreTsConfig);
});

gulp.task("build-core-watch", () => {
    build(coreTsConfig, true);
    //return gulp.watch("projects/core/src/**/*.ts", ["build-core"]);
    /*
    watcher.on('change', (event) => {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        if (event.type === 'added') {
            // ...
        } else if (event.type === 'deleted') {
            // ...
        }
    });
    */
});

gulp.task("build-examples", () => {
    //console.log("tsc starting...");
    //return build("projects/examples/**/*.ts", "dist/test.js");
    //return buildByExternalTsConfig(args.tsconfig);
    build(examplesTsConfig);
});

gulp.task("build-examples-watch", () => {
    //return gulp.watch("projects/examples/src/**/*.ts", ["build-examples"]);
    build(examplesTsConfig, true);
});