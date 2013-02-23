# hubot-groupme-http

Connect Hubot to a GroupMe group, using GroupMe's (undocumented, not-really-public) HTTP(S) API.

## Limitations

* Right now, this only supports being in one GroupMe group.
* And it'll need to piggyback on someone else's GroupMe account, because you need a phone number to sign up for GroupMe.

### Alternative

Probably a better choice: see [jkarmel/hubot-groupme](https://github.com/jkarmel/hubot-groupme), which requires a (paid-for, but inexpensive) [Twilio account](http://www.twilio.com/sms/pricing).

## Setup

Add this repo as a dependency of your Hubot repo: `"hubot-groupme-http": "git://github.com/cdzombak/hubot-groupme-http.git#master"`

And `npm install`.

### Configuration

Two environment variables must be set:

* `HUBOT_GROUPME_ROOM`
* `HUBOT_GROUPME_TOKEN`

See [Finding Your Access Token](https://github.com/cdzombak/groupme-tools/blob/master/README.md#finding-your-access-token) and [Finding Your Group ID](https://github.com/cdzombak/groupme-tools/blob/master/README.md#finding-your-group-id).

## TODO

* fix/allow sending ಠ_ಠ chars from scripts
* multi-group support
* eventually: upload_image, per [this script](https://github.com/github/hubot/blob/f5c2bedcaeb70b7276efb7b2dbe27779cf0a3058/src/hubot/groupme.coffee#L33)
