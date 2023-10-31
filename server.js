const axios = require("axios")
const cheerio = require("cheerio")
require('dotenv').config()
const notifier = require('node-notifier');
const { exec } = require('child_process');

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.listen(port, () => {
console.log(`starting server at ${port}`)})

app.use(express.static('public')) //listens for all files within the 'public' folder
app.use(express.json({limit: '1mb'})) //need this for JSON to be allowed to be used

const url = 'https://www.amazon.co.uk/dp/B0CHX165HC?aaxitk=d5e16ddde2c1e898f0d668426a6a3f92&pd_rd_plhdr=t&smid=A3P5ROKL5A1OLE&ref=dacx_dp_584004173353326973_580805721931024492'


    async function scrapeData() {
        try {
          
          const { data } = await axios.get(url)
          const $ = cheerio.load(data)
          

          const item = $("div#dp")
          scrapedData = $(item).find("h1 span#productTitle").text()
          
          
          return scrapedData;
        } catch (error) {
          console.error(error);
        }
      }
      
      module.exports = scrapeData;

app.post('/scrape', async (request, response) => {
    
    const scrapedData = await scrapeData();
    response.send(scrapedData);
  });

