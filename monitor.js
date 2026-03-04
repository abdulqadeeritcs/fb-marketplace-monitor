const { chromium } = require("playwright");
const fs = require("fs");
const { sendEmail } = require("./email");

const MARKET_URL =
"https://www.facebook.com/marketplace/melbourne/vehicles?radius=160";

(async () => {

    const context = await chromium.launchPersistentContext("./fb-profile", {
        headless: false
    });

    const page = await context.newPage();

    await page.goto(MARKET_URL);

    let seen = [];

    if(fs.existsSync("seenListings.json")){
        seen = JSON.parse(fs.readFileSync("seenListings.json"));
    }

    while(true){

        console.log("Scanning marketplace...");

        await page.reload({ waitUntil: "domcontentloaded" });

        await page.waitForTimeout(4000);

        const listings = await page.evaluate(() => {

            const results = [];

            document.querySelectorAll('a[href*="/marketplace/item"]').forEach(el => {

                const url = el.href;
                const match = url.match(/item\/(\d+)/);

                if(match){

                    results.push({
                        id: match[1],
                        title: el.innerText,
                        url: url
                    });

                }

            });

            return results.slice(0,30);

        });

        const newListings = [];

        for(const item of listings){

            if(!seen.includes(item.id)){

                newListings.push(item);
                seen.push(item.id);

            }

        }

        if(newListings.length > 0){

            console.log(`Found ${newListings.length} new listings`);

            let message = "🚗 New Facebook Marketplace Vehicles\n\n";

            newListings.forEach((v,i)=>{

            message += `${i+1}. ${v.title}\n`;
            message += `${v.url}\n\n`;

        });

        await sendEmail(
            `Marketplace Alert (${newListings.length})`,
            message
        );

    }

    fs.writeFileSync(
        "seenListings.json",
        JSON.stringify(seen,null,2)
    );

    console.log("Next scan in 80 seconds\n");

    await page.waitForTimeout(80000);

}

})();