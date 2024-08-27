<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

<span align = "center">

# Homebridge Virtual Switches
<span align = "center">
<img src="https://github.com/Plankske/hb-virtual-switch/blob/latest/image.png" width="100"/>


</span>

> **Homebridge v2.0 Information**  
> This plugin is Homebridge v2.0 ready and requires Node.js v20.14.12 or higher.  
> For information on how to upgrade Node.js, see [this guide](https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js).

---

**Homebridge-Virtual Switches** is a plugin that creates a variety of virtual switches, specifically those triggered by the appearance of keywords in log files. The plugin monitors any log file (defaults to the Homebridge log file) for specific keywords or key phrases. When a keyword is detected, a virtual switch (normally open or normally closed, stateful or not) is triggered. This can be helpful in advanced HomeKit automations.

*Example:*  
If a plugin loses API authentication, a log message alerts you. This log message can be used as a key phrase to trigger a virtual switch, allowing HomeKit automations to send alerts (e.g., Pushover message, warning light, siren, etc.).

The plugin also provides virtual switches that are not triggered by the Homebridge log file. The use of virtual switches is crucial in developing advanced HomeKit automations.

---
### Additional Requirements
The following packages are needed for the plugin to function properly:
- `strip-ansi`
- `child_process`

---
### Configuration
The plugin allows setting up switches that are triggered by keywords or key phrases appearing in the default Homebridge log. You can also specify a different log file if needed.

- **Platform Name:** Must be `HomebridgeVirtualSwitches` (cannot be changed).
- **Switch Name:** Define a unique name for each switch.
    - **Normally Closed Switch:** Set the switch type: normally open (default) or normally closed.
    - **Stateful:** Determines the switch behavior after being triggered:
        - **Stateful:** The switch state does not change after being triggered.
        - **Non-stateful:** The switch state returns to its normal state after a timer runs out (default).
    - **Auto Off Time:** Duration before a non-stateful switch returns to its normal state.
    - **Monitor Log File:** Check this option to trigger the switch by keywords in the log file.
    - **Log File Path:** Enter the full path to the log file to monitor (multiple switches can monitor different files). The file must be in ASCII format. The default is the Homebridge log file location.
    - **Keywords:** Enter one keyword or key phrase as it appears in the log file. Keywords and log lines are compared in lowercase and stripped of any ANSI code.
    - **Enable Startup Delay:** Delay switch activation after Homebridge starts to prevent premature triggers.
    - **Startup Delay:** Time between Homebridge startup and switch activation.
    - **Restart in Last Known State:** If enabled, the switch will start in its last known state before Homebridge shut down. This only works for stateful switches not controlled by log file keywords.

Multiple switches can be set up, each with its own configuration.

---
### Operation of Switches Controlled by Log File Keywords
Switches can be stateful or not. If set, the occurrence of one or more keywords/phrases triggers the corresponding switch.

- **Stateful Switches:** Once triggered, reoccurrence of the keyword/phrase will not change the switch state until it is manually reset.
- **Non-stateful Switches:** The switch will not be retriggered until the timer has expired.

*Note:* Repeated triggering of a non-stateful switch will not extend nor reset the timer.

---
### Found a Bug?
If you think you've found a bug, please first check the requirements and read through the open issues. If you're confident it's a new bug, create a new GitHub issue with as much information as possible. Please be patient as we review your report.
