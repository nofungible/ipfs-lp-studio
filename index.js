'use strict';

const fs = require('fs');
const util = require('util');
const express = require('express');

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

app.use(express.static(`${__dirname}/public`));
app.use(express.json());

app.post('/publish', async (req, res) => {
    try {
        const config = {
            album: req.body,
            ipfs: {
                gateways: GATEWAY_LIST
            },
            outputPath: `${__dirname}/public/albums`
        };

        const albumPath = await build(config);

        setTimeout(async () => {
            try {
                let dirExists;

                try {
                    await util.promisify(fs.stat)(albumPath);
            
                    dirExists = true;
                } catch(err) {
                    if (err.code === 'ENOENT') {
                        dirExists = false;
                    }
            
                    throw err;
                }
            
                if (dirExists) {
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
                }
            } catch (err) {
                console.error('Failed to delete album output', err);

                return next(err);
            }
        }, ALBUM_TTL);


        return res.send(200);
    } catch (err) {
        console.log(err);
    
        return res.send(500);
    }
});

app.listen(process.env.PORT || 3030);
