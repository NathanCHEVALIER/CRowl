const ora = require('ora')
const spinner = ora('')

const colors = {
    reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    
    black: "\x1b[30m",
    red: "\x1b[31m",
    orange: "\033[38;5;208m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
}

const writeLog = (msg, options = {}) => {
    if (options.color === undefined)
        options.color = 'white';

    process.stdout.write(colors[options.color] + msg + colors['reset']);
}

const waitLog = (msg) => {
    spinner.start();
    spinner.color = 'blue';
    spinner.text = msg + '\r\n';

    return spinner;
}

module.exports = {
    waitLog,
    writeLog,
}