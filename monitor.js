const { chromium } = require("playwright");
const fs = require("fs");
const { sendEmail } = require("./email");

const MARKET_URL =
"https://www.facebook.com/marketplace/melbourne/vehicles?sortBy=creation_time_descend&exact=false&radius=160";

const SCAN_INTERVAL = 120000; // 120 seconds (slower & safer)

(async () => {

const context = await chromium.launchPersistentContext("./fb-profile", {
    headless: false
});

const page = await context.newPage();

await page.goto(MARKET_URL);

let seen = [];
let firstRun = false;

if(fs.existsSync("seenListings.json")){
    seen = JSON.parse(fs.readFileSync("seenListings.json"));
} else {
    firstRun = true;
}

while(true){

    console.log("Scanning marketplace...");

    await page.reload({ waitUntil: "domcontentloaded" });

    await page.waitForTimeout(5000);

    const listings = await page.evaluate(() => {

        const results = [];

        document.querySelectorAll('a[href*="/marketplace/item"]').forEach(el => {

            const url = el.href;
            const match = url.match(/item\/(\d+)/);

            if(match){

                results.push({
                    id: match[1],
                    title: el.innerText.trim(),
                    url: url
            });

        }

    });

    return results.slice(0, 20);

    });

    const newListings = [];

    for (const item of listings) {

        if (seen.includes(item.id)) {
            console.log("Reached known listing. Stopping scan.");
            break;
        }

        newListings.push(item);

    }

    if(firstRun){

        console.log("Warm-up scan complete. No alerts sent.");
        seen = listings.map(l => l.id);
        firstRun = false;

    } else {

        if(newListings.length > 0){

            console.log(`Found ${newListings.length} new vehicles`);

            let message = "🚗 New Facebook Marketplace Vehicles\n\n";

            newListings.reverse().forEach((v,i)=>{

                message += `${i+1}. ${v.title}\n`;
                message += `${v.url}\n\n`;

            });

            await sendEmail(
                `Marketplace Alert (${newListings.length})`,
                message
            );

        }

        newListings.forEach(v=>{
            seen.unshift(v.id);
        });

    }

    seen = seen.slice(0, 500);

    fs.writeFileSync(
        "seenListings.json",
        JSON.stringify(seen,null,2)
    );

    console.log("Next scan in 120 seconds\n");

    await page.waitForTimeout(SCAN_INTERVAL);

}

})();