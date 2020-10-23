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
    process.env.INPUT_WORKSHOP_ITEMS = `{
        "1396115995": {
            "github": "https://github.com/TechnologicNick/WASD-Converter"
        }
    }`;

    fs.mkdirSync(path.join(__dirname, "/test/"), {recursive: true});
    fs.writeFileSync(path.join(__dirname, process.env.INPUT_README_FILE), template);
    require(".");
})();