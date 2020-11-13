const Koa = require('koa')
const path = require('path')
const serve = require('koa-static')
const app = new Koa();

const index = serve(path.join(__dirname) + '/src')

app.use(index)
app.listen(8000)
console.log('启动成功')
