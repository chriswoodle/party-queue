import * as express from 'express';

import { Database, AccountRecord } from './database';
import { Cache } from './cache';
import * as spotify from './spotify';

const cache = new Cache();

const debug = require('debug')('app:rest');

const settings = require('../settings.json');
const db = new Database(process.env.CONNECTION_STRING || settings.connection_string);

const app = express();
const port = process.env.PORT || 4000;

import * as bodyParser from 'body-parser';
app.use(bodyParser.json());

interface Request extends express.Request {
    account?: AccountRecord
}

function auth(req: Request, res: express.Response, next: express.NextFunction) {
    debug(req.headers)
    const token = req.headers['authorization'];
    debug(token)
    if (!token) {
        res.statusCode = 401;
        res.statusMessage = 'not autnehticated';
        return res.send({ message: 'not authenticated' });
    }
    db.verifyAccount(token).then(account => {
        if (!account) {
            res.statusCode = 401;
            res.statusMessage = 'not autnehticated';
            return res.send({ message: 'not authenticated' });
        }
        req.account = account;
        next();
    })
};

app.get('/status', (req, res) => res.send('I\'m up'));
app.get('/account/status', auth, (req: Request, res) => {
    res.send(req.account)
});

app.post('/party/start', auth, (req: Request, res) => {
    if (!req.account) throw new Error('req.account is not defined!')
    debug(req.account)
    cache.createParty(req.account).then(partyId => {
        res.send({ partyId: partyId })
    }).catch(error => {
        res.send(error)
    })
});

app.post('/party/:partyId/join', auth, (req: Request, res) => {
    if (!req.account) throw new Error('req.account is not defined!');
    const partyId = req.params['partyId']
    debug(partyId)
    cache.joinParty(req.account, partyId).then(user => {
        debug(user);
        res.send(user)
    }).catch(error => {
        res.send(error)
    })
});

app.get('/party/:partyId/queue', auth, (req: Request, res) => {
    if (!req.account) throw new Error('req.account is not defined!');
    const partyId = req.params['partyId']
    debug(partyId)
    cache.getQueue(req.account, partyId).then((items: any) => {
        debug(items);
        res.send(items)
    }).catch(error => {
        res.send(error)
    })
});

app.post('/party/:partyId/vote', auth, (req: Request, res) => {
    if (!req.account) throw new Error('req.account is not defined!');
    const partyId = req.params['partyId']
    debug(partyId)
    const songId = req.body['songId'];
    const score = req.body['score'];
    cache.voteSong(req.account, partyId, songId, score).then((response: any) => {
        debug(response);
        res.send('Ok')
    }).catch(error => {
        res.send(error)
    })
});

app.post('/songs', auth, (req: Request, res) => {
    if (!req.account) throw new Error('req.account is not defined!');
    const query = req.body['query'];
    spotify.searchForTrack(req.account.spotifyAccessToken, query).then(response => {
        res.send(response)
    }).catch(error => {
        res.send(error)
    })
});

app.post('/api/text', (req: Request, res) => {
    const body = req.body['Body'];
    const from = req.body['From'];

    debug(from, body)
    res.send('Ok');
   
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));