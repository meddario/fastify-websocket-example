# Fastify websocket example

Demo repo using [fastify-websocket](https://github.com/fastify/fastify-websocket) to implement a simple chat. The code is not meant to be production ready, it's just a simple example meant for discussion.

## Startup

Tested on node 17+.

```sh
npm install

npm run dev # to autoreload the server with nodemon
```

## Client-Server interaction

- Client opens a WebSocket connection and "joins" room as a participant.
- The server creates an event listener callback for the client and binds it to a `room-event` topic. The handler filters the events that should go to a room (or a specific participant in a room).
- The client can now start to send messages to the other room participants.
- When the server receives a new message, it emits it through the emitter, in order to trigger the receivers and send the messages to the correct WebSockets.
