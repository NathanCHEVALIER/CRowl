const request = require('./../request');

const findCrt = async (url) => {
    let domains = {};
    let apis = 'https://crt.sh/?q=%.' + url + '&output=json';

    const {body, response} = await request.getRequest(apis);
    let subdomains = JSON.parse(body);

    subdomains.forEach( (elt) => {
        elt.name_value.split('\n').forEach( (s) => {
            domains[s] = {
                issuer: elt.issuer_name
            };
        })

        //console.log(elt);
    });

    return domains;
}

const findWebArchive = async (url) => {
    let domains = {};
    let apis = 'https://web.archive.org/cdx/search/cdx?url=*.' + url + '&output=json&fl=original&collapse=urlkey&page=';

    const {body, response} = await request.getRequest(apis);
    let subdomains = JSON.parse(body);

    subdomains = subdomains.map((elt) => {
        return elt[0];
    }).filter((elt) => {
        return (typeof(elt) === 'string' && elt !== 'original');
    }).map((elt) => {
        console.log(elt);
        let a = elt.replace('https://', '').replace('http://', '').replace('www.', '').split('/');
        return a[0];
    });

    subdomains.forEach( (elt) => { 
        domains[elt] = {
        };
    });

    return domains;
}

const find = async (url) => {
    let domains = {};
    const crt = await findCrt(url);
    console.log(crt);

    let count = 0;
    Object.keys(crt).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = crt[key]; count++;
        }
    });

    console.log("============== [ CRT.sh ]: " + count);

    const webArchive = await findWebArchive(url).catch((error) => {
        console.log(error);
    });

    count = 0;
    Object.keys(webArchive).forEach((key) => {
        if (domains[key] === undefined) {
            domains[key] = webArchive[key]; count++;
        }
    });

    console.log("============== [ WebArchive ]: " + count);

    return Object.keys(domains);
}

module.exports = {
    find
}