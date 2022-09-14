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
                return [false, 'Rate limit exceeded'];
        }

        return [true, response];
    }
    catch (e) {
        console.log(e);
    }

    return [false, 'Unexpected Error'];
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
        .getRequest(api.path, 30000)
        .catch((err) => {
            return errorHandler(err);
        });

    //console.log(response);

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

    //console.log(response);
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
        }
    }

    const l = Object.keys(apis).map((elt) => { return apis[elt].fn });

    for await (const api of l) {
        const apiName = Object.keys(apis)
            .map((key) => { return { name: key, fn: apis[key].fn }; })
            .filter((elt) => { return elt.fn === api; })
            .map((elt) => { return elt.name; })[0];

        const response = await requestApi(apis[apiName]);

        response.forEach((elt) => {
            if (domains[elt.name] === undefined)
                domains[elt.name] = elt;
        });
    };

    return Object.keys(domains);
}

module.exports = {
    find
}