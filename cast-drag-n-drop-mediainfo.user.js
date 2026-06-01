// ==UserScript==
// @name         CAST Upload MediaInfo
// @version      2.2
// @description  Drag & drop files to generate MediaInfo using https://mediainfo.js.org CDN - PORTED FROM PTP
// @match        https://canal-street.org/upload.php*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(async () => {
    const CDN_URL = 'https://unpkg.com/mediainfo.js';

    // Create UI
    const mediaInfoTitleBlock = document.getElementById("file").cloneNode(true);
    mediaInfoTitleBlock.id = "media_info_file_input"

    const releaseDescriptionBlock = document.getElementById("mediainfo");
    releaseDescriptionBlock.parentNode.insertBefore(mediaInfoTitleBlock, releaseDescriptionBlock);

    const mediaInfoStatus = document.createElement("p");
    mediaInfoStatus.id = "mediainfo_output";
    mediaInfoStatus.innerText = "Select or drag & drop a file above";

    releaseDescriptionBlock.parentNode.insertBefore(mediaInfoStatus, releaseDescriptionBlock);



    const fileinput = document.getElementById('media_info_file_input');
    const output = document.getElementById('mediainfo_output');

    // Inject the MediaInfo script
    try {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = CDN_URL;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    } catch (err) {
        output.value = 'Failed to load MediaInfo JS: ' + err;
        console.error(err);
        return;
    }

    // Initialize MediaInfo
    MediaInfo.default({ format: 'text' }, mediainfo => {
        // Enable file input and handle file selection
        fileinput.removeAttribute('disabled');
        fileinput.addEventListener('change', async () => {
            const file = fileinput.files[0];
            if (!file) return;
            output.innerText = 'Working…';

            const getSize = () => file.size;
            const readChunk = (chunkSize, offset) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target.error) return reject(event.target.error);
                        resolve(new Uint8Array(event.target.result));
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
                });

            try {
                const result = await mediainfo.analyzeData(getSize, readChunk);
                output.value = result;
                const desc = document.getElementById('mediainfo');
                let miDesc = result.replace(/^Format\s{7}(\s*)/m, 'Complete name$1: ' + file.name + '\nFormat       $1');
                if (desc && !desc.value.includes(miDesc)) {
                    desc.value += miDesc;
                }

                output.innerText = 'Complete';
            } catch (err) {
                output.innerText = `An error occurred:\n${err.stack}`;
                console.error(err);
            }
        });
    }, err => {
        output.innerText = 'MediaInfo initialization failed: ' + err;
        console.error(err);
    });
})();
