#!/usr/bin/env node
const subdomain = require('./subdomainsEnumerate')
const program = require('commander')

program.version('0.1').description('CRowl')

program.command('find').description('find sudomains')
  .option('-d, --domain <domain>', 'domain name')
  .action(async (options) => {
    subdomain.crawl(options.domain);
  })

program.parse(process.argv)