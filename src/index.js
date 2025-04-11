// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI("AIzaSyBqg2APOdzXACYUrFtOZSWzMER_eR5_4S8");
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// const prompt = "give me a text with 10 words about anything";

// const result = await model.generateContent(prompt);
// console.log(result.response.text());

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONTENT_PATH = 'src/content.json';  // Ruta al archivo de configuración
const PUBLISH_INTERVAL = 2 * 60 * 60 * 1000; // 2 horas
const POST_IN_GROUP_INTERVAL = 1 * 60 * 1000; // 1min

let grupos;
let mensajes;
let page;

// Leer el archivo de configuración (grupos y mensajes)
function leerConfig() {
  const rawConfig = fs.readFileSync(CONTENT_PATH);
  return JSON.parse(rawConfig);
}

async function initBrowser() {
  const { grupos: groups, mensajes: messages } = leerConfig();

  grupos = groups;
  mensajes = messages;

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: 'src/scripts/telegram-save-session/telegram-session.json' });
  page = await context.newPage();

  await page.goto('https://web.telegram.org/');

  // Ejecutar por primera vez inmediatamente
  enviarMensajes();

  // Repetir cada hora
  setInterval(enviarMensajes, PUBLISH_INTERVAL);
}

async function enviarMensajes() {

  for (const grupo of grupos) {
    console.log(`📨 Enviando mensajes a: ${grupo}`);

    try {
      // Buscar el grupo
      await page.waitForTimeout(1000);
      await page.click('input.input-field-input');
      await page.waitForTimeout(1000);
      await page.fill('input.input-field-input', grupo);
      await page.waitForTimeout(2000);
      await page.click('a.chatlist-chat-abitbigger');
      await page.waitForTimeout(2000);

      // Enviar todos los mensajes
      for (const mensaje of mensajes) {
        await page.click('div.attach-file');
        await page.waitForTimeout(2000);

        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'), // Espera el file dialog
          page.click('div.btn-menu-item:has(span:has-text("Photo or Video"))') // Abre el diálogo de adjuntar
        ]);
        
        await fileChooser.setFiles(path.resolve(mensaje.imagen));
        await page.fill('div[data-animation-group="NEW-MEDIA"]', mensaje.texto);
        await page.waitForTimeout(2000);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        console.log(`✅ Texto enviado: ${mensaje.texto}`);

        await page.waitForTimeout(POST_IN_GROUP_INTERVAL); // espera entre mensajes
      }

      await page.waitForTimeout(2000); // pausa entre grupos
    } catch (err) {
      console.error(`❌ Error con el grupo "${grupo}":`, err.message);
    }
  }

  // await browser.close();
  console.log('✅ Todos los mensajes enviados');
}

initBrowser()



