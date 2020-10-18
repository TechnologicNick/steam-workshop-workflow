const fetch = require('node-fetch');

class SteamWorkshop {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    item(id) {
        return new WorkshopItem(this, id);
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

exports.init = function(apiKey) {
    return new SteamWorkshop(apiKey);
}
