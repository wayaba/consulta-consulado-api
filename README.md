# consulta-consulado-api

Esta api hace el scrapping de la página del Consulado de España ( https://www.cgeonline.com.ar/informacion/apertura-de-citas.html )

La forma de pegarle a la api para traer la lista de apertura de citas es la siguiente

```
https://consulta-consulado-api.vercel.app/apertura-citas
```

El response tiene este formato

```
[
	{
		"service": "Carnet de conducir",
		"lastOpening": "x",
		"nextOpening": "primer día hábil de cada semana a las 11:00",
		"requestLink": "https://www.cgeonline.com.ar/tramites/citas/varios/cita-varios.html?t=11"
	},
	{
		"service": "Certificado de antecedentes penales",
		"lastOpening": "x",
		"nextOpening": "primer día hábil de cada semana a las 11:00",
		"requestLink": "https://www.cgeonline.com.ar/tramites/citas/varios/cita-varios.html?t=2"
	},
	{
		"service": "Certificado electrónico o digital",
		"lastOpening": "x",
		"nextOpening": "primer día hábil de cada semana a las 11:00",
		"requestLink": "https://www.cgeonline.com.ar/tramites/citas/varios/cita-varios.html?t=3"
	},
	{
		"service": "Fe de vida",
		"lastOpening": "x",
		"nextOpening": "primer día hábil de cada semana a las 11:00",
		"requestLink": "https://www.cgeonline.com.ar/tramites/citas/varios/cita-varios.html?t=5"
	},
	{
		"service": "Legalización de documentos",
		"lastOpening": "x",
		"nextOpening": "primer día hábil de cada semana a las 11:00",
		"requestLink": "https://www.cgeonline.com.ar/tramites/citas/varios/cita-varios.html?t=1"
	},
	{
		"service": "NIE (Número de identidad de extranjeros)",
		"lastOpening": "x",
		"nextOpening": "primer día hábil de cada semana a las 11:00",
		"requestLink": "https://www.cgeonline.com.ar/tramites/citas/varios/cita-varios.html?t=7"
	},
	{
		"service": "NIF (Número de identificación fiscal)",
		"lastOpening": "x",
		"nextOpening": "x",
		"requestLink": "mailto:cog.buenosaires.not@maec.es"
	},
  ...
]
```

Aca esta la explicacion de como deployar un proyecto de express con puppeteer en Vercel

# Chromium on Vercel (serverless)

This is an up-to-date guide on running Chromium in Vercel serverless functions in 2022. What you will read below is the result of two days of research, debugging, 100+ failed deployments, and a little bit of stress.

## Getting started

### Step 1: Install dependencies

Use [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda) that comes with Chromium pre-configured to run in serverless, and `puppeteer-core` due to the smaller size of Chromium distributive.

Turns out, choosing the right versions of dependencies is crucial. Newer versions of `puppeteer-core` ship larger Chromium distributive, which will exceed the 50MB function size limit on Vercel.

```jsonc
{
  "chrome-aws-lambda": "10.1.0",
  // Install v10 to have a smaller Chromium distributive.
  "puppeteer-core": "10.1.0"
}
```

> If you feel adventerous and wish to update dependencies, start from updating `chrome-aws-lambda`. Its peer dependency on `puppeteer-core` will tell you the maximum supported version to use.

#### Why not Playwright?

Playwright comes with a larger Chromimum instance that would exceed the maximum allowed serverless function size limit of 50MB on Vercel (transitively, AWS).

### Step 2: Write a function

The way you write your function does not matter: it may be a Node.js function, a part of your Next.js `/api` routes, or a Remix application. What matters on this stage is to **launch Puppeteer with correct options**.

```js
// api/run.js
import edgeChromium from 'chrome-aws-lambda'

// Importing Puppeteer core as default otherwise
// it won't function correctly with "launch()"
import puppeteer from 'puppeteer-core'

// You may want to change this if you're developing
// on a platform different from macOS.
// See https://github.com/vercel/og-image for a more resilient
// system-agnostic options for Puppeteeer.
const LOCAL_CHROME_EXECUTABLE =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export default async function (req, res) {
  // Edge executable will return an empty string locally.
  const executablePath =
    (await edgeChromium.executablePath) || LOCAL_CHROME_EXECUTABLE

  const browser = await puppeteer.launch({
    executablePath,
    args: edgeChromium.args,
    headless: false
  })

  const page = await browser.newPage()
  await page.goto('https://github.com')

  res.send('hello')
}
```

### Step 3: Configure Vercel deployment

#### Choose Node.js 14.x

`puppeteer-core@10` doesn't work well with newer versions of Node.js. The pinned version should be Node.js 14.

1. Go to your Vercel project.
2. Go to "Settings", then "General".
3. Locate the "Node.js version" section.
4. Select "Node 14".

<img width="943" alt="Screen Shot 2022-10-22 at 13 11 56" src="https://user-images.githubusercontent.com/14984911/197335971-a2a141bc-141c-4e68-b337-1f7db438ed4b.png">

In addition to configuring this on Vercel, make sure that your project's `package.json` doesn't have the `engines.node` property that would contradict your choise:

```jsonc
{
  "engines": {
    // If you have a newer version of Node in your package.json
    // Vercel will respect that and disregard what you've set
    // in your project's settings.
    "node": "14.x"
  }
}
```

Basically, you **should not** see this warning in your deployment logs:

```
Warning: Detected "engines": { "node": ">=14" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
```

If you do, this means your Node.js version is not configured correctly and you should repeat this section.

---
