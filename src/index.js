#!/usr/bin/env node
const domEnum = require('./domEnum')
const program = require('commander')
const interface = require('./interface');

program.version('0.1').description('CRowl')

program
    .command('find')
    .description('find sudomains')
    .option('-d, --domain <domain>', 'domain name')
    .action(async (options) => {
        const spinner = interface.waitLog('Looking for subdomains');
        const subdomains = await domEnum.find(options.domain);
        
        spinner.succeed(subdomains.length + ' Subdomains found');
    });

program.parse(process.argv);