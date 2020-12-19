require('dotenv').config()

const { Client } = require('whatsapp-web.js')
const fs = require('fs');
const qrcode = require('qrcode')
const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const app = express()
const port = 8989
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const SESSION_FILE_PATH = './session.json'

let sessionData
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH)
}

app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: __dirname
    });
})

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    },
    session: sessionData,
})

client.initialize();

// Initialize Socket.IO

io.on('connection', (socket) => {
    socket.emit('message', 'Connecting...');

    console.log('connected to socket')

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code received, scan please!');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
    });

    client.on('authenticated', (session) => {
        socket.emit('authenticated', 'Whatsapp is authenticated!');
        socket.emit('message', 'Whatsapp is authenticated!');
        console.log('AUTHENTICATED', session);
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('auth_failure', function (session) {
        socket.emit('message', 'Auth failure, restarting...');
    });

    client.on('disconnected', (reason) => {
        socket.emit('message', 'Whatsapp is disconnected!');
        fs.unlinkSync(SESSION_FILE_PATH, function (err) {
            if (err) return console.log(err);
            console.log('Session file deleted!');
        });
        client.destroy();
        client.initialize();
    });
});

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

server.listen(port, () => {
    console.log(`Whatsapp puppet listening at http://localhost:${port}`)
})