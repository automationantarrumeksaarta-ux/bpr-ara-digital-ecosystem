const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text(), msg.location()?.url);
    }
  });
  page.on('pageerror', error => console.log('UNCAUGHT EXCEPTION:', error.message));

  console.log('Navigating to http://localhost:3535...');
  await page.goto('http://localhost:3535', { waitUntil: 'networkidle0' });
  
  // Wait for React to load Login Screen
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    console.log('Clicking demo account button (Danang)...');
    const demoBtns = await page.$$('button.group.shadow-xs');
    if (demoBtns.length > 1) {
      await demoBtns[1].click(); // click second account
      await new Promise(r => setTimeout(r, 1000));
      
      console.log('Clicking continue...');
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) {
        await loginBtn.click();
      }

      await new Promise(r => setTimeout(r, 2000));
      
      console.log('Entering OTP...');
      await page.keyboard.type('123456');
      
      // Wait to see if it logs in and crashes
      await new Promise(r => setTimeout(r, 5000));
      console.log('Finished waiting. Did it crash?');
      await page.screenshot({ path: 'screenshot.png' });
    } else {
      console.log('No demo account buttons found.');
    }
  } catch (e) {
    console.log('Error during login sequence:', e);
  }

  await browser.close();
})();
