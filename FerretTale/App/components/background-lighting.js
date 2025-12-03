class BackgroundLighting {
	static create(inScopeElement) {
		/* Setup */

		let nThis = new this();

		nThis.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="background-lighting"]'), nThis.getHTMLTemplate());

		nThis.drawTimeS = 0;

		nThis.initialStageColorBottom = 'rgb(18, 0, 6)';
		nThis.initialStageColorCenter = 'rgb(18, 0, 6)';
		nThis.initialStageColorTop = 'rgb(10, 0, 3)';

		nThis.alphaStages = [
			{
				color: 'rgb(37, 1, 12)',
				spotIntensityA: 1.6,
				spotWhiteAddition: 9,
				spotAngle: 95
			},
			{
				color: 'rgb(37, 1, 12)',
				spotIntensityA: 1.7,
				spotWhiteAddition: 10,
				spotAngle: 105
			}
		];
		nThis.curAlphaStage = 0;
		nThis.interpolatedAlphaStageData = nThis.alphaStages[0];

		nThis.draw();

		/* Return self */

		return nThis;
	}
	
	prepareRemoval() {
		window.cancelAnimationFrame(this.requestAnimationDrawFrame);

        this.element.remove();
        this.element = null;

		// console.log("Prepared removal of self");
    }

	interpolateAlphaData() {
		// Loop all stages every X seconds.
		const stageTime = 20;
		// Decided not to ensure that all stages are shown within total audio duration,
		// Because that gives different stage speeds per audio file.
		// Also not using audio.currentTime to calc alpha to avoid skips in the lighting.
		// Seems I can get a count in MS from the window.requestAnimationFrame.
		const stageAlpha = this.drawTimeS % stageTime / stageTime;
		const stageLoopAlpha = this.drawTimeS % (stageTime * this.alphaStages.length) / (stageTime * this.alphaStages.length);

		this.curAlphaStage = Math.max(0, Math.floor(this.alphaStages.length * stageLoopAlpha));
		// console.log(stageLoopAlpha);

		// Interpolate the data of the current alpha stage to the data of the next.
		const curData = this.getAlphaStageData(this.curAlphaStage);
		// Get next but wrap around to 0 if required.
		const nextStageIndex = this.curAlphaStage + 1 == this.alphaStages.length ? 0 : this.curAlphaStage + 1; 
		const nextData = this.getAlphaStageData(nextStageIndex);

		let newData = {};
		newData.color = UIUtils.getRGBObjectAsCss(UIUtils.interpolateRGBAsObjects(curData.color, nextData.color, stageAlpha));
		newData.spotIntensityA = MathUtils.lerp(curData.spotIntensityA, nextData.spotIntensityA, stageAlpha);
		newData.spotWhiteAddition = MathUtils.lerp(curData.spotWhiteAddition, nextData.spotWhiteAddition, stageAlpha);
		newData.spotAngle = MathUtils.lerp(curData.spotAngle, nextData.spotAngle, stageAlpha);
		this.interpolatedAlphaStageData = newData;
	}

	getAlphaStageData(inAlphaStage) {
		// Clamp to the start and end of the data.
		return this.alphaStages[MathUtils.clamp(inAlphaStage, 0, this.alphaStages.length - 1)];
	}

	draw() {
		this.interpolateAlphaData();
		this.drawStage();

		window.cancelAnimationFrame(this.requestAnimationDrawFrame);
		this.requestAnimationDrawFrame = window.requestAnimationFrame((inMS) => {
			this.drawTimeS = inMS / 1000;
			this.draw();
		});
	}

	drawStage() {
		// Calculate the center color, which is the main "ambience" of the room.
		let spotColorAObj = UIUtils.getCssRGBAsObject(this.interpolatedAlphaStageData.color);
		// Alter color or intensity a bit on the light.
		spotColorAObj.r = Math.min(255, spotColorAObj.r * this.interpolatedAlphaStageData.spotIntensityA + this.interpolatedAlphaStageData.spotWhiteAddition);
		spotColorAObj.g = Math.min(255, spotColorAObj.g * this.interpolatedAlphaStageData.spotIntensityA + this.interpolatedAlphaStageData.spotWhiteAddition);
		spotColorAObj.b = Math.min(255, spotColorAObj.b * this.interpolatedAlphaStageData.spotIntensityA + this.interpolatedAlphaStageData.spotWhiteAddition);

		const spotColorA = UIUtils.getRGBObjectAsCss(spotColorAObj);

		// 1. Base stage color. 2. Repeating vertical light beams, 3. fade to bottom.
		this.element.style.backgroundImage = `
			linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 45%, ${this.initialStageColorBottom} 80%),
			repeating-linear-gradient(${this.interpolatedAlphaStageData.spotAngle}deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 5%, ${spotColorA} 15%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 30%), 
			linear-gradient(0deg, ${this.initialStageColorBottom} 10%, ${this.interpolatedAlphaStageData.color} 40%, ${this.interpolatedAlphaStageData.color} 50%, ${this.initialStageColorTop} 100%)
		`;
	}

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        return (html`
 
<div class="background-lighting">
</div>

        `);
    }
}