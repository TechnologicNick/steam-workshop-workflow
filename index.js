const fetch = require('node-fetch');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');


class SteamWorkshop {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getDetails(ids) {
        if(typeof(ids) === "number") ids = [ids];

        let url = `https://api.steampowered.com/IPublishedFileService/GetDetails/v1/?key=${this.apiKey}`;

        for (let i = 0; i < ids.length; i++) {
            url += `&publishedfileids[${i}]=${ids[i]}`;
        }

        let result = await fetch(url);
        let json = await result.json();

        if (result.status !== 200) throw new Error(result.statusText || result.status);

        return json.response.publishedfiledetails;
    }
}

class ItemDisplay {
    constructor(details, path) {
        this.details = details;
        this.path = path;
    }

    generateImages() {
        this.generatePreview("preview.png", 200, 200);
    }

    async generatePreview(filename, width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        let preview = await loadImage(this.details.preview_url);
        let aspectRatio = preview.width/preview.height;

        context.drawImage(preview, 0, height/2 - (200 / aspectRatio)/2, width, 200 / aspectRatio);

        await new Promise((resolve, reject) => {
            const out = fs.createWriteStream(this.path + filename);
            const stream = canvas.createPNGStream();
            stream.pipe(out)

            out.on("finish", resolve);
            out.on("error", reject);
        });

        console.log(`[${this.details.publishedfileid}] Generated preview`);
    }
}

module.exports.SteamWorkshop = SteamWorkshop;
module.exports.ItemDisplay = ItemDisplay;
