import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { HomebridgeVirtualSwitchesAccessory } from './platformAccessory.js';
import { spawn } from 'child_process';
import stripAnsi from 'strip-ansi';
import fs from 'fs';
import path from 'path';

// Define an interface for device configuration
interface DeviceConfig {
  Name: string;
  SwitchStayOn: boolean;
  Time: number;
  UseLogFile: boolean;
  LogFilePath: string;
  Keywords: string[];
  EnableStartupDelay: boolean;
  StartupDelay: number;
  NormallyClosed: boolean;
  RememberState: boolean;
}

export class HomebridgeVirtualSwitchesPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  private accessoryInstances: Map<string, HomebridgeVirtualSwitchesAccessory> = new Map();
  private tailProcesses: Map<string, ReturnType<typeof spawn>> = new Map();

  // Declare the properties
  private spawn: typeof import('child_process').spawn | undefined;
  private stripAnsi: ((text: string) => string) | undefined;
  
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('DEBUG: Finished initializing platform.');

    this.api.on('didFinishLaunching', () => {
      this.log.debug('DEBUG: Executed didFinishLaunching callback');
      this.loadDependencies().then(() => {
        this.discoverDevices();
      }).catch((error) => {
        this.log.error('ERROR: Failed to load dependencies:', error);
      });  
    });
  }

  private async loadDependencies() {
    try {
      const childProcess = await import('child_process');
      this.spawn = childProcess.spawn;
    } catch (error) {
      this.log.error('ERROR: Failed to load child_process module:', error);
      throw error;
    }

    try {
      const stripAnsiModule = await import('strip-ansi');
      this.stripAnsi = stripAnsiModule.default;
    } catch (error) {
      this.log.error('ERROR: Failed to load strip-ansi module:', error);
      throw error;
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    // `this.config.devices` is an array of device configurations
    const devices: DeviceConfig[] = Array.isArray(this.config.devices) ? this.config.devices : [];

    for (const deviceConfig of devices) {
      const device = {
        Name: deviceConfig.Name,
        SwitchStayOn: deviceConfig.SwitchStayOn,
        Time: deviceConfig.Time,
        UseLogFile: deviceConfig.UseLogFile,
        LogFilePath: deviceConfig.LogFilePath,
        Keywords: Array.isArray(deviceConfig.Keywords) ? deviceConfig.Keywords : [],
        EnableStartupDelay: deviceConfig.EnableStartupDelay,
        StartupDelay: deviceConfig.StartupDelay,
        NormallyClosed: deviceConfig.NormallyClosed,
        RememberState: deviceConfig.RememberState,
      };
      
      this.log.debug('DEBUG: Device config:', JSON.stringify(device));
      
      const uuid = this.api.hap.uuid.generate(device.Name);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      let lastState: boolean | null = null;
      if (deviceConfig.RememberState) {
        lastState = this.loadSwitchState(device.Name);
      }

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        existingAccessory.context.device = { ...device, lastState };
        this.api.updatePlatformAccessories([existingAccessory]);
        const accessoryInstance = new HomebridgeVirtualSwitchesAccessory(this, existingAccessory);
        this.accessoryInstances.set(uuid, accessoryInstance);
      } else {
        this.log.info('Adding new accessory:', device.Name);
        const accessory = new this.api.platformAccessory(device.Name, uuid);
        accessory.context.device = { ...device, lastState };
        const accessoryInstance = new HomebridgeVirtualSwitchesAccessory(this, accessory);
        this.accessoryInstances.set(uuid, accessoryInstance);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }

      // Start log monitoring with the specified delay
      if (device.UseLogFile) {
        const startupDelay = device.EnableStartupDelay ? device.StartupDelay || 10000 : 0;
        setTimeout(() => {
          this.startLogMonitoring(device, uuid);
        }, startupDelay);
      }
    }
  }

  startLogMonitoring(device: DeviceConfig, uuid: string) {
    if (!this.spawn) {
      this.log.error('Cannot start log monitoring: child_process module not loaded');
      return;
    }

    const logFilePath = device.LogFilePath || '/var/lib/homebridge/homebridge.log';
    this.log.info(`Starting to monitor log file at: ${logFilePath} for switch "${device.Name}"`);

    // Use tail -f to monitor the log file
    const tail = spawn('tail', ['-f', logFilePath]);

    tail.stdout.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      this.checkKeywords(line, uuid);
      //if (!this.isPluginLogMessage(line)) {
      //  this.checkKeywords(line, uuid);
      //}
    });

    tail.stderr.on('data', (data: Buffer) => {
      this.log.error(`Error from tail process for "${device.Name}": ${data.toString()}`);
    });

    tail.on('close', (code) => {
      this.log.info(`Tail process for "${device.Name}" exited with code ${code}`);
    });

    this.tailProcesses.set(uuid, tail);
  }

  private checkKeywords(line: string, uuid: string) {
    
    const accessoryInstance = this.accessoryInstances.get(uuid);
    if (!accessoryInstance) {
      return;
    }

    const device = accessoryInstance.accessory.context.device;
    if (!device) {
      return;
    }
    
    if (this.isPluginLogMessage(line,device)) {
      return;
    }
    const cleanedLine = this.escapeSpecialChars(this.removeAnsiCodes(line).toLowerCase());
    const processedKeywords = device.Keywords.map((keyword: string) => 
      this.escapeSpecialChars(this.removeAnsiCodes(keyword).toLowerCase()));

    processedKeywords.some((keyword: string) => {
      if (cleanedLine.includes(keyword)) {
        
        this.log.debug(`DEBUG: Keyword match ("${keyword}") found for switch "${device.Name}"`);
        //const foundKeyword = keyword;
        //this.log.debug(`DEBUG: Keyword match ("${foundKeyword}") found for switch "${device.Name}"`);
        accessoryInstance.triggerSwitch();
        return true;
      }
      return false;
    });
  }
  
  // Helper method to check if the line is generated by this plugin and by  a switch that monitors a log file (needed when debugging)
  private isPluginLogMessage(line: string, device: DeviceConfig): boolean {

    // Check if the line is a debug or error message from this plugin
    if ((line.includes('DEBUG:') || line.includes('ERROR: ')) && 
       (line.includes('homebridge-virtual-switch') || line.includes('HomebridgeVirtualSwitches'))) {
      return true; // Exclude debug and error messages from checking for keywords
    }
   
    if (!device.UseLogFile) { 
      return false; // Don't exclude any lines for switches not using log file monitoring
    }
    
    // Exclude lines that contain both the plugin name and the specific switch name
    return (line.includes('homebridge-virtual-switch') || line.includes('HomebridgeVirtualSwitches')) 
           && line.includes(device.Name); 
  }


  // Helper method to escape special characters in keywords
  private escapeSpecialChars(keyword: string): string {
    return keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  }

  //Helper method to remove ANSI escape codes from a string
  private removeAnsiCodes(text: string): string {
    if (!this.stripAnsi) {
      this.log.warn('strip-ansi module not loaded, ANSI codes will not be removed');
      return text;
    }
    return stripAnsi(text);
  }

  // Add this helper method to save the state of a switch
  public saveSwitchState(name: string, state: boolean) {
    const stateFilePath = path.join(this.api.user.storagePath(), `${name}_state.json`);
    fs.writeFileSync(stateFilePath, JSON.stringify({ state }), 'utf8');
  }

  // Add this helper method to load the state of a switch
  private loadSwitchState(name: string): boolean | null {
    try {
      const stateFilePath = path.join(this.api.user.storagePath(), `${name}_state.json`);
      if (fs.existsSync(stateFilePath)) {
        const data = fs.readFileSync(stateFilePath, 'utf8');
        const parsed = JSON.parse(data);
        return parsed.state;
      }
    } catch (error) {
      this.log.error(`ERROR: Failed to load state for switch "${name}":`, error);
    }
    return null;
  }
}