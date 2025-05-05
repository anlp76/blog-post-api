const express = require('express')
const cors = require('cors')
const postRoutes = require('./routes/posts')
const config = require('./config.json')

const app = express()
const PORT = config.port

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/posts', postRoutes)
app.use('/assets', express.static('assets'));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})