const workshop = require(".").init(process.env.STEAM_API_KEY);

(async ()=>{
    let details = await workshop.getDetails(881254777);
    console.log(details);
})();
