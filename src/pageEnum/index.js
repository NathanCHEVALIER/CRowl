const request = require('./../request');
const interface = require('./../interface');
const cheerio = require('cheerio');

urls = [];

const cleanUrl = (url) => {
    if (url === undefined || url === null)
        return;

    return url
        .replace('https://', '')
        .replace('http://', '')
        .replace('www.', '')
        .replace('*.', '');
}

const fromSiteMap = (domain) => { return new Promise(async (resolve, reject) => {
    let tmpUrls = [];
    const response = await request
        .getRequest("https://" + domain + "/sitemap.xml", 50000)
        .catch((err) => {
            resolve(tmpUrls);
            return;
        });

    if (response === undefined) {
        resolve(tmpUrls);
        return;
    }

    let {body, _} = response;

    // console.log(body);
    const $ = cheerio.load(body);
    let urlList = $('loc');

    urlList.each((i, elt) => {
        let u = $(elt).text();
        if (u !== 'None') {
            tmpUrls.push(cleanUrl(u));
        }
        // if (cleanUrl(u) === "de-memoire-vive-philippe-dewost.epita.fr/post-sitemap.xml") {
        //     console.log(domain);
        // }
    });
    // console.log(tmpUrls);
    resolve(tmpUrls);
})};

const getPages = (domains) => { return new Promise(async (resolve, reject) => {
    promises = []
    for (const domain of domains) {
        const spinner = interface.waitLog('Looking for pages in ' + domain);
        promises.push(fromSiteMap(domain)
            .then((res) => {
                spinner.succeed(domain + ' is finished: ' + res.length);
                urls = urls.concat(res)
            })
        );
    }

    for (const promise of promises) {
        await promise;
    }
    console.log(urls);
    resolve(urls)
})};

// getPages(["lcl.fr", "epita.fr", "labanquepostale.fr", "auchan.fr"])
//     .then((res) => console.log(res));

module.exports = {
    getPages
}