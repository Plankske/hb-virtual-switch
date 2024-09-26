import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HomebridgeVirtualSwitchesPlatform } from './platform';

export class HomebridgeVirtualSwitchesAccessory {
  private service: Service;
  private switchState = false;
  private timer: NodeJS.Timeout | undefined;
  private timerEndTime: number | undefined;
  private useLogFile: boolean;

  constructor(
    private readonly platform: HomebridgeVirtualSwitchesPlatform,
    public readonly accessory: PlatformAccessory,
  ) {
    this.useLogFile = accessory.context.device.UseLogFile;

    // Set accessory information
    const accessoryInformationService = this.accessory.getService(this.platform.Service.AccessoryInformation);
    if (accessoryInformationService) {
      accessoryInformationService
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HomebridgeVirtualSwitchesPlatform')
        .setCharacteristic(this.platform.Characteristic.Model, 'HomebridgeVirtualSwitchAccessory-Switch')
        //.setCharacteristic(this.platform.Characteristic.Model, `HomebridgeVirtualSwitchAccessory-${accessory.context.device.Name}`)
        .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.Name)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, `HomebridgeVirtualSwitchAccessory-${accessory.context.device.Name}`)
        //.setCharacteristic(this.platform.Characteristic.SerialNumber, `HomebridgeVirtualSwitchAccessory-${this.accessory.context.aid}`)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '0.0.0');
    }

    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.Name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    const device = this.accessory.context.device;
    const RememberState = device.RememberState;
      
    // Initialize the switch state based on NormallyClosed setting or last saved state
    if (RememberState && accessory.context.device.lastState !== null) {
      this.switchState = accessory.context.device.lastState;
    } else {
      this.switchState = this.accessory.context.device.NormallyClosed;
    }
    // Initialize the switch state based on NormallyClosed setting
    //this.switchState = this.accessory.context.device.NormallyClosed;

    this.updateHomeKitState();

    const homeKitState = this.switchState;

    this.platform.log.info(
      `Switch "${this.accessory.context.device.Name}" initialized as ` +
      `${homeKitState ? 'on' : 'off'} (Normally ${this.accessory.context.device.NormallyClosed ? 'Closed' : 'Open'})`);
    
  }

  async setOn(value: CharacteristicValue) {
    const newHomeKitState = value as boolean;
    const device = this.accessory.context.device;

    // For normally closed switches, we invert the HomeKit state, for normally open switches, we use the HomeKit state as-is
    if (!device.NormallyClosed){
      this.switchState = device.NormallyClosed ? !newHomeKitState : newHomeKitState;
    } else {
      this.switchState = newHomeKitState;
    }

    if (this.switchState !== device.NormallyClosed) {
      this.platform.log.info(`Switch "${device.Name}" turned ${device.NormallyClosed ? 'off' : 'on'}.`);
      if (!device.SwitchStayOn) {
        this.startOffTimer();
      }
    } else {
      this.platform.log.info(`Switch "${device.Name}" turned ${device.NormallyClosed ? 'on' : 'off'}.`);
      this.clearTimer();
    }

    // Save the current state if RememberState is enabled
    if (device.RememberState) {
      this.platform.saveSwitchState(device.Name, this.switchState);
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    const homeKitState = this.switchState;
    return homeKitState;
  }

  public triggerSwitch() {
    const device = this.accessory.context.device;
  
    // Check if the device is in a triggered state
    const isTriggered = this.switchState !== device.NormallyClosed;

    // Check if the switch is triggered and stateful and if the last trigger was from a keyword
    if (isTriggered && device.SwitchStayOn) {
      // Stateful switch: only trigger if the current trigger is not from a keyword
      if (this.useLogFile) {
        this.platform.log.debug(`DEBUG: "${device.Name}" Ignoring trigger due to keyword (stateful switch).`);
        return;
      }
    } else if (isTriggered && !device.SwitchStayOn) {
      // Non-stateful switch: check if the timer is still active
      if (this.timer && this.timerEndTime && Date.now() < this.timerEndTime) {
        this.platform.log.debug(`DEBUG: "${device.Name}" Ignoring trigger as the timer is still active.`);
        return;
      }
    }

    // Proceed with triggering the switch if the above conditions are not met
    this.switchState = !this.switchState;
    this.updateHomeKitState();
  
    if (this.switchState !== device.NormallyClosed) {
      this.platform.log.info(`Switch "${device.Name}" turned ${device.NormallyClosed ? 'off' : 'on'}.`);
      if (!device.SwitchStayOn) {
        this.startOffTimer();
      }
    } else {
      this.platform.log.info(`Switch "${device.Name}" turned ${device.NormallyClosed ? 'on' : 'off'}.`);
      this.clearTimer();
    }

    // Save the current state if RememberState is enabled
    if (device.RememberState) {
      this.platform.saveSwitchState(device.Name, this.switchState);
    }
  }

  private startOffTimer() {
    const device = this.accessory.context.device;
    this.clearTimer();
  
    const timeoutDuration = device.Time;

    this.platform.log.info(`Switch "${device.Name}" will turn ${device.NormallyClosed ? 'on' : 'off'} after ${timeoutDuration} milliseconds.`);
    this.timerEndTime = Date.now() + timeoutDuration;
    this.timerEndTime = Date.now() + device.Time;
  
    this.timer = setTimeout(() => {
      this.switchState = device.NormallyClosed;
      this.updateHomeKitState();
      
      const homeKitState = this.switchState;
      this.platform.log.info(`Switch "${device.Name}" turned ${homeKitState ? 'on' : 'off'} automatically after timer expired.`);
    }, timeoutDuration);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
      this.timerEndTime = undefined;
    }
  }

  private updateHomeKitState() {
    const homeKitState = this.switchState;

    const service = this.accessory.getService(this.platform.Service.Switch);
    if (service) {
      service.updateCharacteristic(this.platform.Characteristic.On, homeKitState);
    } else {
      this.platform.log.error(`ERROR: Failed to find the switch service for "${this.accessory.displayName}".`);
    }
  }
}
