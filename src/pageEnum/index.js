const request = require('./../request');
const interface = require('./../interface');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

urls = new Set();
ignoredExtension = ["js", "jpg", "png", "gif", "bmp", "svg", "css", "docx", "pdf"];

const cleanUrl = (url) => {
    if (url === undefined || url === null)
        return;

    return url
        .replace('https://', '')
        .replace('http://', '')
        .replace('www.', '')
        .replace('*.', '');
}

const checkExtension = (url) => {
    if (url === undefined || url === null)
        return false;

    let splittedURL = url.split(".");
    let extension = splittedURL[splittedURL.length - 1];

    return ignoredExtension.includes(extension);
}

const fromSiteMap = (domain) => {
    return new Promise(async (resolve, reject) => {
        let tmpUrls = new Set();
        const response = await request
            .getRequest("https://" + domain + "/sitemap.xml")
            .catch((err) => {
                resolve(tmpUrls);
                return;
            });

        if (response === undefined) {
            resolve(tmpUrls);
            return;
        }

        let { body, _ } = response;

        // console.log(body);
        const $ = cheerio.load(body);
        let urlList = $('loc');

        urlList.each((i, elt) => {
            let u = $(elt).text();
            if (u !== 'None') {
                tmpUrls.add(cleanUrl(u));
            }
        });
        resolve(tmpUrls);
    })
};

const getUrls = async (browser, url, urls, domain) => {
    const page = await browser.newPage();

    await page.goto('https://' + url, {
        waitUntil: 'networkidle2',
    });
    const data = await page.evaluate(
        () => document.querySelector('*').outerHTML
    );

    body = data;

    let u;
    let regexUrl = new RegExp('https?:\/\/[-\._a-zA-Z0-9]*' + domain + '[-\.\/_a-zA-Z0-9=+?]*', 'gm');

    while ((u = regexUrl.exec(body)) !== null) {
        nextUrl = cleanUrl(u[0]);
        if (checkExtension(nextUrl) || urls.includes(nextUrl)) {
            continue;
        }
        urls.push(nextUrl);
    }

    await page.close();

};

const Crawl = (domain, url) => { return new Promise(async (resolve, reject) => {
    let tmpUrls = [url];
    let body = '';

    try {
        console.log(url);
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ignoreDefaultArgs: ['--disable-extensions'],
            headless: false
        });

        let i = 0;

        while (i < tmpUrls.length) {
            await getUrls(browser, tmpUrls[i], tmpUrls, domain);
            i++;
        }

        await browser.close();
    } catch (err) {
        console.error(err);
    }
    
    resolve(tmpUrls);
})
};

const getPages = (domains) => {
    return new Promise(async (resolve, reject) => {
        promises = []
        for (const domain of domains) {
            const spinner = interface.waitLog('Looking for pages in ' + domain);
            promises.push(fromSiteMap(domain)
                .then((res) => {
                    if (res.size === 0) {
                        spinner.warn(domain + ': no pages found');
                    } else {
                        spinner.succeed(domain + ' is finished: ' + res.size);
                        urls = new Set([...urls, ...res]);
                    }
                })
            );
        }

        for (const promise of promises) {
            await promise;
        }
        resolve(urls)
    })
};

// getPages(["lcl.fr", "epita.fr", "labanquepostale.fr", "auchan.fr"])
//     .then((res) => console.log(res));

Crawl("epita.fr", "lrde.epita.fr/wiki/MOBIDEM").then((val) => console.log(val));

module.exports = {
    getPages
}