'use strict';

var runAfter = require('lodash.after');
var merge = require('lodash.merge');
var expect = require('chai').expect;
var RedisStorage = require('../');
var redis = require('redis');

var config = {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    dbNumber: 15
};

describe('redis storage', function() {
    var storage;

    beforeEach(function() {
        storage = new RedisStorage(config);
    });

    afterEach(function(done) {
        var client = redis.createClient(
            config.port,
            config.host
        );

        client.select(config.dbNumber, function() {
            client.flushdb();
            done();
        });
    });

    it('implicitly connects', function(done) {
        storage.getMessages('/some/path', function(err) {
            failOnError(err);
            done();
        });
    });

    it('can explicitly be told to connect', function(done) {
        storage.connect();
        storage.getMessages('/some/path', function(err) {
            failOnError(err);
            done();
        });
    });

    it('calls callback on connect', function(done) {
        storage.connect(done);
    });

    it('only connects once', function(done) {
        var client1 = storage.connect();
        var client2 = storage.connect();
        var client3 = storage.connect(done);

        expect(client1).to.equal(client2);
        expect(client1).to.equal(client3);
    });

    it('doesnt select a database if db 0 is specified', function(done) {
        var store = new RedisStorage(merge({}, config, { dbNumber: 0 }));
        store.connect(done);
    });

    it('can set and get messages', function(done) {
        var path = '/some/path';
        storage.storeMessage(path, { data: 'foobar' }, {}, function(err) {
            failOnError(err);

            storage.getMessages(path, null, function(getErr, msgs) {
                failOnError(getErr);
                expect(msgs).to.have.length(1);
                expect(msgs[0].data).to.equal('foobar');
                done();
            });
        });
    });

    it('doesnt blow up if storeMessage is called after explicitly connecting', function(done) {
        var path = '/some/path';
        storage.connect();
        storage.storeMessage(path, { data: 'foobar' }, {}, function(err) {
            failOnError(err);
            done();
        });
    });

    it('doesnt blow up if getMessages is called after explicitly connecting', function(done) {
        var path = '/some/path';
        storage.connect();
        storage.getMessages(path, function(err) {
            failOnError(err);
            done();
        });
    });

    it('can filter messages since a given ID', function(done) {
        var path = '/some/path', id = 0;

        while (++id < 50) {
            storage.storeMessage(path, { id: id, data: 'Message #' + id }, 500, failOnError);
        }

        storage.getMessages(path, 40, function(err, messages) {
            failOnError(err);
            expect(messages).to.have.length(9);
            expect(messages[0].data).to.equal('Message #49');
            expect(messages[8].data).to.equal('Message #41');
            done();
        });
    });

    it('lifts client errors events to storage error events', function(done) {
        var err = new Error('Some error');

        storage.on('error', function(liftedError) {
            expect(liftedError).to.equal(err);
            done();
        });

        storage.connect().emit('error', err);
    });

    it('caps at the maximum given history length', function(done) {
        var path = '/some/path', id = 0;

        var checkMsgs = runAfter(50, function() {
            storage.getMessages(path, function(err, messages) {
                failOnError(err);
                expect(messages).length.to.be(5);
                done();
            });
        });

        while (++id <= 50) {
            storage.storeMessage(path, { id: id, data: 'Message #' + id }, { maxItems: 5 }, checkMsgs);
        }
    });
});

function failOnError(err) {
    expect(err).to.not.be.ok;
}
