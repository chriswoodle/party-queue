import { AccountRecord } from "./database";
import { ObjectId } from 'mongodb';

const debug = require('debug')('app:cache');

import { getRandomGif } from './giphy';

// import * as redis from 'redis';

export interface Party {
    name: string;
    id: ObjectId;
    ownerId: string;
    code: string;
    accessToken: string;
    password?: string;
    spotifyPlaylistId: string;
    spotifyUserId: string;
    queue: Song[];
    history: Song[];
    feed: (UserAction | UserMessage | Tweet)[];
    users: User[];
}

export interface User {
    id: string; // Generated when joining
    account?: AccountRecord;
    phoneNumber?: string;
    handle?: string; // Twitter
    icon: string; // Random Giphy emoji icon
    history: UserAction[]
}

export interface UserAction {
    songId: string;
    score: number;
}

export interface Song {
    songId: string;
    name: string;
    score: number;
}

export interface UserMessage {
    message: string;
    pictureUrl?: string;
}

export interface Tweet {
    message: string;
    handle: string;
    userImage: string;
    attachedImageUrl: string;
}

import * as Spotify from './spotify';

export class Cache {
    private queue: Party[] = [];

    public createParty(account: AccountRecord, options: { password?: string, name?: string } = {}): Promise<string> {
        return Spotify.getUserPlaylist(account.spotifyUserId, account.spotifyAccessToken).then(spotifyPlaylistId => {
            return Spotify.getPlaylistTracks(spotifyPlaylistId, account.spotifyAccessToken).then((tracks: Song[]) => {
                const partyId = new ObjectId('5bb0dd37b093135161f5f0a2');
                this.queue.push({
                    id: partyId,
                    ownerId: account.id,
                    accessToken: account.spotifyAccessToken,
                    name: options.name || 'Party Q',
                    spotifyPlaylistId: spotifyPlaylistId,
                    spotifyUserId: account.spotifyUserId,
                    code: generateShortCode().toUpperCase(),
                    queue: tracks,
                    history: [],
                    feed: [],
                    users: [],
                });
                debug(this.queue);
                return partyId.toHexString();
            });

        });
    }

    public partyPause(partyId: string) {

    }

    public partyResume(partyId: string) {

    }

    public partyStop(partyId: string) {

    }

    public reloadQueue(party: Party) {
        debug('reloadQueue')
        return new Promise((resolve, reject) => {
            debug(party.queue)
            party.queue.sort((a, b) => {
                if (a.score < b.score)
                    return 1;
                if (a > b)
                    return -1;
                // a must be equal to b
                return 0;
            });
            party.queue = party.queue.filter(song => {
                return song.score > 0;
            })
            debug(party.queue)
            Spotify.setPlaylistTracks(party.accessToken, party.spotifyPlaylistId, party.spotifyUserId, party.queue.map(track => track.songId)).then(response => {
                return resolve(response);
            });
        });
    }

    public getQueue(account: AccountRecord, partyId: string) {
        return new Promise((resolve, reject) => {
            const party = this.queue.find(party => {
                return party.id.toHexString() === partyId;
            });
            if (!party) throw new Error(`Cannot find party ${partyId} in cache!`);
            return resolve(party.queue.filter((value, index) => {
                return index < 10;
            }));
        });
    }

    public joinParty(account: AccountRecord, partyId: string, password?: string) {
        return new Promise((resolve, reject) => {
            const party = this.queue.find(party => {
                return party.id.toHexString() === partyId;
            });
            if (!party) throw new Error(`Cannot find party ${partyId} in cache!`);

            const user = party.users.find(user => {
                return user.id === account.id;
            });

            if (user) throw new Error(`User ${user} in party ${partyId}!`);
            getRandomGif().then(url => {
                const user = {
                    id: account.id,
                    account: account,
                    history: [],
                    icon: url
                };
                party.users.push(user);
                debug(account.first_name + ' ' + account.last_name + ' joined ' + party.id);
                debug(party)

                return resolve(user);
            });
        })

    }

    public voteSong(account: AccountRecord, partyId: string, songId: string, vote: number, name?: string) {
        return new Promise((resolve, reject) => {
            if (vote > 1) vote = 1;
            if (vote < -1) vote = -1;
            debug(vote)
            const party = this.queue.find(party => {
                return party.id.toHexString() === partyId;
            });
            if (!party) throw new Error(`Cannot find party ${partyId} in cache!`);

            const user = party.users.find(user => {
                return user.id === account.id;
            });
            debug(party)

            if (!user) throw new Error(`Cannot find user ${account.id} in cache!`);

            const song = party.queue.find(song => {
                return song.songId === songId;
            });
            debug(song)
            const action = {
                songId: songId,
                score: vote,
                name: name || ''
            };
            if (!song) {
                if (vote == 1) {
                    party.queue.push(action);
                    user.history.push(action);
                    debug(party)
                    this.reloadQueue(party);

                    return resolve();
                }
            } else {
                user.history.push(action);
                song.score += vote;
                debug(party)
                this.reloadQueue(party);
                return resolve();
            }
        });
    }
}

function generateShortCode() {
    var text = "";
    var keyset = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 4; i++)
        text += keyset.charAt(Math.floor(Math.random() * keyset.length));

    return text;
}