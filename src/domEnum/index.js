const request = require('./../request');
const interface = require('./../interface');
const bruteforce = require('./bruteforce.js')

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

const errorHandler = (err) => {
    if (err.code === 'ESOCKETTIMEDOUT')
        return 'Timed Out Exceeded';
    else if (err.response.statusCode >= 400) {
        console.log('hgf');
        console.log(err.response);
        if (err.response.statusCode == 429)
            return 'Rate Limit exceeded' + err.response.statusMessage;
        
        return str(err.response.statusCode);
    }
}

const errorChecker = (body) => {
    try {
        const response = JSON.parse(body);

        if (!response)
            return [false, 'Bad JSON format'];
        if (response.code !== undefined) {
            if (response.code = 'rate_limited')
                return [false, 'Rate limit exceeded: ' + response.message];
        }

        return [true, response];
    }
    catch (e) {}

    return [false, 'Unexpected JSON Parsing Error'];
}

const findCrt = async (subdomains) => {
    let domains = [];
    
    subdomains = subdomains.forEach((elt) => {
        elt.name_value.split('\n').forEach( (url) => {
            domains.push({
                name: cleanUrl(url),
                issuer: elt.issuer_name,
            });
        });
    });

    return domains;
}

const findAlienVault = async (subdomains) => {
    return subdomains["passive_dns"].map((elt) => {
        return {
            name: cleanUrl(elt.hostname),
            issuer: '',
        };
    });
}

const findCertSpotter = async (subdomains) => {
    return subdomains.map((elt) => {
        return {
            name: cleanUrl(elt.dns_names[0]),
            issuer: '',
        };
    });
}

const requestApi = async (api) => {    
    const spinner = interface.waitLog('Looking for subdomains in ' + api.name);

    const response = await request
        .getRequest(api.path, 10000)
        .catch((err) => {
            return errorHandler(err);
        });

    if (typeof(response) !== 'string') {
        let [status, subdomains] = errorChecker(response.body);
        if (status) {
            const result = await api.fn.apply(null, [subdomains]);

            spinner.succeed(result.length + ' Subdomains found in ' + api.name);
            return result;
        }

        spinner.fail(api.name + ' failed: ' + subdomains);
        return [];
    }

    spinner.fail(api.name + ' failed: ' + response);
    return [];
}

const find = async (url) => {    
    let domains = {};

    const apis = {
        'crt.sh': {
            name: 'crt.sh',
            path: 'https://crt.sh/?q=%.' + url + '&output=json',
            fn: findCrt
        },
        'AlienVault': {
            name: 'AlienVault',
            path: 'https://otx.alienvault.com/api/v1/indicators/domain/' + url + '/passive_dns',
            fn: findAlienVault 
        },
        'CertSpotter': {
            name: 'CertSpotter',
            path: 'https://api.certspotter.com/v1/issuances?domain=' + url + '&include_subdomains=true&expand=dns_names&expand=issuer&expand=cert',
            fn: findCertSpotter 
        },/*
        'UrlScan': {
            name: 'UrlScan',
            path: 'https://urlscan.io/api/v1/search/?q=' + url + '&size=9000',
            fn: findDefault
        }*/
    }

    const l = Object.keys(apis).map((elt) => { return apis[elt].fn });

    let sum = 0;
    for await (const api of l) {
        const apiName = Object.keys(apis)
            .map((key) => { return { name: key, fn: apis[key].fn }; })
            .filter((elt) => { return elt.fn === api; })
            .map((elt) => { return elt.name; })[0];

        const response = await requestApi(apis[apiName]);
        sum += response.length;

        response.forEach((elt) => {
            if (domains[elt.name] === undefined)
                domains[elt.name] = elt;
        });
    };

    //bruteforce.bruteforce(url);

    return Object.values(domains);
}

const checkStatus = async (url) => {
    return await request
    .getRequest(url, 10000)
    .then((response) => {
        return [true, response.response.statusCode];
    })
    .catch((err) => {
        if (err.code !== 'ETIMEDOUT' && err.code !== 'ENOTFOUND' && err.code !== 'EHOSTUNREACH') {
            interface.writeLog('ERR: Unexpected Error: should be manually checked: [' + url + ']: ' + err.code + '\r\n', { color: 'orange' });
            return [true, err.code];
        }

        return [false, err.code];
    });
}

const check = async(domains) => {
    domains = await Promise.all(domains.map( async (elt) => {
        const [up, statusCode] = await checkStatus('http://' + elt.name);
        elt.valid = up;
        elt.status = statusCode;
        return elt;
    }));
    
    domains = domains.filter((elt) => {
        return elt.valid;
    });

    interface.writeLog(domains.length + ' responding subdomains.\r\n', { color: 'green' });

    domains.forEach((elt) => {
        interface.writeLog('[+] ' + elt.status + ': ', { color: 'blue' });
        interface.writeLog(elt.name + '\r\n');
    });

    return domains;
}

module.exports = {
    find,
    check
}