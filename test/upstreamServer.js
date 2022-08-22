/* eslint-disable no-console */
require('dotenv').config();

const Koa = require('koa');

const startServer = async () => {
    const app = new Koa();

    app.use(async (ctx, next) => {
        await new Promise((resolve) => {
            const data = [];
            ctx.req
                .on('data', (chunk) => {
                    data.push(chunk);
                })
                .on('end', () => {
                    ctx.request.body = Buffer.concat(data).toString();
                    resolve();
                });
        });

        await next();
    });

    app.use(async (ctx) => {
        console.log(ctx.headers);
        let content = `
            <h2>I'm the upstream server :)</h2>

            <h3>I got this Host header:</h3>
            <pre>${ctx.headers.host}</pre>

            <h3>I got this Authorization header:</h3>
            <pre>${ctx.headers.authorization}</pre>
        `;

        if (ctx.request.body) {
            content += `
                <h3>I got this request body:</h3>
                <pre>${ctx.request.body}</pre>
            `;
        }

        ctx.body = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                <!-- Content Security Policy blocks inline execution of scripts and stylesheets -->
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css" media="print" onload="this.media='all'" />
                <!-- Content Security Policy blocks inline execution of scripts and stylesheets -->
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    });

    app.listen(3002);
    console.log('Server started on port 3002');
};

startServer();
