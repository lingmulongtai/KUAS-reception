#!/usr/bin/env node
/*
 * serve.js — ローカル配信用の静的サーバー（依存パッケージなし）
 *
 * locales/*.json を fetch で読み込む都合上、file:// では動かないため
 * このサーバー経由で開く。外部への通信は一切行わない。
 *
 *   node serve.js            → http://127.0.0.1:5173
 *   node serve.js 8080       → ポート指定
 *   node serve.js 8080 all   → LAN 内の他端末（iPad 等）からも接続可
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5173;
const HOST = process.argv[3] === 'all' ? '0.0.0.0' : '127.0.0.1';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const server = http.createServer((req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(url.parse(req.url).pathname);
    } catch (e) {
        res.writeHead(400).end('Bad Request');
        return;
    }
    if (pathname === '/') pathname = '/index.html';

    // ディレクトリトラバーサル対策
    const filePath = path.join(ROOT, path.normalize(pathname));
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, 'index.html')) {
        res.writeHead(403).end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
            return;
        }
        res.writeHead(200, {
            'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log('KUAS Reception (ローカル専用)');
    console.log('  → http://127.0.0.1:' + PORT);
    if (HOST === '0.0.0.0') {
        const nets = require('os').networkInterfaces();
        Object.values(nets).flat().forEach((n) => {
            if (n && n.family === 'IPv4' && !n.internal) {
                console.log('  → http://' + n.address + ':' + PORT + '  (LAN)');
            }
        });
    }
    console.log('\n停止するには Ctrl+C');
});
