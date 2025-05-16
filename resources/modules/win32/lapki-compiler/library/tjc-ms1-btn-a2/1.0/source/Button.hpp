#ifndef BUTTON_H
#define BUTTON_H

#include <stdint.h>

#define BUTTON_PULLUP HIGH
#define BUTTON_PULLUP_INTERNAL 2
#define BUTTON_PULLDOWN LOW

#define CURRENT 0
#define PREVIOUS 1
#define CHANGED 2

#define SAMPLE 3
#define CLICKSENT 4

#define DEFAULT_HOLDEVENTTHRESHOLDTIME 500

#define ULL unsigned long

/* Begin Functions for bit manipulation */

void bitWrite(uint8_t& x, int n, bool b) {
	if (b) {
		x = x | (1ULL << n);
	} else {
		x = x & ~(1ULL << n);
	}
}

uint8_t bitRead(unsigned long x, int n) {
	return (x >> n) & 1;
}

/* End Functions for bit manipulation */


/* Begin Services functions */

// Btn struct
typedef struct Button_t {

    GPIO_TypeDef* port;
    uint8_t num;
    uint8_t state; // 0 - отпущена; 1 - зажата (для данного файла - это поле не нужно)
} Button_t;

// functions
INLINE__
static inline
void setupPinBtn(GPIO_TypeDef* port, uint8_t num) {

    port->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + num * 2U)); // no pull-up, no pull-down
    port->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + num * 2U)); // reset power mode
}

bool digitalRead(const struct Button_t* btn) {
	return ((btn->port->IDR >> btn->num) & 0x01);
}

/* End Services functions */

static struct Button_t btns[4];

static int initBtns = []() -> int {
	
    RCC -> IOPENR |= RCC_IOPENR_GPIOAEN; // тактирование A (RM, p.152)
    RCC -> IOPENR |= RCC_IOPENR_GPIOBEN; // тактирование B (RM, p.152)

	int i = 0;
	setupPinBtn(GPIOA, 1); btns[i].port = GPIOA; btns[i].num = 1; btns[i++].state = 0; // btn1
	setupPinBtn(GPIOA, 8); btns[i].port = GPIOA; btns[i].num = 8; btns[i++].state = 0; // btn2
	setupPinBtn(GPIOA, 11); btns[i].port = GPIOA; btns[i].num = 11; btns[i++].state = 0; // btn3
	setupPinBtn(GPIOA, 12); btns[i].port = GPIOA; btns[i].num = 12; btns[i++].state = 0; // btn4

	return 0;
}();

// main class
class Button;
typedef void (*buttonEventHandler)(Button&);

class Button
{
  public:

    // Ctor
	// WARNING: MODE for button IGNORED
    Button(uint8_t buttonPin, uint8_t buttonMode = BUTTON_PULLUP_INTERNAL) {
		
		(void)buttonMode;
		mode = 1;   // always mode == 1 - stm32 have fixed scheme

        ID = 0;

		// check range btnPin
		if (buttonPin < 1 || buttonPin > 4) {
			buttonPin = 1;
		}
		// map range [1..4] -> [0..3]
		--buttonPin;

        pin = buttonPin;

        state = 0;
        bitWrite(state, CURRENT, false);
        bitWrite(state, PREVIOUS, false);
        bitWrite(state, CHANGED, false);
        bitWrite(state, SAMPLE, mode);
        bitWrite(state, CLICKSENT, true);

        pressedStartTime = 0;
        debounceDelayTime = 50;
        debounceStartTime = 0;
        lastReleaseTime = 0;
        multiClickThresholdTime = 0;
		clickThresholdTime = 500;

        holdEventThresholdTime = 0;
        holdEventRepeatTime = 0;

        cb_onPress = 0;
        cb_onRelease = 0;
        cb_onClick = 0;
        cb_onHold = 0;

        numberOfPresses = 0;
        triggeredHoldEvent = true;
    }

    // Public Members
    uint8_t ID;
    int value;

    // Methods
    void pullup(uint8_t buttonMode) {
		
		// stub: method not needed
    }

    void pulldown() {
		
		// stub: method not needed
    }

