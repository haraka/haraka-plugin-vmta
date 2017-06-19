VMTA
========

[![Build Status][ci-img]][ci-url]
[![GitHub license][gitHub-license-img]][gitHub-license-url]
[![Code Climate][clim-img]][clim-url]
[![NPM Version][version-img]][version-url]

[![NPM][npm-img]][npm-url]

The VMTA plugin gives the HARAKA users the ability to add/administer as many virtual
 MTAs (IP/host) as they need, allowing them to create enormous potential sending.

## Installation

All you need is enabling the plugin inside the `config/plugins` file by adding a new
line contains the plugin name `vmta`.

## Configuration

First of all you should create the config file `config/vmta.ini`, then you could simply
 add the virtual MTA information as the sample bellow shown :

```
[mta_name_1]
ip = IP_1
host = HOST_1

[mta_name_2]
ip = IP_2
host = HOST_2
```

Every Virtual MTA has an identifier `name` and two required entries : 

* `ip` : Contains the local address ip to be assigned.
* `host` : Contains the custom domain that will be sent with the `ip`.

**NB:** The specified `ips` in the config file should be configured as a local ips in the current
server, else the plugin will throw an exception (`The specified 'ip' doesn't belong to this
 server`).
 

## Usage

You could send every email with specific/customized VMTA ('IP/HOST') just by
assigning your emails to the appropriate VMTA by adding the `x-vmta` header to your
emails (The value of `x-vmta` parameter should be pre-defined in the config file),
e.g :


```
Subject: xxxx
From: yyyy
...
x-vmta: mta_name_1       <<-------- Just add the param to your header
...
```


The `mta_name_1` in the previous example is one of the VMTAs you should pre-define in
your configuration file `vmta.ini` with simple format as shown in the above section
'Configuration'.


## Tests
After enabling the plugin you could test it simply by using the smtp transaction tester
light-tool `swaks` using the following command line :

swaks -f youremail@yourdomain.com -t test@example.com -add-header "x-vmta: your_vmta_name"  \
  -s localhost -p 587 -au testuser -ap testpassword


## NOTE
The passed parameter `x-vmta` will be automatically removed from the header so the
delivered email's header will not contain the parameter.

[ci-img]: https://travis-ci.org/haraka/haraka-plugin-vmta.svg
[ci-url]: https://travis-ci.org/haraka/haraka-plugin-vmta
[clim-img]: https://codeclimate.com/github/acharkizakaria/haraka-plugin-vmta/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/acharkizakaria/haraka-plugin-vmta
[gitHub-license-img]: https://img.shields.io/badge/license-MIT-blue.svg
[gitHub-license-url]: https://raw.githubusercontent.com/acharkizakaria/haraka-plugin-vmta/master/LICENSE
[npm-img]: https://nodei.co/npm/haraka-plugin-vmta.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-vmta
[version-img]: https://img.shields.io/badge/npm-v0.0.6-blue.svg
[version-url]: https://www.npmjs.com/package/haraka-plugin-vmta