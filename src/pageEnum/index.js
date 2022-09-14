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

const getPages = async (domains) => {
    promises = []
    for (const domain of domains) {
        promises.push(fromSiteMap(domain)
            .then((res) => {
                console.log(res)
            })
        );
    }

    for (const promise of promises) {
        await promise;
    }

    // console.log(urls);
};

getPages(["lcl.fr"]);

module.exports = {
    fromSiteMap
}