#ifndef LED_H
#define LED_H

#define INLINE__ __attribute__((always_inline))

/* --- Services functions Begin --- */

INLINE__
static inline
void setupPinDiod(GPIO_TypeDef* port, uint8_t num) {

    port->MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + num * 2U ));    // reset pin mode
    port->MODER |= ( 0b01 << ( GPIO_MODER_MODE0_Pos + num * 2U ));  // set general purpose mode (GP output mode)
    port->OTYPER |=( 0b01 << ( GPIO_OTYPER_OT0_Pos + num ));    // output mode pin (open drain)
    port->PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + num * 2U ));    // no pull-up, no pull-down
    port->BSRR |= ( 0b01 << ( GPIO_BSRR_BS0_Pos + num ));    // set bit on ODR
}

struct Led_t {
    GPIO_TypeDef* port;
    uint8_t num;
};

INLINE__
static inline
void onLed(struct Led_t led) {
    led.port->BSRR |= (0b01 << (GPIO_BSRR_BR0_Pos + led.num));
}

INLINE__
static inline
void offLed(struct Led_t led) {
    led.port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + led.num));
}

/* --- End Services functions --- */

const uint8_t ledsSize = 25;
struct Led_t leds[ledsSize];

// TODO CALL THIS FUNC 1. from ctor and static bool flag or call in the place, using func labmda init{}()
static void initLeds() {
    
    // тактирование портов A, B, C, D (RM, p.152)
    RCC->IOPENR |= RCC_IOPENR_GPIOAEN;
    RCC->IOPENR |= RCC_IOPENR_GPIOBEN;
    RCC->IOPENR |= RCC_IOPENR_GPIOCEN;
    RCC->IOPENR |= RCC_IOPENR_GPIODEN;

    // set-up pins
    {
        int i = 0;
        // row1
        setupPinDiod(GPIOC, 6); leds[i].port = GPIOC; leds[i++].num = 6;    // led 1.1
        setupPinDiod(GPIOC, 7); leds[i].port = GPIOC; leds[i++].num = 7;    // led 1.2
        setupPinDiod(GPIOA, 11); leds[i].port = GPIOA; leds[i++].num = 11;    // led 1.3
        setupPinDiod(GPIOA, 12); leds[i].port = GPIOA; leds[i++].num = 12;    // led 1.4
        setupPinDiod(GPIOB, 9); leds[i].port = GPIOB; leds[i++].num = 9;    // led 1.5

        // row2
        setupPinDiod(GPIOA, 5); leds[i].port = GPIOA; leds[i++].num = 5;    // led 2.1
        setupPinDiod(GPIOA, 6); leds[i].port = GPIOA; leds[i++].num = 6;    // led 2.2
        setupPinDiod(GPIOA, 7); leds[i].port = GPIOA; leds[i++].num = 7;    // led 2.3
        setupPinDiod(GPIOD, 3); leds[i].port = GPIOD; leds[i++].num = 3;    // led 2.4
        setupPinDiod(GPIOB, 8); leds[i].port = GPIOB; leds[i++].num = 8;    // led 2.5

        // row3
        setupPinDiod(GPIOB, 10); leds[i].port = GPIOB; leds[i++].num = 10;    // led 3.1
        setupPinDiod(GPIOB, 2); leds[i].port = GPIOB; leds[i++].num = 2;    // led 3.2
        setupPinDiod(GPIOB, 0); leds[i].port = GPIOB; leds[i++].num = 0;    // led 3.3
        setupPinDiod(GPIOB, 3); leds[i].port = GPIOB; leds[i++].num = 3;    // led 3.4
        setupPinDiod(GPIOB, 7); leds[i].port = GPIOB; leds[i++].num = 7;    // led 3.5

        // row4
        setupPinDiod(GPIOB, 12); leds[i].port = GPIOB; leds[i++].num = 12;    // led 4.1
        setupPinDiod(GPIOB, 11); leds[i].port = GPIOB; leds[i++].num = 11;    // led 4.2
        setupPinDiod(GPIOB, 13); leds[i].port = GPIOB; leds[i++].num = 13;    // led 4.3
        setupPinDiod(GPIOB, 4); leds[i].port = GPIOB; leds[i++].num = 4;    // led 4.4
        setupPinDiod(GPIOB, 6); leds[i].port = GPIOB; leds[i++].num = 6;    // led 4.5

        // row5
        setupPinDiod(GPIOA, 8); leds[i].port = GPIOA; leds[i++].num = 8;    // led 5.1
        setupPinDiod(GPIOB, 15); leds[i].port = GPIOB; leds[i++].num = 15;    // led 5.2
        setupPinDiod(GPIOB, 14); leds[i].port = GPIOB; leds[i++].num = 14;    // led 5.3
        setupPinDiod(GPIOB, 5); leds[i].port = GPIOB; leds[i++].num = 5;    // led 5.4
        setupPinDiod(GPIOC, 13); leds[i].port = GPIOC; leds[i++].num = 13;    // led 5.5
    }
}

/* init function */
auto&& init = []() -> int {
    initLeds();
    return 0;
}();

class LED {

public:
    LED(uint8_t ledPin) {

        // checked range [1..25]
        if (ledPin < 1 || ledPin > 25) {
            ledPin = 1;    // by default pin == 1 (first led)
        }

        // change range (user) [1..25] -> (program) [0..24] (for indexes of array)
        --ledPin;

        pin = ledPin;

        value = 0;
        off();
    }

    bool getState() {

        return value;
    }

    void on() {

        onLed(leds[pin]);
        value = 1;
    }

    void off() {

        offLed(leds[pin]);
        value = 0;
    }

    void toggle() {

        value ? off() : on();
    }

    void blink(unsigned int time, byte times = 1) {

        for (byte i = 0; i < times; i++)
        {
            toggle();
            delay(time / 2);
            toggle();
            delay(time / 2);
        }
    }

    void setValue(byte val) {

        value = (val <= 127) ? 0 : 1;
        toggle();
        toggle();
    }

    void fadeIn(unsigned int time) {

        return;
    }

    void fadeOut(unsigned int time) {

        return;
    }

    bool value;

private:
    uint8_t pin;
};

#endif
// LED_H