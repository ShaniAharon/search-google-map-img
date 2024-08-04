import * as cheerio from "cheerio";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

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

export async function searchGoogle(searchQuery) {
    // const query = searchQuery.split(" ").join("+");
    const query = encodeURIComponent(searchQuery);;
    const userAgent = selectRandomUserAgent();
    try {
        const start = Date.now();

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        });

        const page = await browser.newPage();
        await page.setUserAgent(userAgent);
        const url = `https://www.google.com/search?q=${query}`;
        //TODO: can add logic to search in law article with google scholar 
        // https://scholar.google.co.th/scholar?hl=en&as_sdt=0%2C5&q=accessibility+in+tourism&oq=
        console.log("url", url);

        await page.goto(url, { waitUntil: "domcontentloaded" });

        const firstResultLink = await page.evaluate(() => {
            // const firstResult = document.querySelector('#res a[href^="http"]'); // second link
            let firstResult = document.querySelector('#res .g a[href^="http"]');
            if (!firstResult) {
                const allLinks = Array.from(document.querySelectorAll('#res .g a[href^="http"]'));
                const hrefs = allLinks.map(el => el.href)
                console.log('hrefs', hrefs)
                firstResult = allLinks[0]
            }
            return firstResult ? firstResult.href : null;
        });
        console.log('firstResultLink', firstResultLink)

        if (!firstResultLink) {
            console.log("No results found.");
            await browser.close();
            return [];
        }

        await page.goto(firstResultLink, { waitUntil: "domcontentloaded" });

        const result = await page.evaluate(() => {
            const textCollected = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')).map(el => el.innerText);
            const imgUrls = Array.from(document.querySelectorAll('img')).map(img => img.src);
            return { textCollected, imgUrls };
        });

        await browser.close();
        console.log("Browser closed");

        const websites = [{
            websiteLink: firstResultLink,
            textCollected: result.textCollected,
            imgUrls: result.imgUrls,
        }];
        console.log('websites', websites)

        const end = Date.now();
        console.log(`Time in seconds: ${Math.floor((end - start) / 1000)}`);
        return websites;
    } catch (error) {
        console.log("Error at searchGoogle:", error.message);
    }
}


