// modul konfiguracji jako pierwszy - przy zlej konfiguracji aplikacja konczy sie tutaj (fail fast)
const config = require("./config");
const { createDb } = require("./db/knex");
const eventBus = require("./events/eventBus");
const { createApp } = require("./app");

const db = createDb(config);
const app = createApp({ config, db, eventBus });

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
