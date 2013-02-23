# resurrected/hacked from https://github.com/github/hubot/blob/f5c2bedcaeb70b7276efb7b2dbe27779cf0a3058/src/hubot/groupme.coffee

{Adapter,Robot,TextMessage} = require 'hubot'
HTTPS = require 'https'
UUID  = require 'node-uuid'

class GroupMeBot extends Adapter

  # Public: Raw method for sending data back to the chat source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings  - One or more Strings for each message to send.
  #
  # Returns nothing.
  send: (user, strings...) ->
    strings.forEach (str) =>
      # disabling image upload until I get the basic stuff together
      #if str.match(/(png|jpg)$/i)
      #  @upload_image str, (url) =>
      #    @send_message picture_url: url
      #else
      #  @send_message text:str
      @send_message text:str

  # Public: Raw method for building a reply and sending it back to the chat
  # source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings - One or more Strings for each reply to send.
  #
  # Returns nothing.
  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  # Public: Raw method for setting a topic on the chat source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings - One more more Strings to set as the topic.
  #
  # Returns nothing.
  topic: (envelope, strings...) ->
    @send(envelope, strings)
    # ^^ I guess we'll just do that for now

  # Public: Raw method for invoking the bot to run. Extend this.
  #
  # Returns nothing.
  run: ->
    @room_id = process.env.HUBOT_GROUPME_ROOM
    @token   = process.env.HUBOT_GROUPME_TOKEN

    @timer = setInterval =>
      @fetch_messages (messages) =>
        messages = messages.sort (a, b) ->
          -1 if a.created_at < b.created_at
          1 if a.created_at > b.created_at
          0

        # this is a hack, but basically, just assume we get messages in linear time
        # I don't want to RE GroupMe's web push API right now.
        for msg in messages
          if msg.created_at <= @newest_time
            continue

          @newest_time = msg.created_at

          if msg.text #and (msg.created_at * 1000) > new Date().getTime() - 5*1000 # I don't know what this did...
            console.log "#{msg.name}: #{msg.text}"
            @receive new TextMessage msg.name, msg.text
    , 2000

    @emit 'connected'

  # Public: Raw method for shutting the bot down. Extend this.
  #
  # Returns nothing.
  close: ->
    clearInterval(@timer)

  send_message: (msg) ->
    json = JSON.stringify(message: msg)
    json.source_guid = UUID.v1()

    options =
      agent: false
      host: 'v2.groupme.com'
      port: 443
      method: 'POST'
      path: "/groups/#{@room_id}/messages"
      headers:
        'Content-Length': json.length
        'Content-Type': 'application/json'
        'Accept': 'application/json, text/javascript',
        'Accept-Charset': 'ISO-8859-1,utf-8',
        'Accept-Language': 'en-US',
        'Origin': 'https://web.groupme.com',
        'Referer': "https://web.groupme.com/groups/#{@room_id}",
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.45 Safari/537.22',
        'X-Access-Token': @token

    request = HTTPS.request options, (response) ->
      data = ''
      response.on 'data', (chunk)-> data += chunk
      response.on 'end', ->
        console.log(data)
    request.end(json)

  fetch_messages: (cb) =>
    options =
      agent: false
      host: 'v2.groupme.com'
      port: 443
      method: 'GET'
      path: "/groups/#{@room_id}/messages"
      headers: {
        'Accept': 'application/json, text/javascript',
        'Accept-Charset': 'ISO-8859-1,utf-8',
        'Accept-Language': 'en-US',
        'Content-Type': 'application/json',
        'Origin': 'https://web.groupme.com',
        'Referer': "https://web.groupme.com/groups/#{@room_id}",
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.45 Safari/537.22',
        'X-Access-Token': @token
      }

    request = HTTPS.request options, (response) =>
      data = ''
      response.on 'data', (chunk) -> data += chunk
      response.on 'end', =>
        if data
          json = JSON.parse(data)
          cb(json.response.messages)
    request.end()

exports.use = (robot) ->
  new GroupMeBot robot
