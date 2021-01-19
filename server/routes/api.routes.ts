import express from 'express'

const router = express.Router()

router.get('/douban/:id', (_, res) => res.send('Hello Douban API'))

export default router
