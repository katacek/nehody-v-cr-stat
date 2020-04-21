// require needed libraries
const Apify = require('apify');
const cheerio = require("cheerio");
const fetch = require('node-fetch');

// define main function which downloads the required data
Apify.main(async () => {
    
    // if you send request to a browser, it returns response 
    // it can be seen by clicking 'inspect -> network -> XHR -> element you are looking for -> response' on the browser window 
    // here, we simulate such a request for a browser to get the response
    // in request body, you can see the filters (date from / to, city, ...)
    // in response, we get the table with all accidents
    const response = await fetch("https://nehody.cdv.cz/handlers/loadTable.php", {
        "headers": {
          "accept": "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://nehody.cdv.cz/statistics.php",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": "span=day&dateFrom=2007-01-01&dateTo=2020-03-31&types%5B%5D=nehody&area%5Bcode%5D=3018&area%5Bname%5D=Hlavn%C3%AD+m%C4%9Bsto+Praha&orderBy=p2a&orderByDirection=ASC&page=1",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      });
 
    // waiting for the response, getting json format from it
    const json = await response.json();
    //console.log(json)
    
    // the response returns a lot of pages, each with 50 accidents on it
    // also, it returns the overall number of accidents in 'count'
    // to know how many pages we need to crawl later on, we counts the specific number of pages 
    const numberOfAccidents = await json.count;
    const numberOfPages = Math.ceil(numberOfAccidents / 50);

    // setting an array to store the results
    let resultAll=[]

    // in this for cycle, we are changing the page number at body part of request
    // starting at 1 and unless we get to the numberOfPages, we are adding number 1 for each cycle
    // each cycle sends a new request to browser with defined page number
    for (page = 1; page<=numberOfPages; page++) {

        let body = `span=day&dateFrom=2007-01-01&dateTo=2020-03-31&types%5B%5D=nehody&area%5Bcode%5D=3018&area%5Bname%5D=Hlavn%C3%AD+m%C4%9Bsto+Praha&orderBy=p2a&orderByDirection=ASC&page=${page}`
        const response2 = await fetch("https://nehody.cdv.cz/handlers/loadTable.php", {
            "headers": {
              "accept": "application/json, text/javascript, */*; q=0.01",
              "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
              "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://nehody.cdv.cz/statistics.php",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": body,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
          });

            // as a response, we get the json table 
            // by cheerio we get the htmlTable from json2 
            const json2 = await response2.json();
            const $ = await cheerio.load(json2.htmlTable);
            
            // setting array for storing result of each page
            result = [];
        
            // getting table header as text of elements that are in th and do not have class width-50  
            let tableHeader = $('th:not(.width-50)').map(function(){
                return $(this).text();
            }).get();
            
            // getting table data as text of elements that are in td
            let tableData = $('td').map(function(){
                return $(this).text();
            }).get();
            
            // putting together table header with table data
            for (i = 0; i < tableData.length; i+=tableHeader.length)
            {
                oneRow = {};
                for (j = 0; j < tableHeader.length; j++)
                {
                    oneRow[tableHeader[j]] = tableData[i+j];
                }
                result.push(oneRow);
            };

            //console.log(result)
            resultAll = resultAll.concat(result);

}

console.log('Data downloaded..')

// save the data to Apify store
const dataset = await Apify.openDataset('NEHODOVOST-V-CR-DATASET');
await dataset.pushData(resultAll);
    
console.log('Data saved..')
});
