import { buildApp } from './app'
import { config } from './config'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: config.PORT, host: config.HOST })
    app.log.info(`Server running on http://${config.HOST}:${config.PORT}`)
    app.log.info(`API docs: http://localhost:${config.PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
