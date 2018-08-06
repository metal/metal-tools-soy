#!/usr/bin/env node

'use strict';

process.on('unhandledRejection', err => {
    throw err;
});

const crossSpawn = require('cross-spawn');

const args = process.argv.slice(2);
const commandIndex = args.findIndex(
    x => x === 'new'
);
const command = commandIndex === -1 ? args[0] : args[commandIndex];
const nodeArgs = commandIndex > 0 ? args.slice(0, commandIndex) : [];

switch(command) {
    case 'new':
        const result = crossSpawn.sync(
            'node',
            nodeArgs
                .concat(require.resolve('../lib/index.js'))
                .concat(args.slice(commandIndex + 1)),
            { stdio: 'inherit' }
        );
        process.exit(1);
        break;
    default:
        console.log('Unknown command "' + command + '".');
        break;
}
