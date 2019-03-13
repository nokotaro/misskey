Guide d'installation et de configuration de twista
================================================================

Nous vous remerçions de l'intrêt que vous manifestez pour l'installation de votre propre instance twista !
Ce guide décrit les étapes à suivre afin d'installer et de configurer une instance twista.

[La version en japonnais est également disponible sur - 日本語版もあります](./setup.ja.md)

----------------------------------------------------------------

*1.* Création de l'utilisateur twista
----------------------------------------------------------------
Executer twista en tant que super-utilisateur étant une mauvaise idée, nous allons créer un utilisateur dédié.
Sous Debian, par exemple :

```
adduser --disabled-password --disabled-login twista
```

*2.* Installation des dépendances
----------------------------------------------------------------
Installez les paquets suivants :

#### Dépendences :package:
* **[Node.js](https://nodejs.org/en/)** >= 10.0.0
* **[MongoDB](https://www.mongodb.com/)** >= 3.6

##### Optionnels
* [Redis](https://redis.io/)
  * Redis est optionnel mais nous vous recommandons vivement de l'installer
* [Elasticsearch](https://www.elastic.co/) - requis pour pouvoir activer la fonctionnalité de recherche
* [FFmpeg](https://www.ffmpeg.org/)

*3.* Paramètrage de MongoDB
----------------------------------------------------------------
En root :
1. `mongo` Ouvrez le shell mongo
2. `use twista` Utilisez la base de données twista
3. `db.createUser( { user: "twista", pwd: "<password>", roles: [ { role: "readWrite", db: "twista" } ] } )` Créez l'utilisateur twista.
4. `exit` Vous avez terminé !

*4.* Installation de twista
----------------------------------------------------------------
1. `su - twista` Basculez vers l'utilisateur twista.
2. `git clone https://github.com/346design/twista.283.cloud.git twista` Clonez du dépôt twista.
3. `cd twista` Accédez au dossier twista.
4. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)` Checkout sur le tag de la [version la plus récente](https://github.com/346design/twista.283.cloud/releases/latest)
5. `npm install` Installez les dépendances de twista.

*5.* Création du fichier de configuration
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` Copiez le fichier `.config/example.yml` et renommez-le`default.yml`.
2. Editez le fichier `default.yml`

*6.* Construction de twista
----------------------------------------------------------------

Construisez twista comme ceci :

`NODE_ENV=production npm run build`

Si vous êtes sous Debian, vous serez amené à installer les paquets `build-essential` et `python`.

Si vous rencontrez des erreurs concernant certains modules, utilisez node-gyp:

1. `npm install -g node-gyp`
2. `node-gyp configure`
3. `node-gyp build`
4. `NODE_ENV=production npm run build`

*7.* C'est tout.
----------------------------------------------------------------
Excellent ! Maintenant, vous avez un environnement prêt pour lancer twista

### Lancement conventionnel
Lancez tout simplement `NODE_ENV=production npm start`. Bonne chance et amusez-vous bien !

### Démarrage avec systemd

1. Créez un service systemd sur : `/etc/systemd/system/twista.service`
2. Editez-le puis copiez et coller ceci dans le fichier :

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

3. `systemctl daemon-reload ; systemctl enable twista` Redémarre systemd et active le service twista.
4. `systemctl start twista` Démarre le service twista.

Vous pouvez vérifier si le service a démarré en utilisant la commande `systemctl status twista`.

### Méthode de mise à jour vers la plus récente version de twista
1. `git fetch`
2. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)`
3. `npm install`
4. `NODE_ENV=production npm run build`
5. Consultez [ChangeLog](../CHANGELOG.md) pour les information de migration.

----------------------------------------------------------------

Si vous rencontrez des difficultés ou avez d'autres questions, n'hésitez pas à nous contacter !
