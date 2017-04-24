// virtual_mta
//------------
// documentation via: `haraka -h virtual_mta`

//var outbound	= require('./outbound');
//var constants   = require('haraka-constants');
var ip          = require('ip').address(); //Main ip of local server
var host 	    = require('os').hostname().replace(/\\/, '\\057').replace(/:/, '\\072'); //Server hostname
var vmta        = null;
var cfg;

exports.register = function () {
    var plugin = this;
    plugin.load_vmta_ini();
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
exports.hook_init_master = exports.hook_init_child = function (next)  {
    server.notes.interfaces = localAddresses();
    return next();
};

exports.hook_queue_outbound = function (next, connection) {
    var plugin      = this;
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

    //outbound.send_email(connection.transaction, next);

    plugin.loginfo("----------- VMTA plugin LOG END -----------");
    plugin.loginfo("");
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