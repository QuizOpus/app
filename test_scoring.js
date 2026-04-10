const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
    const page = await browser.newPage();
    
    // Setup file download interception
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: __dirname,
    });

    // Go to generator
    await page.goto('http://localhost:8080/saiten.html');
    setTimeout(async () => {
        // Wait for generation
    }, 1000);
    // Actually we can't easily wait for DB loads natively without mocking Firebase.
    // Instead, I'll bypass Firebase logic in saiten.html and force it to work!
})()
