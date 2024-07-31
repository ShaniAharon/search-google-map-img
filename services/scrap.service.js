import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

const selectRandomUserAgent = () => {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)  AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
    ];
    var randomNumber = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomNumber];
};

export async function searchGoogleMaps(searchQuery) {
    // const query = encodeURIComponent(searchQuery);
    const query = searchQuery.split(" ").join("+");
    const userAgent = selectRandomUserAgent();
    try {
        const start = Date.now();

        const browser = await puppeteer.launch({
            headless: true,
            // executablePath:
            //     process.env.PUPPETEER_EXECUTABLE_PATH ||
            //     "/usr/bin/chromium-browser", // Path to the installed Chromium
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        const url = `https://www.google.com/maps/search/${query}`;
        console.log("url", url);
        try {
            // await page.goto(url);
            await page.setUserAgent(userAgent);
            await page.goto(url, { waitUntil: "networkidle2" });
        } catch (error) {
            console.log("Error going to page:", error);
        }

        async function autoScroll(page) {
            await page.evaluate(async () => {
                const wrapper = document.querySelector('div[role="feed"]');
                if (!wrapper) return;
                await new Promise((resolve, reject) => {
                    var totalHeight = 0;
                    var distance = 1000;
                    var scrollDelay = 3000;

                    var timer = setInterval(async () => {
                        var scrollHeightBefore = wrapper.scrollHeight;
                        wrapper.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeightBefore) {
                            totalHeight = 0;
                            await new Promise((resolve) =>
                                setTimeout(resolve, scrollDelay),
                            );

                            var scrollHeightAfter = wrapper.scrollHeight;

                            if (scrollHeightAfter > scrollHeightBefore) {
                                return;
                            } else {
                                clearInterval(timer);
                                resolve();
                            }
                        }
                    }, 200);
                });
            });
        }

        await autoScroll(page);

        const html = await page.content();
        await browser.close();
        console.log("Browser closed");

        const $ = cheerio.load(html);
        const aTags = $("a");
        // console.log('aTags', aTags)
        const parents = [];
        aTags.each((i, el) => {
            const href = $(el).attr("href");
            if (href && href.includes("/maps/place/")) {
                parents.push($(el).parent());
            }
        });

        console.log("parents", parents.length);
        const main = $('div[role="main"]');
        const image1 = main.find("button img").attr("src");
        const image2 = main.find("img").attr("src");
        console.log("image1", image1);
        console.log("image2", image2);

        const businesses = [];

        parents.forEach((parent) => {
            const url = parent.find("a").attr("href");
            const website = parent.find('a[data-value="Website"]').attr("href");
            const storeName = parent.find("div.fontHeadlineSmall").text();
            const ratingText = parent
                .find("span.fontBodyMedium > span")
                .attr("aria-label");

            const bodyDiv = parent.find("div.fontBodyMedium").first();
            const children = bodyDiv.children();
            const lastChild = children.last();
            const firstOfLast = lastChild.children().first();
            const lastOfLast = lastChild.children().last();

            const imageSrc = parent
                .find('button[aria-label*="Photo of"] img')
                .attr("src");
            const wheelchairAccessible = !!parent.find(
                'span[aria-label*="Wheelchair"]',
            );

            businesses.push({
                placeId: `ChI${url?.split("?")?.[0]?.split("ChI")?.[1]}`,
                address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
                category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
                phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
                googleUrl: url,
                bizWebsite: website,
                storeName,
                ratingText,
                stars: ratingText?.split("stars")?.[0]?.trim()
                    ? Number(ratingText?.split("stars")?.[0]?.trim())
                    : null,
                numberOfReviews: ratingText
                    ?.split("stars")?.[1]
                    ?.replace("Reviews", "")
                    ?.trim()
                    ? Number(
                        ratingText
                            ?.split("stars")?.[1]
                            ?.replace("Reviews", "")
                            ?.trim(),
                    )
                    : null,
                imageSrc,
                wheelchairAccessible,
            });
        });

        const end = Date.now();
        console.log(`Time in seconds: ${Math.floor((end - start) / 1000)}`);
        return { businesses, image1, image2 };
    } catch (error) {
        console.log("Error at googleMaps:", error.message);
    }
}
