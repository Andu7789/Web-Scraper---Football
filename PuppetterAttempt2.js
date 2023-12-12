const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const notifier = require("node-notifier");
const cheerio = require("cheerio");
const { elements } = require("chart.js");

const app = express();
app.use(bodyParser.json());
app.use(express.static("Attempt 2")); //listens for all files within the 'public' folder
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

let url2 = "";

let shouldScrape = false;
let nofitfypushed = false;
let ReceivedValue = "";

//const handle = setInterval(scrapeData, 10000); //run every 10 seconds
const handle = setInterval(() => {
  if (shouldScrape) {
    scrapeData();
  }
}, 10000);

let scrapedDataItems = {
  home: "",
  teams: "",
  away: "",
  homeodds: "",
  awayodds: "",
  score: "",
};
let config = {
  homeoddsfirst: "",
  awayoddsfirst: "",
};
let decimal = {
  homeOddsDecimal: "",
  awayOddsDecimal: "",
  homeoddsfirstDecimal: "",
  awayoddsfirstDecimal: "",
};
function fractionToDecimal(fraction) {
  const [numerator, denominator] = fraction.split("/");

  if (denominator === 0) {
    throw new Error("Denominator cannot be zero.");
  }
  return numerator / denominator;
}

app.post("/scrape", async (req, res) => {
  const url = req.body.url;
  console.log(url);
  url2 = url;
  const scrapedData = await scrapeData(url);
  res.send(scrapedData);
});

app.post("/notify", (req, res) => {
  nofitfypushed = true;
  const { value } = req.body;
  // Use the value (which is 1 in this case) in your server-side function
  ReceivedValue = value;
  console.log("Received Value:", value);
  const scrapedData = scrapeData(value);
  res.json({ scrapedData });
});

async function scrapeData(url) {
  shouldScrape = true;
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto(url2);
  const html = await page.evaluate(() => document.body.innerHTML);
  const $ = await cheerio.load(html);

  const scrapedDataItems = {
    home: await page.evaluate(() => {
      const pgtag = document.querySelector(".btmarket__selection p");
      return pgtag ? pgtag.innerText : null;
    }),
    teams: await page.evaluate(() => {
      const pgtag1 = document.querySelector(
        ".app__app__title-panel___G9_Fh h2"
      );
      return pgtag1 ? pgtag1.innerText : null;
    }),
    score: await page.evaluate(() => {
      const pgtag2 = document.querySelector("[data-push='score']");
      return pgtag2 ? pgtag2.textContent : null;
    }),
  };

  //extract the away team name from the teams item
  const index = scrapedDataItems.teams.indexOf(" v ");
  const startpos = index + 3;
  const awayTeamExtracted = scrapedDataItems.teams.substring(startpos);
  scrapedDataItems.away = awayTeamExtracted;

  //grab all the odds buttons values - had to do it this way as no way of defining them as their button IDs change each time
  const graball = await page.evaluate(() => {
    const pgtag3 = document.querySelectorAll(".btn.betbutton.oddsbutton");
    let testarray = [];

    pgtag3.forEach((tag) => {
      testarray.push(tag.innerText);
    });

    return testarray;
  });

  if (nofitfypushed === true) {
    config.homeoddsfirst = graball[0];
    config.awayoddsfirst = graball[2];
    console.log("homeoddsfirst", config.homeoddsfirst);
    console.log("awayoddsfirst", config.awayoddsfirst);
    console.log("Initial values set");
    nofitfypushed = false;
  }

  scrapedDataItems.homeodds = graball[0]; // get the odds for the home team
  scrapedDataItems.awayodds = graball[2]; // get the odds for the away team

  decimal.homeOddsDecimal = fractionToDecimal(scrapedDataItems.homeodds);
  decimal.awayOddsDecimal = fractionToDecimal(scrapedDataItems.awayodds);
  decimal.homeoddsfirstDecimal = fractionToDecimal(config.homeoddsfirst);
  decimal.awayoddsfirstDecimal = fractionToDecimal(config.awayoddsfirst);

  if (
    ReceivedValue === 1 &&
    decimal.homeOddsDecimal > decimal.homeoddsfirstDecimal
  ) {
    notifier.notify({
      title: "You have a new message",
      message: `The odds for ${scrapedDataItems.home} have gone UP`,
      time: 150000, // How long to show balloon in ms
      wait: false, // Wait for User Action against Notification
      type: "info", // The notification type : info | warn | error
    });
    ReceivedValue = 0;
  }

  if (
    ReceivedValue === 2 &&
    decimal.homeOddsDecimal < decimal.homeoddsfirstDecimal
  ) {
    notifier.notify({
      title: "You have a new message",
      message: `The odds for ${scrapedDataItems.home} have gone DOWN`,
      time: 150000, // How long to show balloon in ms
      wait: false, // Wait for User Action against Notification
      type: "info", // The notification type : info | warn | error
    });
    ReceivedValue = 0;
  }
  if (
    ReceivedValue === 3 &&
    decimal.awayOddsDecimal > decimal.awayoddsfirstDecimal
  ) {
    notifier.notify({
      title: "You have a new message",
      message: `The odds for ${scrapedDataItems.away} have gone UP`,
      time: 150000, // How long to show balloon in ms
      wait: false, // Wait for User Action against Notification
      type: "info", // The notification type : info | warn | error
    });
    ReceivedValue = 0;
  }
  if (
    ReceivedValue === 4 &&
    decimal.awayOddsDecimal < decimal.awayoddsfirstDecimal
  ) {
    notifier.notify({
      title: "You have a new message",
      message: `The odds for ${scrapedDataItems.away} have gone DOWN`,
      time: 150000, // How long to show balloon in ms
      wait: false, // Wait for User Action against Notification
      type: "info", // The notification type : info | warn | error
    });
    ReceivedValue = 0;
  }

  console.log(
    "homeOddsDecimal",
    decimal.homeOddsDecimal,
    "homeoddsfirstDecimal",
    decimal.homeoddsfirstDecimal,
    "awayOddsDecimal",
    decimal.awayOddsDecimal,
    "awayoddsfirstDecimal",
    decimal.awayoddsfirstDecimal
  );
  console.log("Scraped Data", scrapedDataItems);
  return {
    scrapedDataItems: scrapedDataItems,
  };
}
