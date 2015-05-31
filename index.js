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

RedisStorage.prototype.storeMessage = function(path, msg, options, callback) {
    if (!this.client) {
        this.connect();
    }

    var db = this.client;

    // Push the message onto the list
    db.lpush(path, JSON.stringify(msg), function(err, length) {
        if (err) {
            return callback(err);
        }

        // If we have more items than allowed, pop the oldest one of the list
        if (options.maxItems && length > options.maxItems) {
            db.rpop(path, callback);
        } else {
            callback();
        }
    });
};

RedisStorage.prototype.getMessages = function(path, limit, callback) {
    if (!this.client) {
        this.connect();
    }

    this.client.lrange(path, 0, limit - 1, function(err, items) {
        if (err) {
            return callback(err);
        }

        callback(null, items.map(JSON.parse));
    });
};

module.exports = RedisStorage;
