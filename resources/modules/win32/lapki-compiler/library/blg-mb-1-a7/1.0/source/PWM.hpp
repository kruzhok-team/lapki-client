#pragma once

#include "Connector.hpp"
#include "PWMInit.hpp"

namespace detail {

    namespace pwm {

        bool isInit = false;
    }
}

// Класс-прокси
// Фактически является прокси-классом, предоставляющим api для работы с ШИМ
class PWM {

    public:

        // ctor
        PWM() {

            if (!detail::pwm::isInit) {
                
                // Инициализируем шим пины
                mrx::hal::pwm::initPWMPins();
                // Инициализируем структуры нашего вспомогательного модуля шим
                detail::hal::initPWM();

                mrx::hal::pwm::interruptFunc = detail::hal::api::PwmHandler;
                
                // И только после этого запускаем шим на мк
                mrx::hal::pwm::enablePWMTIM2();

                detail::pwm::isInit = true;
            }
        }

        // Generate a PWM signal with a specified duty cycle on a specified pin
        // duty in range [ 0 .. detail::data::MAX_LEVEL ]
        // pin depends on the specific board and is already specifically implemented through callback function
        // pin value use more as an identifier
        void write(const uint8_t duty, const int8_t pin) const {

            // if need to turn on pwm on pin
            if (duty != 0) {
                if (connector::isPwmPin(pin) != -1)
                    detail::code::addPWMEntity(pin, duty);
            }
            else {
                detail::code::removePWMEntity(pin);
            }
        }

        // overload for write(...) with specified frequency argument
        // frequency [Hz]
        void write(const uint8_t duty, const int8_t pin, uint32_t frequency) const {

            // check frequency range
            if (frequency <= 0)
                frequency = 1;
            else if (frequency > detail::data::pwmRate)
                frequency = detail::data::pwmRate;

            detail::code::setFrequency(frequency);

            write(duty, pin);
        }

        uint8_t getLevel(const uint8_t pin) {

            return detail::code::getLevel(pin);
        }

        // Generate a PWM signal with a specified frequency and duty cycle on a specified pin
        void PWMTone(const uint32_t frequency, const uint8_t duty, const int8_t pin, const uint64_t duration) const {

            // call write

            // call function from pwm::api for delete from sheduler duration manager
            // it is separate entity
        }
};