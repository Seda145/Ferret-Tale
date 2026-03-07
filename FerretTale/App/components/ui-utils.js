/*****
** Independend global utility to work with widget content / styling.
** Mainly used to generate new HTML elements for components, and to instruct app styling based on UI interaction.
*****/
class UIUtils {
	static create() {
        /* Setup */

        const nThis = new this();

        nThis.acEventListener = new AbortController();

        UIUtils.readScrollPosition();

        /* Events */

        window.addEventListener("scroll", nThis.actOnScrollOrResize.bind(nThis), { signal: nThis.acEventListener.signal });
        window.addEventListener("resize", nThis.actOnScrollOrResize.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
	}

	prepareRemoval() {
        this.acEventListener.abort();
        
        // console.log("Prepared removal of self");
    }

	// Utils for creating elements.

	static createElement(inHTML) {
		// Helper method to create an element exactly as the html argument specifies, without leaving a wrapping parent container created by "createElement".
        const newElem = document.createElement("div");	
        newElem.innerHTML = inHTML;
        const innerElem = newElem.firstElementChild;
        // Remove old div parent reference.
        innerElem.remove();
        return innerElem;
	}

	static setInnerHTML(inParentElement, inHTML) {
		// Helper method to create and append an element exactly as the html argument specifies, without leaving a wrapping parent container created by "createElement".
		const newElem = UIUtils.createElement(inHTML);
        inParentElement.innerHTML = "";
		inParentElement.appendChild(newElem);
		return newElem;
	}

	static prependInnerHTML(inParentElement, inHTML) {
		// Helper method to create and append an element exactly as the html argument specifies, without leaving a wrapping parent container created by "createElement".
		const newElem = UIUtils.createElement(inHTML);
        inParentElement.prepend(newElem);
		return newElem;
	}

	static appendInnerHTML(inParentElement, inHTML) {
		// Helper method to create and append an element exactly as the html argument specifies, without leaving a wrapping parent container created by "createElement".
		const newElem = UIUtils.createElement(inHTML);
        inParentElement.append(newElem);
		return newElem;
	}

	static replaceElement(inParentElement, inHTML) {
		const newElem = UIUtils.createElement(inHTML);
		inParentElement.replaceWith(newElem);
		return newElem;
	}

	// Utils for math on elements.

	static getElementCenterCoord(inElement) {
		return {
			x: inElement.getBoundingClientRect().left + inElement.offsetWidth / 2,
			y: inElement.getBoundingClientRect().top + inElement.offsetHeight / 2
		};
	}

    static getTopLeftCoordDiffTo(inCoord, inElement) {
        // Can use this method to recalculate a coordinate as relative to another element's top / left.
        // Say, x 400 relative to window, is -200 relative to inElement's x 600.
        return {
            x: inCoord.x - inElement.getBoundingClientRect().left,
            y: inCoord.y - inElement.getBoundingClientRect().top
        }
	}

	// Utils for interactions.

	static isScrollAtTop() {
        // browser value isn't clamped or rounded, so I compare to 1 instead of 0.
        return (Math.floor(window.scrollY) <= 1);
    };

    static isScrollAtBottom() {
        // browser value isn't clamped or rounded, so I add 1 to scroll coord.
        return window.scrollY + window.innerHeight + 1 >= document.body.offsetHeight;
    };

    static isScrollAtElement(inElement) {
        // inElement.getBoundingClientRect is used for the top coordinate relative to the window (no scroll).
        // inElement.offsetHeight gets the height of the element including padding and borders.
        return (window.scrollY >= (window.scrollY + inElement.getBoundingClientRect().top)
            && window.scrollY <= (window.scrollY + inElement.getBoundingClientRect().top + inElement.offsetHeight)
        );
    }

    static isScrollPastTopElement(inElement) {
        // el.getBoundingClientRect is used for the top coordinate relative to the window (no scroll).
        // el.offsetHeight gets the height of the element including padding and borders.
        return (window.scrollY > (window.scrollY + inElement.getBoundingClientRect().top));
    }

    static isScrollPastElement(inElement) {
        // el.getBoundingClientRect is used for the top coordinate relative to the window (no scroll).
        // el.offsetHeight gets the height of the element including padding and borders.
        return (window.scrollY > (window.scrollY + inElement.getBoundingClientRect().top + inElement.offsetHeight));
    }

    static isScrolledWindowBottomAtElement(inElement) {
        // el.getBoundingClientRect is used for the top coordinate relative to the window (no scroll).
        // el.offsetHeight gets the height of the element including padding and borders.
        return (window.scrollY + window.innerHeight > (window.scrollY + inElement.getBoundingClientRect().top));
    }

    static isScrolledWindowBottomPastElement(inElement) {
        // el.getBoundingClientRect is used for the top coordinate relative to the window (no scroll).
        // el.offsetHeight gets the height of the element including padding and borders.
        return (window.scrollY + window.innerHeight > (window.scrollY + inElement.getBoundingClientRect().top + inElement.offsetHeight));
    }

    static readScrollPosition() {
        if (UIUtils.isScrollAtTop()) {
            document.body.classList.add('scroll-at-top');
            document.body.classList.remove('scroll-left-top');
            document.body.classList.remove('scroll-past-header-top');
        } else {
            document.body.classList.add('scroll-left-top');
            document.body.classList.remove('scroll-at-top');

            const el = document.querySelector("header .header-top");
            document.body.classList.toggle('scroll-past-header-top', el != null && UIUtils.isScrollPastElement(el));

            document.body.classList.toggle('scroll-at-bottom', UIUtils.isScrollAtBottom());
        }
    }

    static resetFocus() {
        // This is currently used to finalize editing of HTML input fields without user interaction.
        // Refocusing before performing an action like exporting (CTRL S) ensures that the export receives the latest data.
        // (Since clearing focus triggers the change event of a focused input element).
        // If you do not do this, you run into the following situation:
        // 1. User is still editing an input field, doesn't trigger the change event (no enter press, no navigating away).
        // 2. User presses CTRL S to save content from the input field to JSON.
        // 3. JSON receives old value, because the change event never triggered.

        let focusedElem = document.activeElement;
        if (focusedElem != null) {
            // console.log("Resetting focus to:");
            // console.log(focusedElem);
            // Note: In Chrome, blur() seems to focus the body element, instead of clearing focus entirely.
            focusedElem.blur();
            focusedElem.focus({ preventScroll: true, focusVisible: false });
        }
    }

    // Utils for color interpolation.

    static getCssRGBAsObject(inRGBString) {
        const [r, g, b] = inRGBString.replace('rgb(', '').replace(')', '').split(',').map(str => Number(str));
        return { r, g, b };
    }

    static getRGBObjectAsCss(inRGBObject) {
        return `rgb(${Math.round(inRGBObject.r)}, ${Math.round(inRGBObject.g)}, ${Math.round(inRGBObject.b)})`;
    }

    static interpolateRGBObjects(inColorA, inColorB, inAlpha) {
        const colorVal = (prop) => {
            return Math.round(MathUtils.lerp(inColorA[prop], inColorB[prop], inAlpha));
        };
        return {
            r: colorVal('r'),
            g: colorVal('g'),
            b: colorVal('b'),
        }
    }

    static interpolateRGBAsObjects(inColorA, inColorB, inAlpha) {
        const objA = UIUtils.getCssRGBAsObject(inColorA);
        const objB = UIUtils.getCssRGBAsObject(inColorB);
        return UIUtils.interpolateRGBObjects(objA, objB, inAlpha);
    }

	/* Events */

	actOnScrollOrResize() {
        UIUtils.readScrollPosition();
    }
}