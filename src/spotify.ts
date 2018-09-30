import * as request from 'request';

const debug = require('debug')('app:spotify');

export function getUserPlaylist(spotifyUserId: string, accessToken: string) {
    return new Promise<string>((resolve, reject) => {
        const options = {
            headers: { Authorization: 'Bearer ' + accessToken }
        };
        debug(options)

        request.get(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists?limit=50`, options, (error, response) => {
            debug(error)
            if (error) throw new Error(error)
            const body = JSON.parse(response.body)
            debug(body.items)
            const playlist = body.items.find((playlist: any) => {
                return playlist.name === 'Party Queue';
            })
            debug(playlist)
            if (playlist) return resolve(playlist.id);
            createPartyQueuePlaylist(spotifyUserId, accessToken).then((playlist:any) => {
                return resolve(playlist.id);
            });
        });
    })
}

export function getPlaylistTracks(spotifyPlaylistId: string, accessToken: string) {
    return new Promise<any>((resolve, reject) => {
        const options = {
            headers: { Authorization: 'Bearer ' + accessToken }
        };
        debug(options)

        request.get(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, options, (error, response) => {
            debug(error)
            if (error) throw new Error(error)
            const body = JSON.parse(response.body)
            debug(body.items)
            return resolve(body.items.map((track: any) => mapTrack(track)));
        });
    })
}

function mapTrack(track: any) {
    return {
        songId: track.track.id,
        name: track.track.name,
        score: 1
    }
}

function createPartyQueuePlaylist(spotifyUserId: string, accessToken: string) {
    // API BROKEN
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Party Queue',
                public: true
            })
        };
        debug(options)
        request.post(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`, options, (error, response) => {
            debug(error)
            if (error) throw new Error(error)
            debug(response.statusCode)
            debug(response.body);
             const body = JSON.parse(response.body)
            resolve(body);
        });
    });
}

export function searchForTrack(accessToken: string, searchString: string) {
    return new Promise<string>((resolve, reject) => {
        const options = {
            headers: { Authorization: 'Bearer ' + accessToken }
        };
        debug(options)
        request.get(`https://api.spotify.com/v1/search?q=${encodeURI(searchString)}&type=track`, options, (error, response) => {
            debug(error)
            if (error) throw new Error(error)
            const body = JSON.parse(response.body)
            debug(body.tracks)
            return resolve(body.tracks.items);
        });
    })
}

export function setPlaylistTracks(accessToken: string, spotifyPlaylistId: string, spotifyUserId: string, tracks: string[]) {
    return new Promise<string>((resolve, reject) => {
        const options = {
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: tracks.map(track => 'spotify:track:' + track)
            }),
        };
        debug(options)
        const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`;
        // const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks?uris=${tracks.reduce((out, track) => out + 'spotify:track:' + track + ',')}`;
        debug(url);
        request.put(url, options, (error, response) => {
            debug(error)
            debug(response.statusCode)
            debug(response.body)

            if (error) throw new Error(error)
            const body = JSON.parse(response.body)
            debug(body)
            return resolve(body);
        });
    })
}

export function pause(playlistID: string) {
    return Promise.resolve('');
}

export function stop(playlistID: string) {
    return Promise.resolve('');
}

export function resume(playlistID: string) {
    return Promise.resolve('');
}