const { SteamWorkshop, ItemDisplay, WorkshopShowcase } = require(".");
const fs = require('fs');

const template = `# Example README
My Steam Workshop items:
<!-- WORKSHOP-SHOWCASE:START -->
<!-- WORKSHOP-SHOWCASE:END -->

# Another header
And even more text!
`;

(async ()=>{
    const workshop = new SteamWorkshop(process.env.STEAM_API_KEY);

    let details = await workshop.getDetails(881254777);
    console.log(details);

    let itemDisplays = {}

    for (let i = 0; i < details.length; i++) {
        const item = details[i];
        
        let display = new ItemDisplay(item, `./test/workshop/${item.publishedfileid}/`);
        display.generateImages();
    }

    fs.writeFileSync("./test/README.md", template);
    let showcase = new WorkshopShowcase("./test/README.md");
    showcase.writeShowcase(itemDisplays);

})();
