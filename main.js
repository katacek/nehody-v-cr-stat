// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Include Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require('apify');

Apify.main(async () => {
    // Get input of the actor (here only for demonstration purposes).
    // If you'd like to have your input checked and have Apify display
    // a user interface for it, add INPUT_SCHEMA.json file to your actor.
    // For more information, see https://apify.com/docs/actor/input-schema
    //const input = await Apify.getInput();
    //console.log('Input:');
    //console.dir(input);

    // Open a request queue and add a start URL to it
    const requestQueue = await Apify.openRequestQueue();

    // queue: object, type of array, just few methods (add, remove), request is put at the end (opposite is stack where firt in first out), request is object as well
    await requestQueue.addRequest({ url: 'https://nehody.cdv.cz/statistics.php#table' });
    

    // Define a pattern of URLs that the crawler should visit
    //const pseudoUrls = [new Apify.PseudoUrl('https://www.iana.org/[.*]')];

    // Create a crawler that will use headless Chrome / Puppeteer to extract data
    // from pages and recursively add links to newly-found pages
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,

        // This function is called for every page the crawler visits
        // puppeteer gets the url from reuqest from request queue, goes to this page and create object page
        handlePageFunction: async ({ request, page }) =>
        {
            
            await Apify.utils.puppeteer.injectJQuery(page);
            await page.evaluate(() =>
            {
                $('#dateFrom').attr('value', '2020-03-01');
                $('#dateTo').attr('value', '2020-03-31');
            }
            );
            //await page.type('#dateFrom', '2020-03-01', { delay: 100 });
            //await page.type('#dateTo', '2020-03-31', { delay: 100 });
            await page.type('#admin_area', 'Hlavní město Praha', { delay: 100 });
            await page.click('#send');
                
            // need to be there
            // use when changing the page url, wait for new url to load
            // here waiting for a after login page
            
            await page.waitFor(10000);

            const table = await page.evaluate(() =>
            {
                result = [];
                let tableHeader = [];
                $('th:not(.width-50)').get().forEach(x => tableHeader.push(x.textContent));
                
                let tableData = [];
                $('#table>div>table.grid>tbody>tr>td').get().forEach(x => tableData.push(x.textContent));
                
                for (i = 0; i < tableData.length; i+=tableHeader.length)
                {
                    for (j = 0; j < tableHeader.length; j++)
                    {
                        oneRow = {};
                        oneRow[tableHeader[j]] = tableData[i+j];
                    }
                    result.push(oneRow);
                }


                return result[0];


                //$('#dateTo').attr('value', '2020-03-31');
            }
            );

            console.log(table)
        },

        // This function is called for every page the crawler failed to load
        // or for which the handlePageFunction() throws at least "maxRequestRetries"-times
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
            await Apify.pushData({
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },

        maxRequestRetries: 1,
        maxRequestsPerCrawl: 100,
        maxConcurrency: 10,
        handlePageTimeoutSecs: 300
    });

    await crawler.run();
});
