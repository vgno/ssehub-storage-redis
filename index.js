'use strict';

var redis = require('redis');
var util = require('util');
var events = require('events');

function RedisStorage(config) {
    this.config = config;
}

util.inherits(RedisStorage, events.EventEmitter);

RedisStorage.prototype.connect = function(callback) {
    if (!this.client) {
        this.client = redis.createClient(
            this.config.port,
            this.config.host,
            this.config.options
        );

        this.client.on('error', function(e) {
            this.emit('error', e);
        }.bind(this));

        if (this.config.dbNumber !== 0) {
            this.client.select(this.config.dbNumber, callback);
            return this.client;
        }
    }

    if (callback) {
        process.nextTick(callback);
    }

    return this.client;
};

RedisStorage.prototype.storeMessage = function(path, msg, maxItems, callback) {
    if (!this.client) {
        this.connect();
    }

    // Push the message onto the list
    this.client.lpush(path, JSON.stringify(msg), function(err, length) {
        if (err) {
            return callback(err);
        }

        // If we have more items than allowed, pop the oldest one of the list
        if (length > maxItems) {
            this.client.rpop(path, callback);
        } else {
            callback();
        }
    }.bind(this));
};

RedisStorage.prototype.getMessages = function(path, since, callback) {
    if (!this.client) {
        this.connect();
    }

    if (typeof since === 'function' && !callback) {
        callback = since;
        since = null;
    }

    this.client.lrange(path, 0, -1, function(err, items) {
        if (err) {
            return callback(err);
        }

        items = items.map(JSON.parse);

        callback(null, since ? items.filter(function(item) {
            return item.id > since;
        }) : items);
    });
};

module.exports = RedisStorage;
