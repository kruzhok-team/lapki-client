#pragma once

/*
    Файл коннектор для главной платы и кнопочной платы (main-a4, btn-a2)
    Он содержит пины, которые доступны для ШИМ,
    а также функции, необходимые для их активации или деактивации
*/

// Инициализация пинов, которые используются для ШИМ
auto&& init = []() -> int {
    
    RCC -> IOPENR |= RCC_IOPENR_GPIOAEN; // тактирование

    for (int i = 5; i < 8; ++i) {

        GPIOA->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + i * 2U)); // reset pin mode
        GPIOA->MODER |= (0b01 << (GPIO_MODER_MODE0_Pos + i * 2U));  // set general purpose mode (GP output mode)
        GPIOA->OTYPER &= ~(GPIO_OTYPER_OT0 << i);       // output mode pin (PP)
        GPIOA->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + i * 2U)); // no pull-up, no pull-down
        GPIOA->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + i));           // set bit on ODR

        GPIOA->BSRR |= ( GPIO_BSRR_BR0 << i );
    }
    
    return 0;
}();

namespace Connector {

    namespace actFuncs {

        // on or off leds

        void led1(const bool isActive) {
            
            if (isActive)
                GPIOA->BSRR |= ( GPIO_BSRR_BS0 << 5 );
            else
                GPIOA->BSRR |= ( GPIO_BSRR_BR0 << 5 );
        }

        void led2(const bool isActive) {
            
            if (isActive)
                GPIOA->BSRR |= ( GPIO_BSRR_BS0 << 6 );
            else
                GPIOA->BSRR |= ( GPIO_BSRR_BR0 << 6 );
        }

        void led3(const bool isActive) {
            
            if (isActive)
                GPIOA->BSRR |= ( GPIO_BSRR_BS0 << 7 );
            else
                GPIOA->BSRR |= ( GPIO_BSRR_BR0 << 7 );
        }
    }

    using actFuncType = void(*)(bool);

    struct Entity {
        uint8_t pin;
        actFuncType actFunc;
    };

    const int SIZEBuf = 3;
    const Entity pwmPins[] = {{1, actFuncs::led1}, {2, actFuncs::led2}, {3, actFuncs::led3}};

    namespace Api {

        bool isPwmPin(const uint8_t pin) {

            for (int i = 0; i < Connector::SIZEBuf; ++i) {

                if (pwmPins[i].pin == pin)
                    return true;
            }

            return false;
        }

        actFuncType getActFunc(const uint8_t pin) {

            for (int i = 0; i < Connector::SIZEBuf; ++i) {

                if (pwmPins[i].pin == pin)
                    return pwmPins[i].actFunc;
            }
            
            return nullptr;
        }
    }
}