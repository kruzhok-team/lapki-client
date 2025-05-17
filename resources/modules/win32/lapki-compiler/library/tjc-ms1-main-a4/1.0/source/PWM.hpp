#pragma once

#include "PWMInit.hpp"
#include "Connector.hpp"

bool isInit = false;

// Класс-прокси
// Фактически является прокси-классом, предоставляющим api для работы с ШИМ
class PWM {

    public:

        //static bool isInit;

        // ctor
        PWM() {
            if (!isInit) {
                detail::hal::initPWM();
                isInit = true;
            }
        }

        // Generate a PWM signal with a specified duty cycle on a specified pin
        // duty in range [ 0 .. detail::data::MAX_LEVEL ]
        // pin depends on the specific board and is already specifically implemented through callback function
        // pin value use more as an identifier
        void write(const uint8_t duty, const int8_t pin) const {

            write(duty, pin, detail::data::defaultFrequency);
        }

        // overload for write(...) with specified frequency argument
        // frequency [Hz]
        void write(const uint8_t duty, const int8_t pin, uint32_t frequency) const {

            // check frequency range
            if (frequency <= 0)
                frequency = 1;
            else if (frequency > detail::data::clkRate)
                frequency = detail::data::clkRate;

            // if need to turn on pwm on pin
            if (duty != 0) {
                
                auto actFunc = Connector::Api::getActFunc(pin);
                // if pin is supported
                if (actFunc != nullptr) {

                    detail::code::addPWMEntity(pin, duty, actFunc, frequency);
                }
            } else {
                detail::code::removePWMEntity(pin);
            }
        }

        // Generate a PWM signal with a specified frequency and duty cycle on a specified pin
        void PWMTone(const uint32_t frequency, const uint8_t duty, const int8_t pin, const uint64_t duration) const {

            // call write

            // call function from pwm::api for delete from sheduler duration manager
            // it is separate entity
        }
};