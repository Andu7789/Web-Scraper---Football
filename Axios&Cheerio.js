const axios = require("axios")
const cheerio = require("cheerio")
require('dotenv').config()
const notifier = require('node-notifier');
const { exec } = require('child_process');

const express = require('express')
const app = express()
const port = process.env.PORT || 3002

app.listen(port, () => {
console.log(`starting server at ${port}`)})

app.use(express.static('public')) //listens for all files within the 'public' folder
app.use(express.json({limit: '1mb'})) //need this for JSON to be allowed to be used



const accountSid = process.env.TWILLIO_ACCOUNT_SID
const authToken = process.env.TWILLIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)

const url = 'https://www.amazon.co.uk/Samsung-Inch-Q60C-Smart-Built/dp/B0BX76B4V8/ref=sr_1_1_mod_primary_new?crid=15SYGTGLYMCG5&keywords=65+inch+tv+qled+4k+samsung+fire+tv&qid=1698659729&s=audible&sbo=RZvfv%2F%2FHxDF%2BO5021pAnSA%3D%3D&sprefix=sams%2Caudible%2C70&sr=1-1'

const product = { name:'', availability:"", link:''}

const handle = setInterval(scrape, 10000) //run every 10 seconds

async function scrape(){

    const { data } = await axios.get(url)
    const $ = cheerio.load(data)
    const item = $("div#dp")
    const item2 = $("div#btf_arenas")
    product.name = $(item).find("h1 span#productTitle").text()
    const availability = $(item2).find(" td comparable_item1").text()
    product.link = url
    console.log(product);

   

   /*client.messages.create({
        body: `The item is ${product.name} and the link is ${product.link}`,
        from: '+447897034424',
        to: '+447875200849'
    })
    .then((message) => {
        console.log(message);
        clearInterval(handle)
    })*/

    notifier.notify({
        title: "You have a new message",
        //message: `The item is ${product.name} and the link is ${product.link}`,
        message: product.name,
        open: product.link,
        wait: true
    })
    

    notifier.on('click', function (notifierObject, options, event) {
        console.log('Notification clicked');
        
        let command = '';
        if (process.platform === 'win32') {
            // Windows
            command = `start ${product.link}`;
        } else if (process.platform === 'darwin') {
            // macOS
            command = `open ${product.link}`;
        } else {
            // Linux
            command = `xdg-open ${product.link}`;
        }
    
        // Use the appropriate command based on the operating system
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error('Error opening URL:', err);
            }
        });

    })
    
}
scrape()