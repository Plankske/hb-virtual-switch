<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

<span align="center">

# Homebridge Virtual Switches

</span>!(image.png)

> [!IMPORTANT]  
> **Homebridge v2.0 Information**
> 
> This plugin is Homebridge v2.0 ready and requires node.js v20.14.12 or higher.
> (for information on how to upgrade node.js, see https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js/)
> 

---
The plugin creates a variety of virtual switches. Specifically, switches that are triggered by the appearance of keywords in a log files. 
The plugin acts as an automated attendant that monitors any log file (defaults to the Homebridge log file) for the appearance of certain keywords or key phrases. Occurrence of a keyword triggers a virtual switch (normally open or normally closed, stateful or not) to be switched. This can be helpful in advanced HomeKit automations. 

E.g., the loss of the api authentication of a plugin can break an automation. The log message line that alerts of the loss of authentication is used as the key phrase for triggering virtual switch. A Homekit automation can then be set up to e.g. send an alert (Pushover message, warning light, siren, etc.) 

The plugin also provides virtual switches that are not triggered by the Homebridge log file. The use of virtual switches is crucial in the development of advanced HomeKit automations.

### Additional Requirements
the following packages are needed for the plugin to function properly
- strip-ansi
- child_process

### Configuration
The plugin allows for the setup of switches that are triggered by keywords of key phrases that appear in the default Homebridge log. (other files can be used as well, as long as there is no encryption, by entering the correct path to the log file).
- Platform Name: CANNOT BE CHANGED - must be `HomebridgeVirtualSwitches'
- Switch Name: Every switch must have a name and is defined by the following characteristics:
    - Normally Closed Switch: Set the switch type: normally open, aka. the switch is off when not yet triggered (= default setting) or normally closed (aka the switch is on when not yet triggered) 
    - Stateful: Determines the switch behavior after the switch is triggered:
        - stateful: The switch state does not change after it is triggered, or
        - not stateful: The switch state returns to its normal state after a timer runs out (= default setting)
    - Auto Off Time: The time which a not stateful switch stays triggered before it returns to it normal state (this setting is only relevant for non-stateful switches)
    - Monitor Log File: when checked, the switch will be triggered by the appearance of Keywords in the log file,
    - Log File Path: Enter the full path to the log file that must be monitored (multiple switches can monitor different log files). The file must be in ASCII format. Default is pointing to the Homebridge log file location.
    -Keywords: Enter one keyword or key phrase as it will occur in the log file. Do not attempt to format the keywords. The keywords and the log file lines will be compared lowercased and stripped of any ANSI code.
    - Enable Startup Delay: When checked the switch will not become active until a certain time has passed after Homebridge started. This is to prevent switches from being switched as Homebridge is initializing.
    - Startup Delay: The time between Homebridge startup and the startup of the switch.
    - Restart in last known state: When checked, the switch will come on in its last known state before Homebridge powered down. 
        Note: only works for stateful switches that are not controlled by keywords appearing in a log file.

- Multiple switches, each with their own Switch Name can be set up.

Note:
- a stateful switch that is triggered by keyword(s) from a log file, will not switch when any keyword for that switch appears again unless the switch has been reset by amy other means (manually, HomeKit scene, etc.). Once that switch is reset, it can be triggered again by any of the keywords appearing in the log file.
- a non-stateful switch that is triggered by keyword(s) from a log file, will not switch when any keyword for that switch appears again as long as the timer of that switch has not expired. Once it expires, it can be triggered again by any of the keywords appearing in the log file.

### Operation of switches that are controlled by keywords in a log file
The switches are either stateful or not. If so set, the occurrence of one or more keywords/phrases will trigger the corresponding switch.
- If the switch is stateful, re-occurrence of a keyword/phrase will not change the switch state. In other words, if it was switched on/off before, the re-occurrence will have no impact (it will stay on/off). Once the switch is reset from its triggered state, the occurrence of any keyword will trigger the switch to change its state.
- If the switch is not stateful, re-occurrence of a keyword/phrase before the timer has run out will not change the switch state. Once the timer has run out, the switch state will be reset from its triggered state. Thereafter, if the switch is triggered again, its stat will change again for the duration of the timer.
Note: this means that repeated triggering of a not stateful switch will not results in a longer time to reset.  

### Found a bug?

If you think you've found a bug, please first check the requirements and read through the open Issues. If you're confident it's a new bug, go ahead and create a new GitHub issue. Be sure to include as much information as possible and please be patient.

