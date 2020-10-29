const fs = require('fs');
const path = require('path');

const template = `# Example README
My Steam Workshop items:
<!-- WORKSHOP-SHOWCASE:START -->
<!-- WORKSHOP-SHOWCASE:END -->

# Another header
And even more text!
`;

(async ()=>{
    process.env.INPUT_STEAM_API_KEY = process.env.STEAM_API_KEY;
    process.env.INPUT_COMMENT_TAG = "WORKSHOP-SHOWCASE";
    process.env.INPUT_README_FILE = "/test/README.md";
    process.env.INPUT_IMAGE_PATH = "/test/media/steam-workshop-workflow/";
    process.env.INPUT_GITHUB_RAW_PATH = __dirname + path.sep;
    process.env.INPUT_WORKSHOP_ITEMS = `[
        {
            "id": 881254777,
            "github": "https://github.com/brentbatch/The-Modpack"
        },
        {
            "id": 1396115995,
            "github": "https://github.com/TechnologicNick/WASD-Converter"
        },
        {
            "id": 1394654240,
            "github": "https://github.com/TechnologicNick/Electromagnets"
        },
        {
            "id": 1428574074,
            "github": "https://github.com/TechnologicNick/CameraControls"
        },
        {
            "id": 893341654,
            "github": "https://github.com/TechnologicNick/Paintable-Lasers"
        },
        {
            "id": 1616051926,
            "github": "https://github.com/TechnologicNick/Scrap-Guard",
            "title": "Scrap Guard"
        }
    ]`;

    fs.mkdirSync(path.join(__dirname, "/test/"), {recursive: true});
    fs.writeFileSync(path.join(__dirname, process.env.INPUT_README_FILE), template);
    require(".");
})();