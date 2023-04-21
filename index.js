const express = require('express')

// api/run.js
const edgeChromium = require('chrome-aws-lambda')

// Importing Puppeteer core as default otherwise
// it won't function correctly with "launch()"
const puppeteer = require('puppeteer-core')
const LOCAL_CHROME_EXECUTABLE =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

//C:\Program Files (x86)\Google\Chrome\Application
const cors = require('cors')

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/', (reg, res) => {
  res.send('la pagina de inicio')
})

app.get('/turnos', (reg, res) => {
  res.send('la pagina de inicio turnos')
})

app.get('/turnos-pasaporte', async (req, res) => {
  try {
    console.log('entro a turnos pasaporte!!!!')

    const PAGE_URL = `https://www.cgeonline.com.ar/informacion/apertura-de-citas.html`
    //const browser = await puppeteer.launch({ headless: true })
    // const browser = await puppeteer.launch({
    //   args: chromium.args,
    //   defaultViewport: chromium.defaultViewport,
    //   executablePath: await chromium.executablePath,
    //   headless: chromium.headless,
    //   ignoreHTTPSErrors: true
    // })
    // Edge executable will return an empty string locally.
    const executablePath =
      (await edgeChromium.executablePath) || LOCAL_CHROME_EXECUTABLE

    const browser = await puppeteer.launch({
      executablePath,
      args: edgeChromium.args,
      headless: false
    })

    console.log('despues del browser')
    const page = await browser.newPage()
    console.log('antes del goto')
    await page.goto(PAGE_URL)
    await page.waitForSelector('table')
    console.log('despues del goto')
    const rows = await page.$$('table tr')

    let pasaportesRow = null
    for (const row of rows) {
      const rowText = await page.evaluate((row) => row.textContent.trim(), row)
      if (rowText.includes('Pasaportes')) {
        pasaportesRow = row
        break
      }
    }

    let nextOpening = ''
    let requestLink =
      'https://www.cgeonline.com.ar/tramites/citas/opciones-pasaporte.html'
    let isOpen = false
    if (pasaportesRow) {
      const columns = await pasaportesRow.$$('td')
      const columna3 = columns[2]
      if (columna3) {
        const columna3Text = await page.evaluate(
          (columna3) => columna3.textContent.trim(),
          columna3
        )
        nextOpening = columna3Text

        if (nextOpening !== 'fecha por confirmar') isOpen = true
      } else {
        console.log(
          'No se encontró la tercera columna en la fila de Pasaportes'
        )
      }
    } else {
      console.log('Fila de Pasaportes no encontrada')
    }

    let content = {
      row: 'PASAPORTE',
      nextOpening: nextOpening,
      isOpen: isOpen,
      requestLink: requestLink
    }
    res.send(content)
  } catch (err) {
    console.error(err)
    res.status(500).send('Error en la automatización del navegador')
  }
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})
