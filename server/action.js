const ACTION = {
    ROOM_JOIN: 'room:join',
    USER_JOIN: 'user:join',
    USER_CALL: 'user:call',
    INCOMING_CALL: 'incoming:call',
    CALL_ACCEPTED: 'call:accepted',
    SEND_STREAM: 'send:stream',
    SEND_TEXT_MESSAGE: 'send:text:message',
    RECIEVE_TEXT_MESSAGE: 'recieve:text:message',
    SEND_OWN_ID: 'send:own:id',
    RECIEVE_USER_ID: 'recieve:user:id',
    VOICE_ROOM_JOIN: 'voice:room:join',
    VOICE_USER_JOIN: 'voice:user:join',
    VOICE_SEND_OWN_ID: 'voice:send:own:id',
    VOICE_RECIVE_USER_ID: 'voice:recieve:use:id',
    HANLE_MUTE_INFO: 'handle:mute:info',
    ROOM_FULL: 'room:full',
    LEAVE: 'leave',
    ROOM_FULL: 'room:full'
}
module.exports = ACTION;