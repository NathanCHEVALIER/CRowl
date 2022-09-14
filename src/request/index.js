const request = require('request')

const getRequest = (url, tout = 8000) => {
    return new Promise((resolve, reject) => {
        request({ 
            method: 'GET',
            url: url,
            timeout: tout
        }, (error, response, body) => {
            if (error)
                return reject(error);
            
            return resolve({body, response});
        })
    });
}
  
const postRequest = (url, data) => {
    return new Promise((resolve, reject) => {
        request({ 
            method: 'POST',
            url: url,
            data: data 
        }, (error, response, body) => {
            if (error) 
                return reject(error);
    
            return resolve({ body, response });
        });
    });
}

module.exports = {
    getRequest,
    postRequest
}