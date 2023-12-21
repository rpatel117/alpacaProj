const Alpaca = require ("@alpacahq/alpaca-trade-api");
const alpaca = new Alpaca();
const WebSocket = require('ws');
const OpenAI = require("openai");

const openai = new OpenAI();

const wss = new WebSocket("wss://stream.data.alpaca.markets/v1beta1/news")

wss.on('open', function() {
    console.log("WS Connected");

    const authMsg = {
        action: 'auth',
        key: process.env.APCA_API_KEY_ID,
        secret: process.env.APCA_API_SECRET_KEY
    };
    wss.send(JSON.stringify(authMsg));
    const subscribeMsg = {
        action: 'subscribe',
        news: ['*']
    };
    wss.send(JSON.stringify(subscribeMsg));
})



wss.on('message', async function(message) {
    console.log("Message is: " + message);
    const currentEvent = JSON.parse(message)[0];

    // all of the above needs no adjustment

    if(currentEvent.T === "n") {
        let companyImpact = 0;
        console.log("If Statement Reached");
        const gptRequest = {
            "model": "gpt-4",
            "messages": [
                { "role": "system", "content": "Only respond with a number from 1 - 100 detailing the impact of the headline." },
                { "role": "user", "content": "You are in charge of an investment portfolio. Your job is to analyze either the content of a current news headline or the contents of the article and decide one of 3 things. You must decide whether to purchase more of that stock, hold onto the current stock or sell our current shares depending on how the content of the article and how you predict it will affect the market. '" + currentEvent.headline + "', show me a number from 1 to 100 detailing the impact of this headline." }
            ]
        };

        async function gptCall() {
            console.log("OpenAI API Called");
            
            try {
                const completion = await openai.chat.completions.create(gptRequest);
                console.log(completion.choices[0]);

                let tickerSymbol = currentEvent.symbols[0];
                companyImpact = parseInt(completion.choices[0].message.content);


                if (companyImpact >= 70) {
                    console.log("Buy reached")
                        let order = await alpaca.createOrder({
                            symbol: tickerSymbol,
                            qty: 1,
                            side: 'buy',
                            type: 'market',
                            time_in_force: 'day'
                        })
                } else if(companyImpact <= 30) {
                    console.log("Sell Reached")
                    let closedPosition = alpaca.closedPosition(tickerSymbol);

                    } else {
                        console.log("Nothing reached")
                    }
                
            } catch (error) {
                console.error("Error calling OpenAI API:", error);
            }
        }

        await gptCall();
    }
});

