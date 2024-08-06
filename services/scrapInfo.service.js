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
        await page.waitForSelector('#search a[href^="http"]', { timeout: 120000 });

        const firstResultLink = await page.evaluate(() => {
            // const firstResult = document.querySelector('#res a[href^="http"]'); // second link
            // let firstResult = document.querySelector('#res .g a[href^="http"]');
            let firstResult = document.querySelector('#search a[href^="http"]');
            if (!firstResult?.href) {
                const allLinks = Array.from(document.querySelectorAll('#search a[href^="http"]'));
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
            // const imgUrls = Array.from(document.querySelectorAll('img')).map(img => img.src);
            // return { textCollected, imgUrls };
            return { textCollected };
        });

        await browser.close();
        console.log("Browser closed");

        const websites = [{
            websiteLink: firstResultLink,
            textCollected: result.textCollected,
            // imgUrls: result.imgUrls,
        }];
        console.log('websites', websites)

        const end = Date.now();
        console.log(`Time in seconds: ${Math.floor((end - start) / 1000)}`);
        return websites;
    } catch (error) {
        console.log("Error at searchGoogle:", error.message);
    }
}

// function filterUrls(urls) {
//     const problematicPatterns = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
//     return urls.filter(url => !problematicPatterns.test(url));
// }
function filterUrls(urls) {
    const problematicPatterns = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
    const uniqueUrls = Array.from(new Set(urls));
    return uniqueUrls.filter(url => !problematicPatterns.test(url));
}


//retrive first 4 res from google search 
export async function retriveResFromGoogle(searchQuery, num) {
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
        await page.waitForSelector('#search a[href^="http"]', { timeout: 160000 });

        let urls = await page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('#search a[href^="http"]'));
            const hrefs = allLinks.map(el => el.href)
            return hrefs ? hrefs : null;
        });
        console.log('urls', urls)

        if (!urls) {
            console.log("No results found.");
            await browser.close();
            return [];
        }
        urls = filterUrls(urls);

        await browser.close();
        console.log("Browser closed");
        const end = Date.now();
        console.log(`Time in seconds: ${Math.floor((end - start) / 1000)}`);
        return urls.slice(0, num)
    } catch (error) {
        console.log("Error at retriveResFromGoogle:", error.message);
    }
}

//TODO: change to all the urls at once
export async function extractGoogleWebsiteInfo(url) {
    // const query = searchQuery.split(" ").join("+");
    // const query = encodeURIComponent(searchQuery);;
    const userAgent = selectRandomUserAgent();
    try {
        const start = Date.now();

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        });

        const page = await browser.newPage();
        await page.setUserAgent(userAgent);
        // const url = `https://www.google.com/search?q=${query}`;
        // //TODO: can add logic to search in law article with google scholar 
        // // https://scholar.google.co.th/scholar?hl=en&as_sdt=0%2C5&q=accessibility+in+tourism&oq=
        // console.log("url", url);

        // await page.goto(url, { waitUntil: "domcontentloaded" });
        // await page.waitForSelector('#search a[href^="http"]', { timeout: 120000 });

        // const firstResultLink = await page.evaluate(() => {
        //     // const firstResult = document.querySelector('#res a[href^="http"]'); // second link
        //     // let firstResult = document.querySelector('#res .g a[href^="http"]');
        //     let firstResult = document.querySelector('#search a[href^="http"]');
        //     if (!firstResult?.href) {
        //         const allLinks = Array.from(document.querySelectorAll('#search a[href^="http"]'));
        //         const hrefs = allLinks.map(el => el.href)
        //         console.log('hrefs', hrefs)
        //         firstResult = allLinks[0]
        //     }
        //     return firstResult ? firstResult.href : null;
        // });
        // console.log('firstResultLink', firstResultLink)

        // if (!firstResultLink) {
        //     console.log("No results found.");
        //     await browser.close();
        //     return [];
        // }

        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector('div', { timeout: 120000 });

        const result = await page.evaluate(() => {
            const textCollected = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')).map(el => el.innerText);
            // const imgUrls = Array.from(document.querySelectorAll('img')).map(img => img.src);
            // return { textCollected, imgUrls };
            return { textCollected };
        });

        await browser.close();
        console.log("Browser closed");

        const websites = [{
            websiteLink: url,
            textCollected: result.textCollected,
            // imgUrls: result.imgUrls,
        }];
        console.log('websites', websites)

        const end = Date.now();
        console.log(`Time in seconds: ${Math.floor((end - start) / 1000)}`);
        return websites;
    } catch (error) {
        console.log("Error at searchGoogle:", error.message);
    }
}

//TODO: change to all the urls at once
export async function extractGoogleWebsitesInfo(urls) {
    // const query = searchQuery.split(" ").join("+");
    // const query = encodeURIComponent(searchQuery);;s
    const userAgent = selectRandomUserAgent();
    const results = [];
    try {
        const start = Date.now();

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        });

        for (const url of urls) {
            try {
                const page = await browser.newPage();
                await page.setUserAgent(userAgent);
                await page.goto(url, { waitUntil: "domcontentloaded" });

                await page.waitForSelector('div', { timeout: 120000 });

                const result = await page.evaluate(() => {
                    const textCollected = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6')).map(el => el.innerText);
                    return { textCollected };
                });
                console.log('result', result)

                results.push({
                    websiteLink: url,
                    textCollected: result.textCollected,
                });

                await page.close();
            } catch (error) {
                console.error(`Error extracting website info from ${url}:`, error.message);
                results.push({
                    websiteLink: url,
                    textCollected: [],
                });
            }
        }

        await browser.close();
        return results;
    } catch (error) {
        console.error("Error extracting website info:", error);
        return [];
    }
}


