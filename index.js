'use strict';

const fs = require('fs');
const util = require('util');
const express = require('express');
const {exec} = require('child_process');

const {
    build
} = require('ipfs-lp');

const ALBUM_TTL = 1 * 60 * 1000;
const GATEWAY_LIST = [
    'https://cloudflare-ipfs.com',
    'https://ipfs.io',
    'https://gateway.pinata.cloud'
];

const app = express();

// Set static file directory
app.use(express.static(`${__dirname}/public`, {dotfiles: 'ignore'}));

// Apply body parsing middleware
app.use(express.json());

// General utility middleware for request preprocessing
app.use((req, res, next) => {
    // Add full, original, human friendly URL w/ protocol to the request
    req.fullOriginalUrl = process.env.HOST || `${req.protocol}://${req.get('host')}`;

    return next();
});

// Create album, add album directory to /albums for preview window, zip files and add archive to /downloads
app.post('/publish', asyncHandler(async (req, res, next) => {
    const config = {
        album: req.body,
        ipfs: {
            gateways: GATEWAY_LIST
        },
        outputPath: `${__dirname}/public/albums`
    };

    const {
        name: albumName,
        path: albumPath
    } = await build(config);

    const zipPath = await zipAlbumFiles(albumPath, albumName);

    setTimeout(async () => {
        try {
            // Delete album zip, and album directory + files.
            await Promise.all([
                (async () => {
                    try {
                        await util.promisify(fs.stat)(albumPath);

                        const files = await util.promisify(fs.readdir)(albumPath);

                        await Promise.all(files.map(async (fileName) => {
                            const filePath = `${albumPath}/${fileName}`;
                            const fileStats = await util.promisify(fs.lstat)(filePath);

                            if(fileStats.isDirectory()) {
                                deleteDir(filePath);
                            } else {
                                await util.promisify(fs.unlink)(filePath);
                            }
                        }));

                        await util.promisify(fs.rmdir)(albumPath);
                    } catch(err) {
                        if (err.code !== 'ENOENT') {
                            throw err;
                        }
                    }
                })(),
                (async () => {
                    try {
                        await util.promisify(fs.stat)(zipPath);
                        await util.promisify(fs.unlink)(zipPath);
                    } catch(err) {
                        if (err.code !== 'ENOENT') {
                            throw err;
                        }
                    }
                })(),
            ]);
        } catch (err) {
            console.error('Failed to delete album output', err);

            return next(err);
        }
    }, ALBUM_TTL);

    return res.json({
        albumName,
        albumLink: `${req.fullOriginalUrl}/albums/${albumName}`,
        albumDownloadLink: `${req.fullOriginalUrl}/downloads/${albumName}.zip`,
    });
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.log(err);
    
    return res.send(500);
});

// Boot server
app.listen(process.env.PORT || 3030);

function asyncHandler(cb) {
    return function (req, res, next) {
        return Promise.resolve()
            .then(() => cb(req, res, next))
            .catch(next);
    };
}

async function zipAlbumFiles(albumPath, albumName) {
    const zipPath = `${__dirname}/public/downloads/${albumName}.zip`;

    return new Promise((resolve, reject) => {
        const zipOpts = [
            `"${zipPath}"`,
            '-j',
            `"${albumPath}/index.html"`,
            `"${albumPath}/styles.css"`,
            `"${albumPath}/script.js"`
        ];

        exec(`zip ${zipOpts.join(' ')}`, {timeout: 2000}, (error) => {
            if (error) {
                console.error('Error with child process', error);

                return reject(error);
            }

            return resolve(zipPath);
        });
    });
}