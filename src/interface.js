const ora = require('ora')
const spinner = ora('')

const waitLog = (msg) => {
    spinner.start();
    spinner.color = 'yellow';
    spinner.text = msg;

    return spinner;
}

module.exports = {
    waitLog,
}