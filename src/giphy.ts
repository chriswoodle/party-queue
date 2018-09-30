const GphApiClient = require('giphy-js-sdk-core')
const settings = require('../settings.json');
const client = GphApiClient(process.env.GIPHY_API_KEY || settings.giphy_api_key)
const debug = require('debug')('app:giphy');

export function getRandomGif(): Promise<string> {
    return client.random('gifs', {}).then((response: any) => {
        return Promise.resolve(response.data.url);
    })
}
