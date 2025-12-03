/*****
** 
*****/
class ConfigData {
    constructor() {
        this.data = null;
    }
	
	
    static create() {
        /* Setup */

        let nThis = new this();

        nThis.element = document.createElement("div");

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.element.remove();
        this.element = null;
        
        // console.log("Prepared removal of self");
    }

    setData(inData) {
        // Look at UserdataPorter.exportProgressJson for a struct overview.
        this.data = inData;

        // console.log("ConfigData received new data:");
        // console.log(this.data);
    }

    getConfigVal(inConfigField) {
        const valueX = this.data[inConfigField];
        if (valueX == null) {
            console.error(`The config field does not exist: ${inConfigField}`);
        }
        return valueX;
    }

    setConfigVal(inConfigField, inValue) {
        if (this.data[inConfigField] == null) {
            console.error(`The config field does not exist: ${inConfigField}`);
            return;
        }
        this.data[inConfigField] = inValue;

        let setConfigValEvent = new Event('set-config-val', { bubbles: false });
        setConfigValEvent.configField = inConfigField;
        this.element.dispatchEvent(setConfigValEvent);
    }
}