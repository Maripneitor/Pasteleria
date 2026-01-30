// server/scripts/qa/run_all.js
const fs = require('fs');
const path = require('path');
// Load env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { spawn } = require('child_process');
const { chalk } = require('./_report');

const scripts = [
    { name: 'Contract Verification', script: 'verify_contract.js' },
];

async function runScript(name, scriptFile) {
    return new Promise((resolve) => {
        console.log(chalk.blue(chalk.bold(`\n>>> RUNNING: ${name} (${scriptFile}) <<<`)));

        // We pass current env to child. Since we loaded dotenv above, process.env should have vars.
        // However, spawn inherits process.env by default.
        const child = spawn('node', [path.join(__dirname, scriptFile)], {
            stdio: 'inherit',
            env: process.env
        });

        child.on('close', (code) => {
            resolve({ name, code });
        });
    });
}

async function main() {
    console.log(chalk.bold('Starting QA Runner...'));

    let failed = false;
    const results = [];

    for (const item of scripts) {
        const res = await runScript(item.name, item.script);
        results.push(res);
        if (res.code !== 0) failed = true;
    }

    console.log('\n' + chalk.blue(chalk.bold('=== FINAL SUMMARY ===')));
    results.forEach(r => {
        const status = r.code === 0 ? chalk.green('PASSED') : chalk.red('FAILED');
        console.log(`${r.name}: ${status}`);
    });

    process.exit(failed ? 1 : 0);
}

main();
