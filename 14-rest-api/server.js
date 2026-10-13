// Run: node 14-rest-api/server.js   then open http://localhost:3000/docs
import { createApp } from './src/app.js';

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => console.log(`API on http://localhost:${port}/api/courses, docs on http://localhost:${port}/docs`));
