twista Setup and Installation Guide
================================================================

We thank you for your interest in setting up your twista server!
This guide describes how to install and setup twista.

[Japanese version also available - 日本語版もあります](./setup.ja.md)

----------------------------------------------------------------

*1.* Create twista user
----------------------------------------------------------------
Running twista as root is not a good idea so we create a user for that.
In debian for exemple :

```
adduser --disabled-password --disabled-login twista
```

*2.* Install dependencies
----------------------------------------------------------------
Please install and setup these softwares:

#### Dependencies :package:
* **[Node.js](https://nodejs.org/en/)** >= 10.0.0
* **[MongoDB](https://www.mongodb.com/)** >= 3.6

##### Optional
* [Redis](https://redis.io/)
  * Redis is optional, but we strongly recommended to install it
* [Elasticsearch](https://www.elastic.co/) - required to enable the search feature
* [FFmpeg](https://www.ffmpeg.org/)

*3.* Setup MongoDB
----------------------------------------------------------------
As root:
1. `mongo` Go to the mongo shell
2. `use twista` Use the twista database
3. `db.createUser( { user: "twista", pwd: "<password>", roles: [ { role: "readWrite", db: "twista" } ] } )` Create the twista user.
4. `exit` You're done!

*4.* Install twista
----------------------------------------------------------------
1. `su - twista` Connect to twista user.
2. `git clone https://github.com/346design/twista.283.cloud.git twista` Clone the twista repo.
3. `cd twista` Navigate to twista directory
4. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)` Checkout to the [latest release](https://github.com/346design/twista.283.cloud/releases/latest)
5. `npm install` Install twista dependencies.

*5.* Configure twista
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` Copy the `.config/example.yml` and rename it to `default.yml`.
2. Edit `default.yml`

*6.* Build twista
----------------------------------------------------------------

Build twista with the following:

`NODE_ENV=production npm run build`

If you're on Debian, you will need to install the `build-essential`, `python` package.

If you're still encountering errors about some modules, use node-gyp:

1. `npm install -g node-gyp`
2. `node-gyp configure`
3. `node-gyp build`
4. `NODE_ENV=production npm run build`

*7.* That is it.
----------------------------------------------------------------
Well done! Now, you have an environment that run to twista.

### Launch normally
Just `NODE_ENV=production npm start`. GLHF!

### Launch with systemd

1. Create a systemd service here: `/etc/systemd/system/twista.service`
2. Edit it, and paste this and save:

```
[Unit]
Description=twista daemon

[Service]
Type=simple
User=twista
ExecStart=/usr/bin/npm start
WorkingDirectory=/home/twista/twista
Environment="NODE_ENV=production"
TimeoutSec=60
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=twista
Restart=always

[Install]
WantedBy=multi-user.target
```

3. `systemctl daemon-reload ; systemctl enable twista` Reload systemd and enable the twista service.
4. `systemctl start twista` Start the twista service.

You can check if the service is running with `systemctl status twista`.

### How to update your twista server to the latest version
1. `git fetch`
2. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)`
3. `npm install`
4. `NODE_ENV=production npm run build`
5. Check [ChangeLog](../CHANGELOG.md) for migration information
6. Restart your twista process to apply changes
7. Enjoy

----------------------------------------------------------------

If you have any questions or troubles, feel free to contact us!