    bool scan() {
		
		unsigned long now = millis();
		int sample = digitalRead(&btns[pin]);
		value = !sample;
		if (sample != bitRead(state, SAMPLE))
			debounceStartTime = now;                                            // Invalidate debounce timer (i.e. we bounced)

		bitWrite(state, SAMPLE, sample);                                      // Store the sample.

		bitWrite(state, CHANGED, false);

		// If our samples have outlasted our debounce delay (i.e. stabilized),
		// then we can switch state.
		if ((now - debounceStartTime) > debounceDelayTime)
		{
			// Save the previous value
			bitWrite(state, PREVIOUS, bitRead(state, CURRENT));

			// Get the current status of the pin, and normalize into state variable.
			if (sample == mode)
			{
				//currently the button is not pressed
				bitWrite(state, CURRENT, false);
			}
			else
			{
				//currently the button is pressed
				bitWrite(state, CURRENT, true);
			}

			//handle state changes
			if (bitRead(state, CURRENT) != bitRead(state, PREVIOUS))
			{
				//note that the state changed
				bitWrite(state, CHANGED, true);
				// Reset the hold event
				triggeredHoldEvent = false;

				//the state changed to PRESSED
				if (bitRead(state, CURRENT) == true)
				{
					clickTimer = millis();	// start click time
					holdEventPreviousTime = 0; // reset hold event
					holdEventRepeatCount = 0;
					numberOfPresses++;

					// If we have another click within the multiClick threshold,
					// increase our click count, otherwise reset.
					if ((now - lastReleaseTime) < multiClickThresholdTime)
						clickCount++;
					else
						clickCount = 1;

					if (cb_onPress)
						cb_onPress(*this);                                            // Fire the onPress event

					pressedStartTime = millis();                                    // Start timing
				}
				else //the state changed to RELEASED
				{
					clickTimer = millis() - clickTimer;	// eval click time
					if (cb_onRelease)
						cb_onRelease(*this);                                          // Fire the onRelease event

					lastReleaseTime = now;
					bitWrite(state, CLICKSENT, false);
				}
			}
			else if (bitRead(state, CURRENT))                                   // if we are pressed...
			{
				if (holdEventThresholdTime > 0 &&                                 // The owner wants hold events, AND
					((holdEventPreviousTime == 0) ||                              // (we haven't sent the event yet OR
					((holdEventRepeatTime > 0) &&                                // the owner wants repeats, AND
						((now - holdEventPreviousTime) > holdEventRepeatTime))) &&  // or it's time for another), AND
					((now - pressedStartTime) > holdEventThresholdTime) &&        // we have waited long enough, AND
					(cb_onHold != nullptr))                                          // someone is actually listening.
				{
					cb_onHold(*this);
					holdEventPreviousTime = now;
					holdEventRepeatCount++;
					triggeredHoldEvent = true;
				}
			}
  		}

		// Manage the onClick handler
		if (cb_onClick)
		{
			if (bitRead(state, CLICKSENT) == false &&
				bitRead(state, CURRENT) == false &&
				((multiClickThresholdTime == 0) ||                              // We don't want multiClicks OR
				((now - lastReleaseTime) > multiClickThresholdTime)))          // we are outside of our multiClick threshold time.
			{
				cb_onClick(*this);                                                // Fire the onClick event.
				bitWrite(state, CLICKSENT, true);
			}
		}

		return bitRead(state, CURRENT);
	}

	// WARNING: function body substitution
    bool isPressed() const {

  		return bitRead(state, CURRENT);
		//return !digitalRead(&btns[pin]);
    }

	bool isReleased() const {

		return bitRead(state, CHANGED) && !bitRead(state, CURRENT);
	}

    bool stateChanged() const {

  		return bitRead(state, CHANGED);
    }

    bool uniquePress() const {

  		return (isPressed() && stateChanged());
    }

    unsigned int clicked() {

		if (bitRead(state, CLICKSENT) == false &&
			bitRead(state, CURRENT) == false &&
			((multiClickThresholdTime == 0) ||                                // We don't want multiClicks OR
			((millis() - lastReleaseTime) > multiClickThresholdTime)) &&	// we are outside of our multiClick threshold time.
			clickTimer < clickThresholdTime)	// we are outside of our multiClick threshold time.
		{
			bitWrite(state, CLICKSENT, true);
			return clickCount;
		}
		return 0;
    }

    bool held(unsigned long time = 0) {
		
		unsigned long threshold = time ? time : holdEventThresholdTime; //use holdEventThreshold if time == 0
		//should we trigger a onHold event?
		if (isPressed() && !triggeredHoldEvent)
		{
			if (millis() - pressedStartTime > threshold)
			{
				triggeredHoldEvent = true;
				return true;
			}
		}
		return false;
    }

    bool heldFor(unsigned long time) const {

		if (isPressed())
		{
			if (millis() - pressedStartTime > time)
			{
				return true;
			}
		}
		return false;
    }

    // Properties
    uint8_t getPin(void) const
    {
      return pin;
    }

    void setDebounceDelay(unsigned int debounceDelay) {

  		debounceDelayTime = debounceDelay;
    }

    void setHoldThreshold(unsigned int holdTime) {

  		holdEventThresholdTime = holdTime;
    }

    void setHoldRepeat(unsigned int repeatTime) {

  		holdEventRepeatTime = repeatTime;
    }

    void setMultiClickThreshold(unsigned int multiClickTime) {

  		multiClickThresholdTime = multiClickTime;
    }

    void pressHandler(buttonEventHandler handler) {

  		cb_onPress = handler;
    }

    void releaseHandler(buttonEventHandler handler) {

  		cb_onRelease = handler;
    }

    void clickHandler(buttonEventHandler handler) {

  		cb_onClick = handler;
    }

    void holdHandler(buttonEventHandler handler, unsigned long holdTime = 0) {

		setHoldThreshold(holdTime ? holdTime : DEFAULT_HOLDEVENTTHRESHOLDTIME);

		cb_onHold = handler;
    }

    unsigned long holdTime() const {

		if (isPressed())
		{
			return millis() - pressedStartTime;
		}
		else return 0;
	}

    unsigned long heldTime() const {

  		return millis() - pressedStartTime;
	}

    inline unsigned long presses() const {

      	return numberOfPresses;
    }

    inline unsigned int getClickCount() const {

      	return clickCount;
    }

    inline unsigned int getHoldRepeatCount() const {

      	return holdEventRepeatCount;
    }

    bool operator==(Button &rhs) {

  		return (this == &rhs);
	}

  private:
    uint8_t pin;
	uint32_t clickTimer;
    uint8_t mode;
    uint8_t state;
    unsigned long pressedStartTime;
    unsigned long debounceStartTime;
    unsigned long debounceDelayTime;
    unsigned long holdEventThresholdTime;
    unsigned long holdEventRepeatTime;
    unsigned long holdEventPreviousTime;
    unsigned long lastReleaseTime;
    unsigned long multiClickThresholdTime;
	unsigned long clickThresholdTime;
    buttonEventHandler cb_onPress;
    buttonEventHandler cb_onRelease;
    buttonEventHandler cb_onClick;
    buttonEventHandler cb_onHold;
    unsigned long numberOfPresses;
    unsigned int clickCount;
    unsigned int holdEventRepeatCount;
    bool triggeredHoldEvent;
};

#endif
// BUTTON_H