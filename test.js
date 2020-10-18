const { SteamWorkshop, ItemDisplay } = require(".");

(async ()=>{
    const workshop = new SteamWorkshop(process.env.STEAM_API_KEY);

    let details = await workshop.getDetails(881254777);
    console.log(details);

    for (let i = 0; i < details.length; i++) {
        const item = details[i];
        
        let display = new ItemDisplay(item, `./test/workshop/${item.publishedfileid}/`);
        display.generateImages();
    }
})();
