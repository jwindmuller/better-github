
const { argv } = require('process');
const lib = require('./lib');
let [, , incrementType, doCommits] = argv;

if (doCommits === undefined) {
    doCommits = true;
}
if (incrementType === 'dry') {
    incrementType = 'patch';
    doCommits = false;
}

console.log({incrementType, doCommits});

const version = lib.updateVersionInFiles(incrementType);

if (doCommits) {
    lib.doGit(version);
} else {
    console.log('Skipped git actions');
}