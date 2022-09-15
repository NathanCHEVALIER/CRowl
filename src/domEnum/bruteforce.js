const request = require('./../request');
const interface = require('./../interface');

const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];//,'0','1','2','3','4','5','6','7','8','9'];

const requestStatus = async(url) => {
    const response = await request
        .getRequest(url, 5000)
        .catch((err) => {
            return false
        });

    if (response) {
        console.log('Found: ' + url);
        return {
            status: true,
            name: url
        }
    }

    return {
        status: false,
    }
}

const bruteforce = async (domain) => {    
    //const spinner = interface.waitLog('Bruteforce');
    let subdomains = [];

    for (let i = 0; i < alphabet.length; i++) {
        for (let j = 0; j < alphabet.length; j++) {
            for (let k = 0; k < alphabet.length; k++) {
                //for (let c = 0; c < alphabet.length; c++) {
                    const prefix = alphabet[i] + alphabet[j] + alphabet[k];// + alphabet[c];
                    console.log(prefix);
                    const result = await requestStatus('http://' + prefix + '.' + domain);
                    if (result.status) {
                        subdomains.push(result);
                    }
                //}
            }
        }   
    }

    //spinner.fail('Bruteforce');

    console.log(subdomains)

    return subdomains;
}

module.exports = {
    bruteforce
}