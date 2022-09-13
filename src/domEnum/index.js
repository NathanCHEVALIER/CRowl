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
    
    const response = await request
        .getRequest('https://crt.sh/?q=%.' + url + '&output=json')
        .catch((err) => {
            //console.log(err);
            // TODO: logger
            return false;
        });

    if (response && response.response.status_code == 200) {
        let subdomains = JSON.parse(response.body)["passive_dns"].map((elt) => {
            return cleanUrl(elt.hostname);
        });
    
        subdomains.forEach( (elt) => {
            domains[elt] = {
                issuer: ''
            };
        });
    }

    return domains;
}

const findAlienVault = async (url) => {
    let domains = {};
    
    const {body, response} = await request
        .getRequest('https://otx.alienvault.com/api/v1/indicators/domain/' + url + '/passive_dns')
        .catch((err) => {});

    let subdomains = JSON.parse(body)["passive_dns"].map((elt) => {
        return cleanUrl(elt.hostname);
    });

    subdomains.forEach( (elt) => {
        domains[elt] = {
            issuer: ''
        };
    });

    return domains;
}

const findCertSpotter = async (url) => {
    let domains = {};

    const {body, response} = await request
        .getRequest('https://api.certspotter.com/v1/issuances?domain=' + url + '&include_subdomains=true&expand=dns_names&expand=issuer&expand=cert')
        .catch((err) => {});

    let subdomains = JSON.parse(body).map((elt) => {
        return cleanUrl(elt.dns_names[0]);
    });

    subdomains.forEach( (elt) => {
        domains[elt] = {
            issuer: ''
        };
    });

    return domains;
}

const find = async (url) => {
    let domains = {};
    let count = 0;
    
    /*
    const crt = await findCrt(url);

    Object.keys(crt).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = crt[key]; count++;
        }
    });

    console.log("============== [ CRT.sh ]: " + count);
    */

    const alienVault = await findAlienVault(url);

    count = 0;
    Object.keys(alienVault).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = alienVault[key]; count++;
        }
    });

    console.log("============== [ AlienVault ]: " + count);

    const certspotter = await findCertSpotter(url);

    count = 0;
    Object.keys(certspotter).forEach((key) => {
        if (domains[key] === undefined) {
            console.log(key);
            domains[key] = certspotter[key]; count++;
        }
    });

    console.log("============== [ CertSpotter ]: " + count);

    return Object.keys(domains);
}

module.exports = {
    find
}