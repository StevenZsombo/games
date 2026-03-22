/*run using
node --watch D:\js\games\docs\conquest\renamer.node.js
(with the appropriate pathing of course)
*/

const fs = require('fs');
const path = require('path');

//forward slashes (/) only! no \

const QUESTIONS_FOLDER = 'D:/clipped/vamsi questions'
const STARTING_ID = 100

// Check if directory exists
if (!fs.existsSync(QUESTIONS_FOLDER)) {
    console.error(`Directory not found: ${QUESTIONS_FOLDER}`);
    process.exit(1);
}

// Change directory
process.chdir(QUESTIONS_FOLDER);
console.log(`Changed to: ${process.cwd()}`);

// Get all files in directory
const files = fs.readdirSync('.').filter(f => fs.statSync(f).isFile());

if (files.length === 0) {
    console.log('No files found');
    process.exit(0);
}

// Extract number from filename
function extract(s) {
    const match = s.match(/^-?\d*\.?\d+/);
    if (match) {
        const number = match[0];
        const rest = s.slice(number.length);
        return [number, rest];
    }
    throw new Error("badness");
}

const extracted = files.map(f => extract(f));
const solutions = extracted.map(([num]) => num);
const ids = extracted.map((_, i) => i + STARTING_ID);


for (let i = 0; i < files.length; i++) {
    console.log(`${files[i]}\t${solutions[i]}\t${ids[i]}`);
    // Uncomment to rename
    // fs.renameSync(files[i], `${ids[i]}.png`);
}

