const { EventEmitter } = require("node:events");

// jedna wspolna instancja - service emituje zdarzenia, listenery je odbieraja
module.exports = new EventEmitter();
