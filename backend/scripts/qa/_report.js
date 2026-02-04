// server/scripts/qa/_report.js
const chalk = {
    green: (msg) => `\x1b[32m${msg}\x1b[0m`,
    red: (msg) => `\x1b[31m${msg}\x1b[0m`,
    bold: (msg) => `\x1b[1m${msg}\x1b[0m`,
    yellow: (msg) => `\x1b[33m${msg}\x1b[0m`,
    blue: (msg) => `\x1b[34m${msg}\x1b[0m`,
};

let hasFailure = false;

function ok(msg) {
    console.log(`${chalk.green('[OK]')} ${msg}`);
}

function fail(msg, err, curlDetails) {
    hasFailure = true;
    console.log(`${chalk.red('[FAIL]')} ${msg}`);
    if (err) {
        if (err.response) {
            console.log(chalk.red(`  Status: ${err.response.status}`));
            // Try to print body if small
            try {
                const body = JSON.stringify(err.response.data);
                if (body.length < 500) console.log(chalk.red(`  Body: ${body}`));
            } catch (e) { }
        } else {
            console.error(chalk.red(`  Error: ${err.message || err}`));
        }
    }
    if (curlDetails) {
        // Check if curlDetails is string or object
        if (typeof curlDetails === 'string') {
            console.log(chalk.yellow(`  Reproduce: ${curlDetails}`));
        } else {
            // Object format
            let cmd = `curl -X ${curlDetails.method || 'GET'} "${curlDetails.url}"`;
            if (curlDetails.token) cmd += ` -H "Authorization: Bearer ${curlDetails.token}"`;
            if (curlDetails.body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(curlDetails.body)}'`;
            console.log(chalk.yellow(`  Reproduce: ${cmd}`));
        }
    }
}

function section(title) {
    console.log(`\n${chalk.blue(chalk.bold('=== ' + title + ' ==='))}`);
}

function getExitCode() {
    return hasFailure ? 1 : 0;
}

// Keeping compatibility
function exit() {
    process.exit(getExitCode());
}

// Wrapper to match previous version if needed, but fail() handles curl now too
function failWithCurl(msg, err, curlDetails) {
    fail(msg, err, curlDetails);
}

module.exports = {
    ok,
    fail,
    failWithCurl,
    section,
    getExitCode,
    exit,
    chalk,
    hasFailure: () => hasFailure
};
