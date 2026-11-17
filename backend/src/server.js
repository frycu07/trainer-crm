// modul konfiguracji jako pierwszy - przy zlej konfiguracji aplikacja konczy sie tutaj (fail fast)
const config = require("./config");
const { createApp } = require("./app");

const app = createApp({ config });

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
