
const puppeteer = require('puppeteer')
const notifier = require('node-notifier');
const { exec } = require('child_process');
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`starting server at ${port}`)})

app.use(express.static('public')) //listens for all files within the 'public' folder
app.use(express.json({limit: '1mb'})) //need this for JSON to be allowed to be used

const url = 'https://sports.williamhill.com/betting/en-gb/football/OB_EV29315030/cremonese-vs-cittadella'

const product = {Image: '', Title: '', Price: ''}
const handle = setInterval(scrapeProject, 5000)

async function scrapeProject(url) {
    const browser = await puppeteer.launch({
        headless: 'new',
        // `headless: true` (default) enables old Headless;
        // `headless: 'new'` enables new Headless;
        // `headless: false` enables “headful” mode.
      });

    const page = await browser.newPage()
    await page.goto(url)

    const [el] = await page.$x('//*[@id="main-image"]')
    const src = await el.getProperty('src')
    product.imgURL = await src.jsonValue()

    const [el2] = await page.$x('//*[@id="scoreContainer"]/div/div[2]/div')
    const txt = await el2.getProperty('textContent')
    product.title = await txt.jsonValue()

    const [el3] = await page.$x('/html/body/div[2]/div/div[3]/div[7]/div/div/div[2]/div[2]/div[3]/div[1]/div/div[1]/div/div[1]/div/div/div[1]/div/div[1]/h5/div[2]/div[1]/div/div[1]/span/span[1]')
    const txt2 = await el3.getProperty('textContent')
    product.price = await txt2.jsonValue()

    console.log({imgURL, title, price});
    //console.log(product);
    
   notifier.notify({
      title: "You have a new message",
      //message: `The item is ${product.name} and the link is ${product.link}`,
      message: product.title,
      open: url,
      wait: true
     })
    notifier.on('click', function (notifierObject, options, event) {
        console.log('Notification clicked');
    
    let command = '';
    if (process.platform === 'win32') {
        // Windows
        command = `start ${url}`;
    } else if (process.platform === 'darwin') {
        // macOS
        command = `open ${url}`;
    } else {
        // Linux
        command = `xdg-open ${url}`;
    }

    // Use the appropriate command based on the operating system
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error('Error opening URL:', err);
        }
    });

    })
    
    
browser.close

}
scrapeProject(url)