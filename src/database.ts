import { MongoClient, Db, ObjectId } from 'mongodb';

const debug = require('debug')('app:database');

export class Database {
    private db?: Db
    constructor(connectionString: string) {
        MongoClient.connect(connectionString, { useNewUrlParser: true }, (err, client) => {
            if (err) throw new Error(err.message);
            this.db = client.db();
            // this.db.createIndex('Accounts', 'username', { unique: true }, () => debug('index created')); // Ensure that usernames are unique
            // this.db.createIndex('Tokens', 'token', { unique: true }, () => debug('index created')); // Ensure that generated tokens are unique
            // this.db.createIndex('Tokens', 'created', { expireAfterSeconds: 60 * 10 }, () => debug('index created')); // Expire tokens after 10 min
        });
    }

    public verifyAccount(token: string) {
        return new Promise<AccountRecord | null>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initilized!');
           
            this.db.collection('users').findOne({ "token": token }).then(result => {
                if (!result) {
                    debug('could not find account');
                    return resolve(null);
                } else {
                    return resolve(this.mapAccount(result));
                }
            });
        });
    }

    private mapAccount(account: any): AccountRecord {
        return {
            id: account.owner_id,
            spotifyAccessToken: account.spotifyAccessToken,
            spotifyUserId: account.spotifyUserId,
            ...account.user
        }
    }

}

export interface AccountRecord {
    id: string;
    picture: string;
    birthday: string;
    email: string;
    name: string;
    token: string;
    first_name: string;
    last_name: string;
    spotifyUserId: string;
    spotifyAccessToken: string;
}