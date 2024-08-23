<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

<span align="center">

# Homebridge Virtual Switches

</span>

> [!IMPORTANT]  
> **Homebridge v2.0 Information**
> 
> This plugin is Homebridge v2.0 ready and requires node.js v20.14.12 or higher.
> (for information on how to upgrade node.js, see https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js/)
> 

---
The plugin aims to act as an automated attendent that monitors any log file (defaults to the Homebridge log file) for the appearance of certain keywords or key phrases. Occurence of one of these will trigger a virtual switch (stateful or not) to be switched on. This can be helpful in advanced Homekit automations. 
E.g., the loss an api authentication of a plugin can break the automation. The log message  line that alerts of a loss of authentication is used as the key phrase for triggering virtual switch. A Homekit automation can then be set up to sent an alert (Pushover message, blinking light, etc.) This virtual switch can of the mpcan be used as a base to help you get started developing your own plugin.

Additional packages information needed:
The plugin will not correctly function when monitoring the homebridge log file if the packages: strip-ansi and child_process are not loaded.

### Setup

Every switch is named and is normally open (turned off) and set to either remain closed (check 'stateful') or open after a set time (Timer) (in milliseconds).
The log file path defaults to the Homebridge log file location.
Keywords or key phrases to monitor must be entered between singl quotation marks (' '). If multiple keyword/phrases are to trigger the switch, these must be separated by a comma (,). The spelling of the keywords/phrases must be spelled exactly as the plugins write them to the log file. The plugin ignores upper/lower case.
Check 'Enable Startup Delay' in case the plugin can only start monitoring once a certain time (Startup Delay (in milliseconds)) after Homebridge (re-)started.

Multiple switches with multiple keywords/phrase can be set up.


### Operation

The switches are either stateful or not. Occurence of one or more keywords/phrases will trigger the corresponding switch to come on.
- If the switch is stateful, re-occurrence of a keyword/phrase will not change the switch (i.e., it was on and it will stay on)
- If the switch is not stateful, re-occurrence of a keyword/phrase will reset the timer before the switch to open (turn off) again. Once the timer has run down, the switch will open (turn off) again.
  

### Found a bug?

If you think you've found a bug, please first read through the open Issues. If you're confident it's a new bug, go ahead and create a new GitHub issue. Be sure to include as much information as possible  and be patient.

