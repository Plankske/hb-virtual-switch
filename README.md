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
The plugin aims to act as an automated attendent that monitors any log file (defaults to the Homebridge log file) for the appearance of certain keywords or key phrases. Occurence of one of these will trigger a virtual switch (normally open or normally closed, stateful or not) to be switched on. This can be helpful in advanced Homekit automations. 
E.g., the loss an api authentication of a plugin can break the automation. The log message  line that alerts of a loss of authentication is used as the key phrase for triggering virtual switch. A Homekit automation can then be set up to e.g. send an alert (Pushover message, warning light, siren, etc.) 
Besides, the plugin provide the possibility of creating a virtual switches that are not triggered by the Homebridge log file. The use of virtual switches is crucial in nthe developemt of advanced Homekit automations.

### Setup
Additional packages information needed:
The plugin will not correctly function when monitoring the homebridge log file if the packages: strip-ansi and child_process are not loaded.



### Configuration and operation
The plugin allows for the setup of switches that are triggered by keywords of keyphrases that appear in the default Homebridge log. (other files can be used as well, as long as there is no encryption, by entering the correct path to the log file).
- Platform Name: CANNOT BE CHANGED - must be `HomebridgeVirtualSwitches'
- Switch Name: Every switch must have a name and is defined by the following characteristics:
    - Normally Closed Switch: set the switch type: normally open, aka. the switch is off when not yet triggered (= default setting) or normally closed (aka the switch is on when not yet triggered) 
    - Stateful: determines the switch behavior after the switch is triggered:
        - stateful: the switch state does not change after it is triggered, or
        - not stateful: the switch state returns to its normal state after a timer runs out (= default setting)
    - Auto Off Time: The time which a not stateful switch stays triggered before it returns to it normal state (this setting is only relevant for non-stateful switches)
    - Monitor Log File: when checked, the switch will be triggered by the appearance of Keywords in the log file,
    - Log File Path: enter the full path to the log file that must be monitored (multiple switches can monitor different log files). The file must be in ASCII format. Default is pointing to the Homebridge log file location.
    -Keywords: enter one keyword or keyphrase as it will occur in the log file. Do not attempt to format the keywords. The keywords and the log file lines will be compared lowercased and stripped of any ANSI code.
    - Enable Startyp Delay: when checked the switch will not become active until a certain time has passed after Homebridge started. This is to prevent switches from being switched as Homebridge is initializing.
    - Startyp Delay: the time between Homebridge startup and the startup of the switch.
- Multiple switches, each with their own Switch Name can be set up.

Note:
- a stateful switch that is triggered by keyword(s) from a log file, will not switch when any keyword for that switch appears again unless the switch has been reset by amy other means (manually, HomeKit scene, etc.). Once that switch is reset, it can be triggered again by any of the keywords appearing in the log file.
- a non-stateful switch that is triggered by keyword(s) from a log file, will not switch when any keyword for that switch appears again as long as the timer of that switch has not expired. Once it expires, it can be triggered again by any of the keywords appearing in the log file.



### Operation

The switches are either stateful or not. Occurence of one or more keywords/phrases will trigger the corresponding switch to come on.
- If the switch is stateful, re-occurrence of a keyword/phrase will not change the switch (i.e., it was on and it will stay on)
- If the switch is not stateful, re-occurrence of a keyword/phrase will reset the timer before the switch to open (turn off) again. Once the timer has run down, the switch will open (turn off) again.
  

### Found a bug?

If you think you've found a bug, please first read through the open Issues. If you're confident it's a new bug, go ahead and create a new GitHub issue. Be sure to include as much information as possible and please be patient.
