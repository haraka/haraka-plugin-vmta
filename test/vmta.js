// node.js built-in modules
var assert   = require('assert');

// npm modules
var fixtures = require('haraka-test-fixtures');

//Default config
var default_config = {
    main: {},
    mta1: { ip: "1.1.1.1", host: "host1" },
    mta2: { ip: "2.2.2.2", host: "host2" }
};

beforeEach(function (done) {
    //this.outbound = new fixtures.plugin('outbound');
    this.plugin = new fixtures.plugin('index');
    this.plugin.cfg = default_config;

    this.connection = new fixtures.connection.createConnection();
    this.connection.transaction = fixtures.transaction.createTransaction();

    done();  // if a test hangs, assure you called done()
});

describe('VMTA plugin', function () {
    it('load', function (done) {
        assert.ok(this.plugin);
        done();
    });
});

var next = function () {
    test.equal(undefined, arguments[0]);
    test.done();
};

describe('VMTA config file', function () {
    it('loads "vmta.ini" from "config/vmta.ini"', function (done) {
        this.plugin.load_vmta_ini();

        assert.ok(this.plugin.cfg);

        done();
    });

    it('Check availability of "x-vmta" inside Header', function (done) {
        this.connection.transaction.header.add('x-vmta', "vmta_test");

        assert.ok( this.connection.transaction.header.headers['x-vmta'] );
        done();
    });

    it('Check availability of "mta1" inside Config file', function (done) {
        assert.ok(this.plugin.cfg.mta1);
        done();
    });
    //console.log(this.plugin.localAddresses());

});