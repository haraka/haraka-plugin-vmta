// virtual_mta
//------------
// documentation via: `haraka -h virtual_mta`

//TODO: Uncomment this two lines in the real life-----
//var outbound	= require('./outbound');
//var constants = require('haraka-constants');
//------------------------------------------------
var ip          = require('ip').address(); //Main ip of local server
var host        = require('os').hostname().replace(/\\/, '\\057').replace(/:/, '\\072'); //Server hostname
var vmta        = null;
var cfg;

exports.register = function () {
    var plugin = this;

    plugin.load_vmta_ini();

    plugin.register_hook('init_master', 'init_interfaces');
    plugin.register_hook('init_child', 'init_interfaces');
    plugin.register_hook('queue_outbound', 'outbound');
    plugin.register_hook('pre_send_trans_email', 'before_send');
};

exports.load_vmta_ini = function () {
    var plugin = this;

    plugin.loginfo("VMTA configs are fully loaded from 'vmta.ini'.");

    cfg = plugin.config.get("vmta.ini", function () {
        plugin.register();
    });

    plugin.loginfo(cfg);
};

//Define localAddresses at start-up
exports.init_interfaces = function (next)  {
    server.notes.interfaces = localAddresses();
    return next();
};

exports.outbound = function (next, connection) {
    checkVmtaParams(next, this, connection);

    //Set the flag param 'vmta_checked' to avoid duplicate check in the both hooks
    connection.transaction.notes.vmta_checked = true;

    outbound.send_email(next, connection.transaction, next);

    this.loginfo("----------- VMTA plugin LOG END -----------");
    this.loginfo("");
};

exports.before_send = function (next, connection) {
    if ( !connection.transaction.notes.hasOwnProperty("vmta_checked") )
    {
        checkVmtaParams(next, this, connection);

        this.loginfo("----------- VMTA plugin LOG END -----------");
        this.loginfo("");
    }

    return next();
};

//Deny with passed message
var denyWithMsg = function (context, next, msg) {
    context.logerror(msg);
    context.loginfo("----------- VMTA plugin LOG END -----------");
    context.loginfo("");

    return next(DENY, msg);
};

//Get list of local addresses
var localAddresses = function () {
    var os = require("os");

    var interfaces = os.networkInterfaces();
    var addresses = [];

    for (var k in interfaces)
    {
        for (var k2 in interfaces[k])
        {
            var address = interfaces[k][k2];

            if (address.family === "IPv4" && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    return addresses;
};

//Check if the 'x-vmta' parameter is passed then retrieve the 'ip/host' else return the default ones
var checkVmtaParams = function (next, plugin, connection){
    var transaction = connection.transaction;

    plugin.loginfo("");
    plugin.loginfo("----------- VMTA plugin LOG START -----------");

    if ( transaction.header.headers.hasOwnProperty("x-vmta") )
    {
        //Get 'x-vmta' from the header
        vmta = transaction.header.headers["x-vmta"][0].replace("\n", "");

        //Check if The specified VMTA is defined in the config file
        if ( cfg.hasOwnProperty(vmta) )
        {
            var vmta_entry = cfg[vmta];

            //Check if the VMTA entry from the config file has the property 'ip'
            if ( vmta_entry.hasOwnProperty("ip") )
            {
                //Check if the specified ip belong to the server network interfaces
                if ( server.notes.interfaces.indexOf(vmta_entry.ip) > -1 ) {
                    connection.transaction.notes.outbound_ip = vmta_entry.ip;
                } else {
                    return denyWithMsg(plugin, next, "Please correct any configuration file errors (The specified 'ip' doesn't belong to this server).");
                }
            } else {
                return denyWithMsg(plugin, next, "Please correct any configuration file errors (The 'ip' property does not exist).");
            }


            //Check if the VMTA entry from the config file has the property 'host'
            if ( vmta_entry.hasOwnProperty("host") ) {
                connection.transaction.notes.outbound_helo = vmta_entry.host;
            } else {
                return denyWithMsg(plugin, next, "Please correct any configuration file errors (The 'host' property does not exist).");
            }

            //Remove parameter from the header
            transaction.remove_header("x-vmta");

            plugin.loginfo("'x-vmta' Found '"+vmta+"'");
        } else {
            return denyWithMsg(plugin, next, "The specified Virtual VMTA '"+vmta+"' does not exist.");
        }
    } else {
        connection.transaction.notes.outbound_ip   = ip;
        connection.transaction.notes.outbound_helo = host;

        plugin.loginfo("No 'x-vmta' Found.");
    }

    plugin.loginfo("Outbound IP : "+connection.transaction.notes.outbound_ip);
    plugin.loginfo("Outbound HOST : "+connection.transaction.notes.outbound_helo);

    //Setting the header to notes before sent, we may need it in 'delivered/bounce/deferred' hooks
    connection.transaction.notes.header = connection.transaction.header;
};