const Apify = require('apify');
const cheerio = require("cheerio");

const fetch = require('node-fetch');

Apify.main(async () => {
    
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
        "body": "span=day&dateFrom=2020-03-03&dateTo=2020-03-31&types%5B%5D=nehody&area%5Bcode%5D=3018&area%5Bname%5D=Hlavn%C3%AD+m%C4%9Bsto+Praha&orderBy=p2a&orderByDirection=ASC&page=1",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      });
 
    const json = await response.json();
    //console.log(json)
    const numberOfAccidents = await json.count;
    const numberOfPages = Math.ceil(numberOfAccidents / 50);

    let resultAll=[]

    for (page = 1; page<=numberOfPages; page++) {

        let body = `span=day&dateFrom=2020-03-03&dateTo=2020-03-31&types%5B%5D=nehody&area%5Bcode%5D=3018&area%5Bname%5D=Hlavn%C3%AD+m%C4%9Bsto+Praha&orderBy=p2a&orderByDirection=ASC&page=${page}`
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


            const json2 = await response2.json();
            const $ = await cheerio.load(json2.htmlTable);
            
            result = [];
            let tableHeader = $('th:not(.width-50)').map(function(){
                return $(this).text();
            }).get();
            
            let tableData = $('td').map(function(){
                return $(this).text();
            }).get();
            
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
    
const dataset = await Apify.openDataset('NEHODOVOST-V-CR-DATASET-TEST');
await dataset.pushData(resultAll);
    
console.log('Data saved..')
});
