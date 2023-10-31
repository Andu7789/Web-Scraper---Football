const puppeteer = require('puppeteer')
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const notifier = require('node-notifier');

app.listen(port, () => {
  console.log(`starting server at ${port}`)})

app.use(express.static('public')) //listens for all files within the 'public' folder
app.use(express.json({limit: '1mb'})) //need this for JSON to be allowed to be used*/

const url = "https://sports.williamhill.com/betting/en-gb/football/OB_EV29347684/portugal-women-vs-austria-women"
let initialValuesSet = false;
let scrapedDataItems = {
    home: "",
    teams: "",
    away: "",
    homeodds: "",
    awayodds: ""
}
let config = {
    homeoddsfirst: "",
    awayoddsfirst: ""
};
let decimal = {
    homeOddsDecimal: "",
    awayOddsDecimal: "",
    homeoddsfirstDecimal: "",
    awayoddsfirstDecimal: ""
}

function fractionToDecimal(fraction) {
    const [numerator, denominator] = fraction.split('/');
    
    if (denominator === 0) {
        throw new Error("Denominator cannot be zero.");
    }
    return numerator / denominator;
}

const handle = setInterval(scrapeData, 10000) //run every 10 seconds

async function scrapeData() {
    const browser = await puppeteer.launch({
        headless: 'new',
        // `headless: true` (default) enables old Headless;
        // `headless: 'new'` enables new Headless;
        // `headless: false` enables “headful” mode.
      });

    const page = await browser.newPage()
    await page.goto(url)

    const scrapedDataItems = {
        home: await page.evaluate(() => {
            const pgtag = document.querySelector(".btmarket__selection p");
            return pgtag ? pgtag.innerText : null;
        }),
        teams: await page.evaluate(() => {
            const pgtag1 = document.querySelector(".app__app__title-panel___G9_Fh h2");
            return pgtag1 ? pgtag1.innerText : null;
        }),          
    };
    //extract the away team name from the teams item
    const index = scrapedDataItems.teams.indexOf(" v ")
    const startpos = index+3
    const awayTeamExtracted = scrapedDataItems.teams.substring(startpos)
    scrapedDataItems.away = awayTeamExtracted

    //grab all the odds buttons values - had to do it this way as no way of defining them as their button IDs change each time
    const graball = await page.evaluate(() =>{
        const pgtag3 = document.querySelectorAll(".btn.betbutton.oddsbutton");
        let testarray = []

        pgtag3.forEach((tag) =>{
        testarray.push(tag.innerText)
    }) 
    return testarray
      
})
    

if (!config.homeoddsfirst && !config.awayoddsfirst) {
    config.homeoddsfirst = graball[0];
    config.awayoddsfirst = graball[2];
    console.log(config.homeoddsfirst);
    console.log(config.awayoddsfirst);
    console.log("Initial values set");
}

    scrapedDataItems.homeodds = graball[0] // get the odds for the home team
    scrapedDataItems.awayodds = graball[2] // get the odds for the away team

    decimal.homeOddsDecimal = fractionToDecimal(scrapedDataItems.homeodds)
    decimal.awayOddsDecimal = fractionToDecimal(scrapedDataItems.awayodds)
    decimal.homeoddsfirstDecimal = fractionToDecimal(config.homeoddsfirst)
    decimal.awayoddsfirstDecimal = fractionToDecimal(config.awayoddsfirst)


    console.log("dec", decimal.homeOddsDecimal);
    console.log("dec", decimal.awayOddsDecimal);
    console.log("dec", decimal.homeoddsfirstDecimal);
    console.log("dec", decimal.awayoddsfirstDecimal);

//console.log(graball);

    if (scrapedDataItems.homeodds === "10/1"){
        notifier.notify({
                title: "You have a new message",
                message: `The odds for ${scrapedDataItems.home} have...`,
                wait: true
    })
        clearInterval(handle)
    }
    console.log(scrapedDataItems.home, scrapedDataItems.homeodds, scrapedDataItems.teams, scrapedDataItems.awayodds,scrapedDataItems.away);
    console.log(config.homeoddsfirst,config.awayoddsfirst);
  
    await browser.close()

    return {
        scrapedDataItems: scrapedDataItems,
        config: config,
        decimal: decimal
    };
}

scrapeData()

app.post('/scrape', async (request, response) => {
    
    const scrapedData = await scrapeData();
    response.send(scrapedData);
  });