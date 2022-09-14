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
const errorResponseCode = (n) => { interface.writeLog('Error: Unexpected HTTP Response Code: ' + n, { color: 'red' }); return false; };

const errorHandler = (err) => {
    if (err.code === 'ESOCKETTIMEDOUT')
        interface.writeLog('Timed OUT\r\n', { color: 'red' });
    else
        interface.writeLog(err, { color: 'red' });
    return false;
}

const errorChecker = (body) => {
    //console.log(body);
    try {
        const response = JSON.parse(body);
        
        if (response.code !== undefined) {
            if (response.code = 'rate_limited')
                return errorRateLimited();
        }

        return response;
    }
    catch (e) {
        //console.log(e);
    }

    interface.writeLog('Error: Bad JSON Response format', { color: 'red' });
    return false;
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
    const response = await request
        .getRequest(api.path)
        .catch((err) => { 
            const e = errorHandler(err);
            console.log(e);
            return e;
        });

    if (api.name === 'crt.sh')
        console.log(response);
        
    if (response === false)
        console.log('timeout');

    if (response && response.response.statusCode >= 400)
        errorResponseCode(response.response.statusCode);

    if (response && response.response.statusCode == 200) {
        let subdomains = errorChecker(response.body)
        if (subdomains)
            return await api.fn.apply(null, [subdomains]);
    }

    return [];
}

const find = async (url) => {    
    let domains = {};

    const apis = {
        'crt.sh': {
            path: 'https://crt.sh/?q=%.' + url + '&output=json',
            fn: findCrt
        },
        'AlienVault': { 
            path: 'https://otx.alienvault.com/api/v1/indicators/domain/' + url + '/passive_dns',
            fn: findAlienVault 
        },
        'CertSpotter': { 
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

        const spinner = interface.waitLog('Looking for subdomains in ' + apiName);

        const response = await requestApi(apis[apiName]);

        let count = 0;
        response.forEach((elt) => {
            if (domains[elt.name] === undefined)
                domains[elt.name] = elt; count++;
        });

        //console.log(response);

        if (response.length >= 0)
            spinner.succeed(response.length + ' Subdomains found in ' + apiName + ' dont ' + count + ' new unique');
        else
            spinner.fail(apiName + ' failed');
    };

    return Object.keys(domains);
}

module.exports = {
    find
}