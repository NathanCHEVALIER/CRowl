const request = require('./../request');
const interface = require('./../interface');

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

const errorRateLimited = () => { interface.writeLog('You have been rate limited', { color: 'red' }); return false; };

const errorHandler = (err) => {
    if (err.code === 'ESOCKETTIMEDOUT')
        interface.writeLog('Timed OUT', { color: 'red' });
    else
        console.log(err);
    // TODO: logger
    return false;
}

const errorChecker = (body) => {
    try {
        const response = JSON.parse(body);
        
        if (response.code !== undefined) {
            if (response.code = 'rate_limited')
                return errorRateLimited();
        }

        return response;
    }
    catch (e) {}

    interface.writeLog('Error: Bad JSON Response format', { color: 'red' });
    return false;
}

const findCrt = async (url) => {
    let domains = {};
    
    const response = await request
        .getRequest('https://crt.sh/?q=%.' + url + '&output=json', 50000)
        .catch((err) => { return errorHandler(err) });

    if (response && response.response.statusCode >= 400)
        console.log(response.response.statusCode);

    if (response && response.response.statusCode == 200) {
        let subdomains = JSON.parse(response.body).forEach((elt) => {
            elt.name_value.split('\n').forEach( (url) => {
                domains[cleanUrl(url)] = {
                    issuer: elt.issuer_name
                }
            });
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

    let subdomains = errorChecker(body)

    if (!subdomains)
        return domains;

    subdomains = subdomains.map((elt) => {
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

    const apis2 = {
        'crt.sh': findCrt,
        'AlienVault': findAlienVault,
        'CertSpotter': findCertSpotter
    }

    const apis = [
        findCrt,
        findAlienVault,
        findCertSpotter
    ];

    for await (const api of apis) {
        let count = 0;
        const response = await api.apply(null, [url]);

        Object.keys(response).forEach((key) => {
            if (domains[key] === undefined) {
                //interface.writeLog(url, { color: 'blue' });
                domains[key] = response[key]; 
            }
            count++;
        });

        interface.writeLog('============== [  ]: ' + count, { color: 'green' });
    };

    console.log('end');

    return Object.keys(domains);
}

module.exports = {
    find
}