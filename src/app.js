const express = require('express')
const edgeChromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

const LOCAL_CHROME_EXECUTABLE =
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'

const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (reg, res) => {
  res.send('la pagina de inicio')
})

app.get('/apertura-citas', async (req, res) => {
  try {
    const PAGE_URL = `https://www.cgeonline.com.ar/informacion/apertura-de-citas.html`

    const executablePath =
      (await edgeChromium.executablePath) || LOCAL_CHROME_EXECUTABLE

    const browser = await puppeteer.launch({
      executablePath,
      args: edgeChromium.args,
      headless: false
    })

    const page = await browser.newPage()

    await page.goto(PAGE_URL)
    await page.waitForSelector('table')

    const rows = await page.$$('table tr')

    let tableRows = []
    for (const row of rows) {
      const columns = await row.$$('td')
      if (columns.length > 0) {
        const requestLinkText = await page.evaluate(
          (col) => col.textContent.trim(),
          columns[3]
        )
        let requestLink = ''
        if (
          requestLinkText === 'solicitar' ||
          requestLinkText.includes('correo')
        ) {
          const aLink = await columns[3].$('a')
          requestLink = await page.evaluate((a) => a.href, aLink)
        }

        if (columns[3])
          tableRows.push({
            service: await page.evaluate(
              (col) => col.textContent.trim(),
              columns[0]
            ),
            lastOpening: await page.evaluate(
              (col) => col.textContent.trim(),
              columns[1]
            ),
            nextOpening: await page.evaluate(
              (col) => col.textContent.trim(),
              columns[2]
            ),
            requestLink: requestLink
          })
      }
    }
    res.send(tableRows)
  } catch (err) {
    console.error(err)
    res.status(500).send('Error en la automatización del navegador')
  }
})

module.exports = app
