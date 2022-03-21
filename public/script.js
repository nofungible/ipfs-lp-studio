'use strict';

(function () {
    setTimeout(function() {
        setInterval(function() {
            spinEmoji('emoji-1');
            spinEmoji('emoji-2');
        }, 250);
    }, 500);

    function spinEmoji(id) {
        var curEmoji = document.getElementById(id).innerText;
        var newEmoji = randEmoji();

        if (curEmoji !== newEmoji) {
            document.getElementById(id).innerText = newEmoji;[]
        } else {
            spinEmoji(id);
        }
    }

    function randEmoji() {
      var emoji = ['🌴', '🍕', '🎙️', '🔥', '🔈','📻','🎵','🎶', '🐬', '🌴'];

      return emoji[Math.floor(Math.random() * emoji.length)]
    }

    var buttons = Array.prototype.slice.call(document.getElementsByClassName('button'), 0);

    for (var i = 0; i < buttons.length; i++) {
        (function (el) {
            el.addEventListener('mousedown', function () {
                el.classList.add('pressed');
            });

            el.addEventListener('touchstart', function () {
                el.classList.add('pressed');
            })
        })(buttons[i]);
    }

    document.addEventListener('mouseup', function (evt) {
        var nodes = Array.prototype.slice.call(document.getElementsByClassName('pressed'), 0);

        for (var i = 0; i < nodes.length; i++) {
            nodes[i].classList.remove('pressed');
        }
    });

    document.addEventListener('touchend', function (evt) {
        var nodes = Array.prototype.slice.call(document.getElementsByClassName('pressed'), 0);

        for (var i = 0; i < nodes.length; i++) {
            nodes[i].classList.remove('pressed');
        }
    });

    document.getElementById('add-track-button').addEventListener('click', function () {
        var track = document.createElement('div');
        var trackClass = 'track-metadata-container';

        track.classList.add(trackClass);

        var trackHeader = document.createElement('div');

        trackHeader.classList.add('track-header');

        var trackHeaderDelete = document.createElement('div');

        trackHeaderDelete.classList.add('track-header-remove-button');
        trackHeaderDelete.classList.add('header-text');
        trackHeaderDelete.classList.add('embossed-text');

        trackHeaderDelete.innerText = 'X';

        trackHeaderDelete.addEventListener('mousedown', function () {
            trackHeaderDelete.classList.add('pressed');
        });

        trackHeaderDelete.addEventListener('touchstart', function () {
            trackHeaderDelete.classList.add('pressed');
        });

        trackHeaderDelete.addEventListener('click', function () {
            track.remove();

            var nodes = Array.prototype.slice.call(document.getElementsByClassName('track-number'), 0);

            for (var i = 0; i < nodes.length; i++) {
                nodes[i].innerText = (i + 1) + '. ';
            }
        });

        trackHeader.appendChild(trackHeaderDelete);

        var trackHeaderNumber = document.createElement('span');

        trackHeaderNumber.classList.add('track-number', 'header-text');

        var trackNumber = (Array.prototype.slice.call(document.getElementsByClassName(trackClass), 0).length) + 1;

        trackHeaderNumber.innerText = trackNumber + '. ';

        trackHeader.appendChild(trackHeaderNumber);

        var trackHeaderTitle = document.createElement('span');

        trackHeaderTitle.classList.add('track-header-title', 'header-text');

        trackHeaderTitle.innerText = 'New Track';

        trackHeader.appendChild(trackHeaderTitle);

        track.appendChild(trackHeader);

        var trackTitleInput = document.createElement('input');

        trackTitleInput.setAttribute('type', 'text');
        trackTitleInput.classList.add('track-title-input');

        var now = Date.now();

        trackTitleInput.id = 'track-title-' + now;

        var trackCidInput = document.createElement('input');

        trackCidInput.setAttribute('type', 'text');
        trackCidInput.classList.add('track-cid-input');

        trackCidInput.id = 'track-cid-' + now;

        var titleWrapper = document.createElement('div');
        var titleLabel = document.createElement('label');

        titleLabel.setAttribute('for', 'track-title-' + now);
        titleLabel.innerText = 'Track Title';

        titleWrapper.appendChild(titleLabel);
        titleWrapper.appendChild(document.createElement('br'));
        titleWrapper.appendChild(trackTitleInput);
        track.appendChild(titleWrapper);

        var cidWrapper = document.createElement('div');

        var cidLabel = document.createElement('label');

        cidLabel.setAttribute('for', 'track-cid-' + now);
        cidLabel.innerText = 'Track CID';

        cidWrapper.appendChild(cidLabel);
        cidWrapper.appendChild(document.createElement('br'));
        cidWrapper.appendChild(trackCidInput);
        track.appendChild(cidWrapper);

        var trackStatusText = document.createElement('p');
        var trackStatusSubtext = document.createElement('span');

        trackStatusText.classList.add('current-status-text');
        trackStatusText.innerText = 'Info: ';

        trackStatusSubtext.classList.add('current-status');
        trackStatusSubtext.innerText = '-';

        trackStatusText.appendChild(trackStatusSubtext);
        track.appendChild(trackStatusText);

        var trackWrapper = document.createElement('div');

        trackWrapper.appendChild(track);

        debounceInput(trackTitleInput, function () {
           trackHeaderTitle.innerText = trackTitleInput.value ? truncateString(trackTitleInput.value) : 'New Track';
        });

        debounceInput(trackCidInput, function () {
            var startLoadTime = Date.now();

            trackStatusSubtext.innerText = 'Loading';

            fetch('https://cloudflare-ipfs.com/ipfs/' + trackCidInput.value, {method: 'HEAD'})
            .then(function(res) {
                var mimeType = res.headers.get('Content-Type');

                setTimeout(function () {
                    trackStatusSubtext.innerText = mimeType;
                }, calcLoadTime(startLoadTime));

                trackCidInput.setAttribute('data-mime-type', mimeType);
            })
            .catch(function (err) {
                console.error('Failed to load track IPFS resource');

                setTimeout(function () {
                    trackStatusSubtext.innerText = 'Load Failed';
                }, calcLoadTime(startLoadTime));

                throw err;
            });

            function calcLoadTime(startTime) {
                var waitTime = 500 - (Date.now() - startTime);

                return parseInt(waitTime) && waitTime > 0 ? waitTime : 0;
            }
        });

        document.getElementById('album-tracklist').appendChild(trackWrapper);
    });

    var albumArtworkInput = document.getElementById('album-artwork-cid-input');

    debounceInput(albumArtworkInput, function () {
        var startLoadTime = Date.now();
        var albumArtworkStatusText = document.getElementById('artwork-current-status');

        albumArtworkStatusText.innerText = 'Loading';

        fetch('https://cloudflare-ipfs.com/ipfs/' + albumArtworkInput.value, {method: 'HEAD'})
        .then(function(res) {
            var mimeType = res.headers.get('Content-Type');

            setTimeout(function () {
                albumArtworkStatusText.innerText = mimeType;
            }, calcLoadTime(startLoadTime));

            albumArtworkInput.setAttribute('data-load-complete', true);
            albumArtworkInput.setAttribute('data-mime-type', mimeType);
        })
        .catch(function (err) {
            console.error('Failed to load track IPFS resource');

            setTimeout(function () {
                albumArtworkStatusText.innerText = 'Load Failed';
            }, calcLoadTime(startLoadTime));

            throw err;
        });

        function calcLoadTime(startTime) {
            var waitTime = 500 - (Date.now() - startTime);

            return parseInt(waitTime) && waitTime > 0 ? waitTime : 0;
        }
    });

    document.getElementById('generate-album-button').addEventListener('click', function () {
        var albumTitle = document.getElementById('album-title-input').value;
        var albumArtworkCid = document.getElementById('album-artwork-cid-input').value;
        var albumArtworkMime = document.getElementById('album-artwork-cid-input').getAttribute('data-mime-type');
        var trackTitles = Array.prototype.slice.call(document.getElementsByClassName('track-title-input'), 0);
        var trackCids = Array.prototype.slice.call(document.getElementsByClassName('track-cid-input'), 0);
        var tracklist = [];

        if (albumTitle === undefined || albumTitle === null || albumTitle === '') {
            return alert('Hmmm... your album is missing a title.');
        } else if (albumArtworkCid === undefined || albumArtworkCid === null || albumArtworkCid === '') {
            return alert('Wait! Your album is missing an artwork CID.');
        }

        if (!trackTitles.length) {
            return alert('No go, amigo. Your album has no tracks!');
        }

        for (var i = 0; i < trackTitles.length; i++) {
            var trackMeta = {
                title: trackTitles[i].value,
                cid: trackCids[i].value,
                mime: trackCids[i].getAttribute('data-mime-type')
            };

            if (trackMeta.title === undefined || trackMeta.title === null || trackMeta.title === '') {
                return alert('Dude, Track ' + (i + 1) + ' is missing its title!');
            } else if (trackMeta.cid === undefined || trackMeta.cid === null || trackMeta.cid === '') {
                return alert('Dude, Track ' + (i + 1) + ' is missing its CID!');
            }

            tracklist.push(trackMeta);
        }

        var albumPayload = {
            title: albumTitle,
            cover_cid: albumArtworkCid,
            cover_mime: albumArtworkMime,
            tracklist: tracklist
        };

        var isCompletelyLoaded = true;

        if (!albumPayload.cover_mime) {
            isCompletelyLoaded = false;
        } else {
            for (var i = 0; i < albumPayload.tracklist.length; i++) {
                if (!albumPayload.tracklist[i].mime) {
                    isCompletelyLoaded = false;

                    break;
                }
            }
        }

        var shouldPublish = true;

        if (!isCompletelyLoaded) {
            shouldPublish = confirm('Hold up! Your resources haven\'t been loaded. Should I force this through anyway?');
        }

        if (!shouldPublish) {
            return false;
        }

        fetch('/publish', {
            method: 'POST',
            body: JSON.stringify(albumPayload),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(function (res) {
            return res.json();
        })
        .then(function (jsonBody) {
            var iframeEl = document.createElement('iframe');

            iframeEl.setAttribute('id', 'album-preview');

            var messageTable = document.getElementById('preview-msg-table');

            messageTable && messageTable.classList.add('hidden');

            var previewContainer = document.getElementById('preview-container');

            previewContainer.innerHTML = '';

            previewContainer.appendChild(iframeEl);
            iframeEl.setAttribute('src', jsonBody.albumLink);

            var downloadLink = document.createElement('a');

            downloadLink.href = jsonBody.albumDownloadLink;
            downloadLink.innerText = truncateString(albumPayload.title) + ' .zip file';

            var linkWrapper = document.getElementById('download-link-wrapper');

            linkWrapper.innerText = '';
            linkWrapper.innerHTML = '';
            linkWrapper.appendChild(downloadLink);
            linkWrapper.appendChild(document.createElement('br'));

            var warningText = document.createElement('span');

            warningText.id = 'download-warning-text';

            warningText.innerText = 'Link will expire in five minutes!';

            linkWrapper.appendChild(warningText);
        })
        .catch(function (err) {
            // @TODO do something better here haha
            console.error('Failed to publish album', err);
        });
    });

    function debounceInput(el, cb) {
        var timeout;

        el.addEventListener('input', function () {
            timeout && clearTimeout(timeout);

            timeout = setTimeout(cb, 500);
        });
    }

    function truncateString(str) {
        return str.length > 18 ? str.substring(0, 14) + '...' : str;
    }
})();