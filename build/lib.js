const fs = require('fs');
const archive = require('node-zip')();
const semver = require('semver');
const simpleGit = require('simple-git');
const path = require('path');


const updateVersionInFiles = (incrementType) => {
    incrementType = incrementType || 'patch';
    
    let manifest = JSON.parse(fs.readFileSync('manifest.json'));
    let version = semver.parse(manifest.version);
    
    version = version.inc(incrementType).format();

    // Update version in package.json
    let package = JSON.parse(fs.readFileSync('package.json'));
    package.version = version;
    fs.writeFileSync('package.json', JSON.stringify(package, null, 4));

    // Update version in manifest.json
    manifest.version = version;
    saveManifest(manifest);


    const manifestWithUpdatedVersion = JSON.parse(fs.readFileSync('manifest.json'));

    createZip(manifestWithUpdatedVersion, true);
    createZip(manifest, false);
    
    return version;
};

const saveManifest = (manifest) => { 
    fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 4) + '\n');
}
const createZip = (manifest, forChrome) => { 
    // Make manifest compatible with each browser
    if (forChrome) {
        manifest.background = {
            "service_worker": "background.js"
        };
    } else {
        manifest.background = {
            "scripts": [
                "background.js"
            ]
        };
    }
    saveManifest(manifest);
    
    const files = [
        'icon16.png',
        'icon48.png',
        'icon128.png',
        'icon1024.png',
        'index.js',
        'styles.css',
        'manifest.json',
        'background.js',
        'styles.css',
        'popup/popup.css',
        'popup/popup.js',
        'popup/popup.html',
        'options/options.html',
        'options/options.css',
        'options/options.js',
    ];
    files.forEach(fileName => {
        archive.file(fileName, fs.readFileSync(fileName));
    });

    const zipFilePath = `better-github-for-${forChrome ? 'chrome' : 'firefox'}.zip`;
    fs.writeFileSync(
        `../${zipFilePath}`,
        archive.generate({ base64: false, compression: 'DEFLATE' }),
        'binary'
    );
    console.log(`Generated ${zipFilePath} in ${path.resolve(process.cwd(), '..')}`);
}

const doGit = async (version) => {
    const git = simpleGit();

    version = `v${version}`
    await git.add('.');
    await git.commit(version);
    await git.addTag(version);
    await git.push();
    await git.pushTags();
};

module.exports = {
    updateVersionInFiles,
    doGit
};