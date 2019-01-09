require('dotenv').config();

const Koa = require('koa');

const startServer = async () => {
    const app = new Koa();
    app.use(async (ctx, next) => {
        console.log(ctx.headers);
        ctx.body = `I'm the upstream server :)

            I got this Authorization header:
            ${ctx.headers.authorization}
        `;

        await next();
    });

    app.listen(3002);
    console.log('Server started on port 3002');
};

startServer();
