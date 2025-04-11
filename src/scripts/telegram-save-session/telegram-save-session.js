const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://web.telegram.org/');
  console.log('🕐 Inicia sesión manualmente. Presiona Enter aquí cuando estés dentro de Telegram...');
  
  process.stdin.once('data', async () => {
    await context.storageState({ path: 'telegram-session.json' });
    console.log('✅ Sesión guardada en telegram-session.json');
    await browser.close();
    process.exit();
  });
})();
