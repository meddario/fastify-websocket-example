const path = require("path");

const mq = require("mqemitter");
const emitter = mq({ concurrency: 5 });

const fastify = require("fastify")({ logger: true });

async function setupFastify() {
  await fastify.register(require("fastify-websocket"));

  await fastify.register(require("fastify-static"), {
    root: path.join(__dirname, "public"),
  });

  await fastify.register(async (instance, _opts, _done) => {
    instance.get(
      "/events",
      { websocket: true },
      (connection /* SocketStream */, req /* FastifyRequest */) => {
        let messageListener;

        connection.socket.on("message", (message) => {
          const { meta, room, participant, payload } = JSON.parse(message);
          console.log("received message", { meta, room, participant, payload });

          switch (meta) {
            case "join":
              // Activate a new message listener
              messageListener = (event, done) => {
                if (
                  event.room == room &&
                  (event.broadCast || event.participant == participant)
                ) {
                  connection.socket.send(
                    JSON.stringify({ meta: event.meta, payload: event.payload })
                  );
                }

                done();
              };

              emitter.on("room-event", messageListener);

              connection.socket.send(
                JSON.stringify({
                  meta: "room-joined",
                  room,
                  participant,
                })
              );
              break;

            case "send-message":
              // Use the emitter to broadcast the message to the room participants
              emitter.emit({
                topic: "room-event",
                meta: "send-message",
                room,
                broadCast: true,
                payload,
              });
              break;

            default:
              break;
          }
        });
        connection.socket.on("close", () => {
          console.log("removing message listener", { messageListener });

          if (messageListener) {
            emitter.removeListener("room-event", messageListener);
          }
        });
      }
    );
  });

  await fastify.ready();
  await fastify.listen(process.env.PORT || 3000, "0.0.0.0");
}

(async () => {
  try {
    await setupFastify();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
