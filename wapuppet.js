const { Client } = require('whatsapp-web.js')
const qrcodeTerminal = require('qrcode-terminal')
const qrcode = require('qrcode')
const express = require('express')
const client = new Client()
const app = express()
const port = 8989

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

client.on('qr', async (qr) => {
    qrcodeTerminal.generate(qr, { small: true })
});

client.on('ready', () => {
    console.log('Client is ready!');
})

app.post('/', (req, res) => {
    let phoneNumber = req.body.phone_number
    let message = req.body.message

    client.isRegisteredUser(`${phoneNumber}@c.us`).then(isRegistered => {
        if (isRegistered) {
            client.sendMessage(`${phoneNumber}@c.us`, message)
        }
    })

    res.json({
        status: 'success'
    })
})

app.listen(port, () => {
    console.log(`Whatsapp puppet listening at http://localhost:${port}`)
})
client.initialize();