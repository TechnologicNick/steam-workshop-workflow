const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const core = require('@actions/core');
const path = require('path');
const template = require('es6-template-strings');

class SteamWorkshop {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getDetails(ids) {
        if(typeof(ids) === "number") ids = [ids];
        console.log("Requesting details for", ids);

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
    constructor(details, imagePath, info, addStatsDetails) {
        this.details = details;
        this.imagePath = imagePath;
        this.info = info;
        this.addStatsDetails = addStatsDetails;
    }

    async generateImages() {
        let padding = 5; // 4.390625px measured using Chrome 86

        let widthContainer = 846;
        let width = Math.floor((widthContainer - padding) / 2); // 420
        let height = 100;

        let preview = 178;

        let widthSteamIcon = core.getInput("icon_steam", {required: true}).split(',')[1];

        await Promise.all([
            this.generatePreview("preview.png", preview, height),
            // this.generateContent("content.png", width - preview - padding, height),
            this.generateSvg("info.svg", width - preview - widthSteamIcon - 2*padding, height)
        ]);
    }

    async generateSvg(filename, width, height) {
        let raw = fs.readFileSync(path.join(__dirname, "/template.svg"), "utf-8");

        fs.mkdirSync(this.imagePath, {recursive: true});

        let sum = arr => arr.reduce((a, b) => a + b, 0);

        let allDetails = [this.details, ...this.addStatsDetails];
        let summedDetails = Object.fromEntries(Object.entries(this.details).map(([key, value]) => {
            return [key, sum(allDetails.map(d => d[key]))];
        }));

        let data = template(raw, {
            width: width,
            height: height,
            details: this.details,
            summedDetails: summedDetails,
            imagePath: this.imagePath,
            info: this.info
        });

        fs.writeFileSync(path.join(this.imagePath, filename), data);

        console.log(`[${this.details.publishedfileid}] Generated ${filename.substring(filename.lastIndexOf(path.sep))}`);
    }

    async generatePreview(filename, width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        let preview = await loadImage(this.info.image || this.details.preview_url);
        let aspectRatio = preview.width/preview.height;

        let scale = Math.min(canvas.width / preview.width, canvas.height / preview.height);
        let x = (canvas.width / 2) - (preview.width / 2) * scale;
        let y = (canvas.height / 2) - (preview.height / 2) * scale;
        context.drawImage(preview, x, y, preview.width * scale, preview.height * scale);

        await this.saveFile(canvas, filename);

        console.log(`[${this.details.publishedfileid}] Generated ${filename.substring(filename.lastIndexOf(path.sep))}`);
    }

    async generateContent(filename, width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        // context.fillStyle = "rgba(0, 0, 0, 0.2)";
        // context.fillRect(0, 0, width, height);

        const title = this.info.title !== undefined ? this.info.title : this.details.title;
        const paddingLeft = 5;

        context.fillStyle = "black";
        context.font = "bold 17.5px Segoe UI"

        let measureTitle = context.measureText(`${title}`);
        let currentY = 0;
        // console.log("measureTitle", measureTitle);

        context.fillText(`${title}`, paddingLeft, currentY += measureTitle.emHeightAscent);
        currentY += measureTitle.emHeightDescent;

        context.fillStyle = "black";
        context.font = "14px Segoe UI"

        let measureInfo = context.measureText("info");

        let sum = arr => arr.reduce((a, b) => a + b, 0);

        let allDetails = [this.details, ...this.addStatsDetails];
        let countViews     = sum(allDetails.map(d => d.views));
        let countDownloads = sum(allDetails.map(d => d.lifetime_subscriptions));
        let countFavorites = sum(allDetails.map(d => d.favorited));

        context.fillText(`  ${countViews    } views`, paddingLeft, currentY += measureInfo.emHeightAscent);
        context.fillText(`  ${countDownloads} downloads`, paddingLeft, currentY += measureInfo.emHeightAscent);
        context.fillText(`  ${countFavorites} favorites`, paddingLeft, currentY += measureInfo.emHeightAscent);



        await this.saveFile(canvas, filename);

        console.log(`[${this.details.publishedfileid}] Generated ${filename.substring(filename.lastIndexOf(path.sep))}`);
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

    generateHtml(itemDisplay) {
        const icon_steam = core.getInput("icon_steam", {required: true}).split(',');

        return `
        <a href="${itemDisplay.info.source_code}">
            <img src="${path.join(itemDisplay.imagePath, "preview.png")}">
            <img src="${path.join(itemDisplay.imagePath, "info.svg")}">
            <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=${itemDisplay.details.publishedfileid}">
                <img src="${icon_steam[0]}" width="${icon_steam[1]}px", height="${icon_steam[2]}px">
            </a>
        </a>`;

        // <img src="${path.join(itemDisplay.imagePath, "content.png")}">
    }

    writeShowcase(itemDisplays, commentTag) {
        let content = fs.readFileSync(this.filename, {encoding:"utf8", flag:"r"});
        console.log("IN:", content);

        let startTag = `<!-- ${commentTag}:START -->`;
        let endTag = `<!-- ${commentTag}:END -->`

        let middleText = "";

        middleText += `<div>`
        for (let i = 0; i < itemDisplays.length; i++) {
            middleText += this.generateHtml(itemDisplays[i]);
        }
        middleText += `\n</div>`

        let startText = content.substring(0, content.indexOf(startTag) + startTag.length);
        let endText = content.substring(content.indexOf(endTag));

        let out = startText + "\n" + middleText + "\n" + endText;
        console.log("OUT:", out);
        fs.writeFileSync(this.filename, out);
    }
}

(async ()=>{
    const workshop = new SteamWorkshop(core.getInput("steam_api_key", {required: true}));

    let inputItems = JSON.parse(core.getInput("workshop_items", {required: true}));
    let ids = inputItems.map(item => item.id);
    for (let item of inputItems) {
        if (item.add_stats) {
            ids.push(...item.add_stats);
        }
    }

    let details = await workshop.getDetails(ids);
    //console.log(ids, details);

    let itemDisplays = []

    for (let info of inputItems) {
        const itemDetails = details.find(d => info.id == d.publishedfileid);
        const addStatsDetails = info.add_stats ? details.filter(d => info.add_stats.includes(parseInt(d.publishedfileid))) : [];

        // console.log(itemDetails);

        let imagePath = path.join(".", core.getInput("image_path", {required: true}), itemDetails.publishedfileid);
        let display = new ItemDisplay(itemDetails, imagePath, info, addStatsDetails);
        itemDisplays.push(display);
        await display.generateImages();
    }

    let showcase = new WorkshopShowcase(path.join(".", core.getInput("readme_file", {required: true})));
    showcase.writeShowcase(itemDisplays, core.getInput("comment_tag", {required: true}));

})().catch(err => {
    core.setFailed(err);
    throw err;
});
