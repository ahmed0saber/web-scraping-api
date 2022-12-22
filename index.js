const express = require("express")
const app = express()
var cors = require('cors')
const request = require("request")
const cheerio = require("cheerio")
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(cors())
app.use(require('body-parser').urlencoded({ extended: false }))

app.listen(8080, () =>
    console.log(`Example app listening on port ${8080}!`),
)

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/projects', (req, res) => {
    res.render('projects')
})

app.post('/scrape', async (req, res) => {
    const currentResponse = await scrapeDataFromWebsite(req.body.url, req.body.items)

    return res.send(currentResponse)
})

async function scrapeDataFromWebsite(url, items) {
    let requestPromise = new Promise(function (myResolve, myReject) {
        request(url, (err, res, html) => {
            if (!err && res.statusCode === 200) {
                const $ = cheerio.load(html)
                const collectedData = {}
                items = JSON.parse(items)
                const objectKeys = Object.keys(items)
                objectKeys.forEach(key => {
                    if ($(items[key].selector).length === 0) {
                        collectedData[key] = 'This selector is not valid'
                        return
                    }
                    if (items[key].type === "text") {
                        if (!$(items[key].selector).text()) {
                            collectedData[key] = 'This selector does not have text'
                            return
                        }
                        collectedData[key] = $(items[key].selector).text().trim()
                    } else {
                        if (!$(items[key].selector).attr(items[key].type)) {
                            collectedData[key] = 'This selector does not have ' + items[key].type
                            return
                        }
                        collectedData[key] = $(items[key].selector).attr(items[key].type).trim()
                    }
                })
                myResolve(collectedData)
            } else {
                myReject({
                    error: 'Something went wrong while trying to open the url, maybe this website does not exist or is unscrapable'
                })
            }
        })
    })

    try {
        return await requestPromise
    } catch (err) {
        return err
    }
}
