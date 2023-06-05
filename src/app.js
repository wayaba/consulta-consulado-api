const express = require('express')
const edgeChromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
//const { chromium } = require('playwright')

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

    //headless para que no se abra el navegador
    //const browser = await chromium.launch({ headless: true })

    const browser = await puppeteer.launch({
      executablePath,
      args: edgeChromium.args,
      headless: true
    })
    const page = await browser.newPage()

    await page.goto(PAGE_URL)

    const output = await page.$$eval('table > tbody tr', (rows) => {
      return rows.map((row) => {
        const cells = Array.from(row.querySelectorAll('td'))

        let [service, lastOpening, nextOpening, requestLink] = cells
        service = service ? service.textContent.trim() : service
        lastOpening = lastOpening ? lastOpening.textContent.trim() : lastOpening
        nextOpening = nextOpening ? nextOpening.textContent.trim() : nextOpening
        requestLink = requestLink.querySelector('a').getAttribute('href')

        if (!requestLink.includes('mailto:'))
          requestLink = 'https://www.cgeonline.com.ar' + requestLink

        return { service, lastOpening, nextOpening, requestLink }
      })
    })

    //cierro la conexion al navegador
    await browser.close()

    res.send(output)
  } catch (err) {
    const status = err.status || 500
    res.status(status).send('Error en la automatización del navegador', err)
  }
})

module.exports = app
