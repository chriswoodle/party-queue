# Party Queue 

# Setup
```
npm i
npm run build
```

```
npm run start
```

# API

```
GET /status - Server is up


GET /account/status - User is authenticated

POST /party/start
    body: {
        password?: string;
        name?: string;
    }

POST /party/:partyId/stop

POST /party/:partyId/skip
POST /party/:partyId/pause
POST /party/:partyId/resume



POST /party/join/
    body: {
        partyId: string;
        password?: string;
    }

GET /party/:partyId/queue

POST /party/:partyId/leave

POST /party/:partyId/vote
    body: {
        songId: string;
        score: number;
    }

POST /party/:partyId/message
    body: {
        message: string;
        pictureUrl: string;
    }

GET /song/search - https://developer.spotify.com/documentation/web-api/reference/search/search/


```
