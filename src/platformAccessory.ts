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

    // Log to see the accessory context
    //this.platform.log.debug('Accessory context:', JSON.stringify(this.accessory.context));

    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.Name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    // Initialize the switch state based on NormallyClosed setting
    this.switchState = this.accessory.context.device.NormallyClosed;

    //this.platform.log.debug(
    //  `[${this.accessory.context.device.Name}] Initializing. NormallyClosed:` +
    //  ` ${this.accessory.context.device.NormallyClosed}, Initial switchState: ${this.switchState}`);

    this.updateHomeKitState();

    const homeKitState = this.switchState;
    //const homeKitState = this.getHomeKitState();

    this.platform.log.info(
      `Switch "${this.accessory.context.device.Name}" initialized as ` +
      `${homeKitState ? 'on' : 'off'} (Normally ${this.accessory.context.device.NormallyClosed ? 'Closed' : 'Open'})`);
    
  }

  async setOn(value: CharacteristicValue) {
    const newHomeKitState = value as boolean;
    const device = this.accessory.context.device;

    //if (device.NormallyClosed) { //DVDP added line
    //  this.platform.log.debug(`[${device.Name}] setOn called with value: ${newHomeKitState}`);
    //} //DVDP added line

    // For normally closed switches, we invert the HomeKit state, for normally open switches, we use the HomeKit state as-is
    if (!device.NormallyClosed){
      this.switchState = device.NormallyClosed ? !newHomeKitState : newHomeKitState;
    } else {
      this.switchState = newHomeKitState;
    }

    //this.platform.log.debug(`[${device.Name}] New internal switchState: ${this.switchState}`);

    //this.updateHomeKitState();

    if (this.switchState !== device.NormallyClosed) {
      this.platform.log.info(`Switch "${device.Name}" turned ${device.NormallyClosed ? 'off' : 'on'}.`);
      if (!device.SwitchStayOn) {
        this.startOffTimer();
      }
    } else {
      this.platform.log.info(`Switch "${device.Name}" turned ${device.NormallyClosed ? 'on' : 'off'}.`);
      this.clearTimer();
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    const homeKitState = this.switchState;
    //const homeKitState = this.getHomeKitState();

    //if (this.accessory.context.device.NormallyClosed) { //DVDP added line
    //  this.platform.log.debug(`[${this.accessory.context.device.Name}] getOn called, returning: ${homeKitState}`);
    //} //DVDP added line
    return homeKitState;
  }

  public triggerSwitch() {
    const device = this.accessory.context.device;
    //this.platform.log.debug(`[${device.Name}] triggerSwitch called. Current state: ${this.switchState}`);
  
    // Check if the device is in a triggered state
    const isTriggered = this.switchState !== device.NormallyClosed;


    // Check if the switch is triggered and stateful and if the last trigger was from a keyword
    if (isTriggered && device.SwitchStayOn) {
      // Stateful switch: only trigger if the current trigger is not from a keyword
      if (this.useLogFile) {
        this.platform.log.debug(`[${device.Name}] Ignoring trigger due to keyword (stateful switch).`);
        return;
      }
    } else if (isTriggered && !device.SwitchStayOn) {
      // Non-stateful switch: check if the timer is still active
      if (this.timer && this.timerEndTime && Date.now() < this.timerEndTime) {
        this.platform.log.debug(`[${device.Name}] Ignoring trigger as the timer is still active.`);
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
      //this.platform.log.debug(`[${device.Name}] Timer expired, setting switchState to ${this.switchState}`);
      this.updateHomeKitState();
      
      const homeKitState = this.switchState;
      //const homeKitState = this.getHomeKitState();
      this.platform.log.info(`Switch "${device.Name}" turned ${homeKitState ? 'on' : 'off'} automatically after timer expired.`);
    }, timeoutDuration);
  }

  private resetOffTimer() {
    if (this.timer && this.timerEndTime) {
      const remainingTime = this.timerEndTime - Date.now();
      this.clearTimer();

      const device = this.accessory.context.device;
      this.platform.log.info(`Switch "${device.Name}" timer reset. Will turn off after ${remainingTime} milliseconds.`);
      
      this.timerEndTime = Date.now() + remainingTime;
      this.timer = setTimeout(() => {
        this.switchState = false;
        this.updateHomeKitState();
        this.service.updateCharacteristic(this.platform.Characteristic.On, false);
        this.platform.log.info(`Switch "${device.Name}" turned off automatically after reset timer expired.`);
      }, remainingTime);
    }
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
    //const homeKitState = this.getHomeKitState();
    //this.platform.log.debug(`[${this.accessory.context.device.Name}] Updating HomeKit state to: ${homeKitState}`);

    const service = this.accessory.getService(this.platform.Service.Switch);
    if (service) {
      service.updateCharacteristic(this.platform.Characteristic.On, homeKitState);
    } else {
      this.platform.log.error(`Failed to find the switch service for "${this.accessory.displayName}".`);
    }
  }
  
  //private getHomeKitState(): boolean {
  //  // For both normally open and closed switches, we want to return the internal state as-is
  //  const homeKitState = this.switchState;
  //  //const homeKitState = this.accessory.context.device.NormallyClosed ? !this.switchState : this.switchState;
  //  if (this.accessory.context.device.NormallyClosed) { //DVDP added line
  //    this.platform.log.debug(`[${this.accessory.context.device.Name}] getHomeKitState: internal state: ${this.switchState}, HomeKit state: ${homeKitState}`);
  //  }
  //  return homeKitState;
  //}

}
