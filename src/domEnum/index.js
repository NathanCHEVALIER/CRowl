const request = require('./../request');

const cleanUrl = (url) => {
    if (url === undefined)
        return;

    return url
        .replace('https://', '')
        .replace('http://', '')
        .replace('www.', '')
        .replace('*.', '')
        .split('/')[0];
}

const findCrt = async (url) => {
    let domains = {};
    let apis = 'https://crt.sh/?q=%.' + url + '&output=json';

    const {body, response} = await request.getRequest(apis).catch();
    let subdomains = JSON.parse(body);

    subdomains.forEach( (elt) => {
        elt.name_value.split('\n').forEach( (s) => {
            s = cleanUrl(s);
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
        return cleanUrl(elt);
    });

    subdomains.forEach( (elt) => { 
        domains[elt] = {
        };
    });

    return domains;
}

const findAlienVault = async (url) => {
    let domains = {};
    let apis = 'https://otx.alienvault.com/api/v1/indicators/domain/' + url + '/passive_dns';

    const {body, response} = await request.getRequest(apis);
    let subdomains = JSON.parse(body);

    subdomains = subdomains["passive_dns"].map((elt) => {
        //console.log(elt.hostname);
        return cleanUrl(elt.hostname);
    });

    subdomains.forEach( (elt) => {
        console.log(elt);
        domains[elt] = {
        };
    });

    return domains;
}

const findCertSpotter = async (url) => {
    let domains = {};
    let apis = 'https://api.certspotter.com/v1/issuances?domain=' + url + '&include_subdomains=true&expand=dns_names&expand=issuer&expand=cert';

    const {body, response} = await request.getRequest(apis);
    let subdomains = JSON.parse(body);

    subdomains = subdomains.map((elt) => {
        //console.log(elt.hostname);
        return cleanUrl(elt.dns_names[0]);
    });

    subdomains.forEach( (elt) => {
        console.log(elt);
        domains[elt] = {
        };
    });

    return domains;
}

const find = async (url) => {
    let domains = {};
   /* const crt = await findCrt(url);
    console.log(crt);

    let count = 0;
    Object.keys(crt).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = crt[key]; count++;
        }
    });

    console.log("============== [ CRT.sh ]: " + count);

    /*const webArchive = await findWebArchive(url).catch((error) => {
        console.log(error);
    });

    count = 0;
    Object.keys(webArchive).forEach((key) => {
        if (domains[key] === undefined) {
            domains[key] = webArchive[key]; count++;
        }
    });

    console.log("============== [ WebArchive ]: " + count);
*/
    const alienVault = await findAlienVault(url).catch((error) => {
        console.log(error);
    });

    count = 0;
    Object.keys(alienVault).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = alienVault[key]; count++;
        }
    });

    console.log("============== [ AlienVault ]: " + count);

    const certspotter = await findCertSpotter(url).catch((error) => {
        console.log(error);
    });

    count = 0;
    Object.keys(certspotter).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = certspotter[key]; 
            count++;
        }
    });

    console.log("============== [ CertSpotter ]: " + count);


    return Object.keys(domains);
}

module.exports = {
    find
}