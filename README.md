# ssehub-storage-redis

[![npm version](http://img.shields.io/npm/v/ssehub-storage-redis.svg?style=flat-square)](http://browsenpm.org/package/ssehub-storage-redis)[![Build Status](http://img.shields.io/travis/vgno/ssehub-storage-redis/master.svg?style=flat-square)](https://travis-ci.org/vgno/ssehub-storage-redis)[![Coverage Status](http://img.shields.io/codeclimate/coverage/github/vgno/ssehub-storage-redis.svg?style=flat-square)](https://codeclimate.com/github/vgno/ssehub-storage-redis)[![Code Climate](http://img.shields.io/codeclimate/github/vgno/ssehub-storage-redis.svg?style=flat-square)](https://codeclimate.com/github/vgno/ssehub-storage-redis/)

Redis storage for the node SSE Hub backend.

## Installing

```
npm install --save ssehub-storage-redis
```

## Basic usage

In your `ssehub-backend` installation, `config.js`:

```js
var RedisStorage = require('ssehub-storage-redis');
var redis = new RedisStorage({
    port: 6379,
    host: 'localhost',
    dbNumber: 0
});

module.exports = {
    storage: redis
};
```

## License

MIT-licensed. See LICENSE.
