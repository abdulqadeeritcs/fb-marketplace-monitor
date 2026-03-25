const { chromium } = require("playwright");
const fs = require("fs");
const { sendEmail } = require("./email");

const MARKET_URL =
  "https://www.facebook.com/marketplace/melbourne/vehicles?sortBy=creation_time_descend&exact=false&radius=160";

const SCAN_INTERVAL = 30000; // 30 seconds

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailBodies(newListings) {
  let text = "New Facebook Marketplace Vehicles\n\n";

  newListings.forEach((v, i) => {
    text += `${i + 1}. ${v.title || "Untitled listing"}`;
    if (v.price) text += ` (${v.price})`;
    text += `\n${v.url}\n\n`;
  });

  const cards = newListings
    .map((v) => {
      const safeTitle = escapeHtml(v.title || "Untitled listing");
      const safePrice = v.price
        ? `<div style=\"font-weight:700;color:#146c2e;margin:6px 0 10px;\">${escapeHtml(v.price)}</div>`
        : "";
      const image = v.image
        ? `<img src=\"${escapeHtml(v.image)}\" alt=\"${safeTitle}\" style=\"width:100%;max-width:560px;height:auto;border-radius:10px;display:block;\" />`
        : "";

      return `
                <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:14px;">
                    ${image}
                    <div style="font-size:16px;font-weight:600;color:#111827;margin-top:${v.image ? "10px" : "0"};">${safeTitle}</div>
                    ${safePrice}
                    <a href="${escapeHtml(v.url)}" style="display:inline-block;background:#1877f2;color:#ffffff;text-decoration:none;padding:9px 12px;border-radius:8px;font-size:14px;">Open Listing</a>
                </div>
            `;
    })
    .join("");

  const html = `
        <div style="margin:0;padding:18px;background:#f4f6f8;font-family:Arial,sans-serif;color:#111827;">
            <div style="max-width:640px;margin:0 auto;">
                <h2 style="margin:0 0 14px;">New Facebook Marketplace Vehicles</h2>
                ${cards}
            </div>
        </div>
    `;

  return { text, html };
}

(async () => {
  const context = await chromium.launchPersistentContext("./fb-profile", {
    headless: false,
  });

  const page = await context.newPage();

  await page.goto(MARKET_URL);

  let seen = [];
  let firstRun = false;

  if (fs.existsSync("seenListings.json")) {
    seen = JSON.parse(fs.readFileSync("seenListings.json"));
    // If old format (array of objects), convert to array of IDs
    if (seen.length > 0 && typeof seen[0] === "object") {
      seen = seen.map((item) => item.id);
    }
  } else {
    firstRun = true;
  }

  while (true) {
    console.log("Scanning marketplace...");

    await page.reload({ waitUntil: "domcontentloaded" });

    await page.waitForTimeout(5000);

    const listings = await page.evaluate(() => {
      const results = [];
      const seenInScan = new Set();

      document
        .querySelectorAll('a[href*="/marketplace/item"]')
        .forEach((el) => {
          const url = el.href;
          const match = url.match(/item\/(\d+)/);

          if (match && !seenInScan.has(match[1])) {
            seenInScan.add(match[1]);
            const imageEl = el.querySelector("img");
            const textBits = (el.innerText || "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            const title = textBits[0] || "Untitled listing";
            const priceLine = textBits.find((s) => /[$€£]|\d/.test(s));

            results.push({
              id: match[1],
              title,
              price: priceLine || "",
              image: imageEl?.src || "",
              url,
            });
          }
        });

      return results.slice(0, 20);
    });

    const seenSet = new Set(seen);
    const newListings = [];
    for (const item of listings) {
      if (!seenSet.has(item.id)) {
        newListings.push(item);
      }
    }

    if (firstRun) {
      console.log("Warm-up scan complete. No alerts sent.");
      seen = listings.map((l) => l.id);
      firstRun = false;
    } else {
      if (newListings.length > 0) {
        console.log(`Found ${newListings.length} new vehicles`);

        const orderedListings = [...newListings].reverse();
        const { text, html } = buildEmailBodies(orderedListings);

        await sendEmail(
          `Marketplace Alert (${newListings.length})`,
          text,
          html,
        );
      }

      newListings.forEach((v) => {
        // Remove any previous entry for this id
        const idx = seen.indexOf(v.id);
        if (idx !== -1) seen.splice(idx, 1);
        seen.unshift(v.id);
      });
    }

    seen = seen.slice(0, 500);
    fs.writeFileSync("seenListings.json", JSON.stringify(seen, null, 2));

    console.log("Next scan in 30 seconds\n");

    await page.waitForTimeout(SCAN_INTERVAL);
  }
})();
