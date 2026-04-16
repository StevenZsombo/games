// worker.js
self.onmessage = (e) => {
    const { fnString, args } = e.data;
    const fn = eval(`(${fnString})`)
    const result = fn(...args)
    self.postMessage(result)
}


/*
//Use:
const worker = new Worker('./worker.js')
worker.postMessage({
    fnString: '(a, b) => a + b',
    args: [5, 3]
})
// Receive result from worker
worker.onmessage = (e) => {
    console.log('Result:', e.data);
};
// Handle errors
worker.onerror = (err) => {
    console.error('Worker error:', err);
};
// Terminate when done
worker.terminate();
*/

/*
//Inline worker:
const blob = new Blob([`
    self.onmessage = (e) => {
        const { a, b } = e.data;
        self.postMessage(a + b);
    };
`], { type: 'application/javascript' })!
const worker = new Worker(URL.createObjectURL(blob));
*/