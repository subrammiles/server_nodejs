// Run: node 13-express-basics/server.js
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => console.log(`http://localhost:${port}`));
