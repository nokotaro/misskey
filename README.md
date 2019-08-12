twista
==

twista is a fork project of [Misskey](https://github.com/syuilo/misskey).

Changes
--

* Add *THE IDOLM@STER* flavored features
	* Add *Futaba Anzu bot*
* Extend note resolver and federation resolver
	* Add @everyone actor
	* Add @info actor
	* Support auto detecting quotation
	* Support Mastodon mirror posting
	* Support organization actor
	* Support Twitter pseudo activities
* Redesigned font familiy selections
	* Use *A-OTF Midashi Go MB31 Pr6N* in default titles
	* Use *A-OTF Midashi Mi MA31 Pr6N* in serif titles
	* Use *A-OTF UD Shin Go Pr6N* in default texts
	* Use *Font Awesome 5 Pro Light* in icons
	* Use *FOT-Rodin ProN* in bold texts
	* Use *Kan412Typos Std* in tag cloud
	* Use *VDL-V7Mincho* in serif texts
* Redesigned MFM (called Mochimochi Fuwafuwa Markup)
	* Add avatar emoji syntax
	* Add bubble syntax
	* Add list syntax (WIP: unsupported in production)
	* Add niconico link syntax
	* Add OpenType flag tag
	* Add ruby tag
	* Add serif syntax
	* Add stamp syntax
	* Add user custom emoji syntax (WIP: unsupported in production)
	* Update many of syntaxes in MFM (Misskey Flavored Markdown)
	* Update title syntax style
* Redesigned post form
	* Add broadcast input
	* Add rating chooser
	* Move visibility chooser to post button
	* Remove geo-location embeds
* Redesigned reaction picker (called baum picker)
	* Add a happy effect in ta-da
	* Add recent custom reaction button
	* Use doughnut shaped popover
* Redesigned search
	* Use MeCab/NEologd for indexing texts
	* Support some queries
* Redesigned tag cloud
	* Add link in tags
	* Be now loginned users also can see tag cloud
	* Support fullscreen tag cloud
	* Update colors
	* Update fonts
	* Update tag cloud generation rule
* Redesigned timelines
	* Add *THE IDOLM@STER* timeline
	* Update naming of social timeline to home+local timeline
* Redesigned user interfaces
	* Add happy birthday effects
	* Update default themes
	* Update icons
	* Update sizes
	* Update styles

(Some external changes from [Meisskey](https://mei23.github.io/misskey_m544_diff.html))
