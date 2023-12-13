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

    if(currentEvent.T === "n") {
        let companyImpact = 0;
        console.log("If Statement Reached");
        const gptRequest = {
            "model": "gpt-3.5-turbo",
            "messages": [
                { "role": "system", "content": "Only respond with a number from 1 - 100 detailing the impact of the headline." },
                { "role": "user", "content": "Given the headline '" + currentEvent.headline + "', show me a number from 1 to 100 detailing the impact of this headline." }
            ]
        };

        async function gptCall() {
            console.log("OpenAI API Called");
            try {
                const completion = await openai.chat.completions.create(gptRequest);
                console.log(completion.choices[0]);

                const tickerSymbol = currentEvent.symbols[0];
                companyImpact = parseInt(data.choice[0].message.content);


                if (companyImpact >= 70) {

                } else if(companyImpact <= 30) {

                    }
                
            } catch (error) {
                console.error("Error calling OpenAI API:", error);
            }
        }

        await gptCall();
    }
});

