#!/usr/bin/env node
const domEnum = require('./domEnum')
const program = require('commander')
const interface = require('./interface');
const fs = require('fs');


let subdomains = [];
let filename = "";

program.version('0.1').description('CRowl')

program
    .command('find')
    .description('find sudomains')
    .option('-o, --output <filename>', 'filename')
    .action(async (options) => {
        // const spinner = interface.waitLog('Looking for subdomains');
        // spinner.succeed(options.filename);
        filename = options.output;
        // spinner.succeed(subdomains.length + ' Subdomains found');
    })
    .option('-d, --domain <domain>', 'domain name')
    .action(async (options) => {
        subdomains = await domEnum.find(options.domain);
        
        if (filename !== undefined && filename !== "") {
            let file = fs.createWriteStream(filename);
            file.on('error', function(err) { /* error handling */ });
            subdomains.forEach((url) => { file.write(url + '\n'); });
            file.end();
        }
    });


program.parse(process.argv);