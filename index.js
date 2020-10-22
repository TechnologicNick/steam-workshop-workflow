const fetch = require('node-fetch');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const core = require('@actions/core');
const path = require('path');


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
    constructor(details, imagePath) {
        this.details = details;
        this.imagePath = imagePath;
    }

    async generateImages() {
        await Promise.all([
            this.generatePreview("preview.png", 200, 200),
            this.generateContent("content.png", 600, 200)
        ]);
    }

    async generatePreview(filename, width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        let preview = await loadImage(this.details.preview_url);
        let aspectRatio = preview.width/preview.height;

        context.drawImage(preview, 0, height/2 - (200 / aspectRatio)/2, width, 200 / aspectRatio);

        await this.saveFile(canvas, filename);

        console.log(`[${this.details.publishedfileid}] Generated preview.png`);
    }

    async generateContent(filename, width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        // let preview = await loadImage(this.details.preview_url);
        // let aspectRatio = preview.width/preview.height;

        // context.drawImage(preview, 0, height/2 - (200 / aspectRatio)/2, width, 200 / aspectRatio);
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(0, 0, width, height);

        await this.saveFile(canvas, filename);

        console.log(`[${this.details.publishedfileid}] Generated content.png`);
    }

    async saveFile(canvas, filename) {
        return new Promise((resolve, reject) => {
            fs.mkdirSync(this.imagePath, {recursive: true});

            const out = fs.createWriteStream(path.join(this.imagePath, filename));
            const stream = canvas.createPNGStream();
            stream.pipe(out)

            out.on("finish", resolve);
            out.on("error", reject);
        });
    }
}

class WorkshopShowcase {
    constructor(filename) {
        this.filename = filename;
    }

    writeShowcase(itemDisplays, commentTag) {
        let content = fs.readFileSync(this.filename, {encoding:"utf8", flag:"r"});
        console.log("IN:", content);

        let startTag = `<!-- ${commentTag}:START -->`;
        let endTag = `<!-- ${commentTag}:END -->`

        let middleText = "sample text";
        let startText = content.substring(0, content.indexOf(startTag) + startTag.length);
        let endText = content.substring(content.indexOf(endTag));

        let out = startText + "\n" + middleText + "\n" + endText;
        console.log("OUT:", out);
        fs.writeFileSync(this.filename, out);
    }
}

// module.exports.SteamWorkshop = SteamWorkshop;
// module.exports.ItemDisplay = ItemDisplay;
// module.exports.WorkshopShowcase = WorkshopShowcase;

(async ()=>{
    const workshop = new SteamWorkshop(core.getInput("steam_api_key", {required: true}));

    let inputItems = JSON.parse(core.getInput("workshop_items", {required: true}));
    

    let details = await workshop.getDetails(Object.keys(inputItems));
    console.log(details);

    let itemDisplays = {}

    for (let i = 0; i < details.length; i++) {
        const item = details[i];
        
        let display = new ItemDisplay(item, path.join(__dirname, core.getInput("image_path", {required: true}), item.publishedfileid));
        await display.generateImages();
    }

    let showcase = new WorkshopShowcase(path.join(__dirname, core.getInput("readme_file", {required: true})));
    showcase.writeShowcase(itemDisplays, core.getInput("comment_tag", {required: true}));

})().catch(err => {
    core.setFailed(err);
});
