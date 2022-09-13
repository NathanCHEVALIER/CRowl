const request = require('./../request');

const crawl = async (url) => {
    let path = 'https://crt.sh/?q=%.' + url + '&output=json';

    const {body, response} = await request.getRequest(path);
    const subdomains = JSON.parse(body);

    console.log(subdomains);

    subdomains.map( (elt) => {
        return {
            issuer: elt.issuer_name,
            name: elt.name_value
        };
    }).forEach( (elt) => { 
        console.log(elt);
    });
}

module.exports = {
    crawl
}