require('dotenv').config();

const Koa = require('koa');

const startServer = async () => {
    const app = new Koa();

    app.use(async (ctx, next) => {
        await new Promise(resolve => {
            const data = [];
            ctx.req
                .on('data', chunk => {
                    data.push(chunk);
                })
                .on('end', () => {
                    ctx.request.body = Buffer.concat(data).toString();
                    resolve();
                });
        });

        await next();
    });

    app.use(async ctx => {
        console.log(ctx.headers);
        ctx.body = `I'm the upstream server :)

            I got this Host header:
            ${ctx.headers.host}

            I got this Authorization header:
            ${ctx.headers.authorization}
        `;

        if (ctx.request.body) {
            ctx.body += `

            I got this request body:
            ${ctx.request.body}
            `;
        }
    });

    app.listen(3002);
    console.log('Server started on port 3002');
};

startServer();
