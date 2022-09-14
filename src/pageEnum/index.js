const request = require('./../request');
const interface = require('./../interface');
const cheerio = require('cheerio');

urls = [];

const fromSiteMap = (domain) => { return new Promise(async (resolve, reject) => {
    const {body, response} = await request
        .getRequest("https://" + domain + "/sitemap.xml", 50000)
        .catch((err) => {});

    // console.log(body);
    const $ = cheerio.load(body);
    let urlList = $('loc');

    urlList.each((i, elt) => {
        urls.push($(elt).text())
    });
    resolve(domain)
})};

const getPages = (domains) => { return new Promise(async (resolve, reject) => {
    promises = []
    for (const domain of domains) {
        const spinner = interface.waitLog('Looking for pages in ' + domain);
        promises.push(fromSiteMap(domain)
            .then((res) => {
                spinner.succeed(res + ' is finished');
            })
        );
    }

    for (const promise of promises) {
        await promise;
    }
    resolve(urls)
})};

getPages(["lcl.fr", "epita.fr", "labanquepostale.fr", "auchan.fr"])
    .then((res) => console.log(res));

module.exports = {
    getPages
}