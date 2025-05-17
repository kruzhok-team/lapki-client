#pragma once

#include "PWMHelpers.hpp"

namespace detail {

    namespace bss {

        // Частота ШИМ, должна быть <= частоты таймера и делиться на нее нацело (желательно)
        // uint16_t frequency;
        // Вспомогательная переменная, помогает следить за нужной частотой для пина
        // Действие похоже на то, что наблюдается у прескейлера у таймера
        uint16_t frequencyPSC;
        uint16_t frequencyPSC_CNT;  // Теневой регистр, изменяемый в прерывании

        // Класс, позволяющий описать информацию о пине, на который подается сигнал ШИМ
        struct PWMEntity {

            // Уровень, до которого пин активен, а после которого - неактивен (pwm duty cycle (скважность))
            uint16_t triggerLevel;

            // Текущий уровень относительно максимального (ака итератор скважности шим)
            uint16_t currentLevel;

            // Номер пина (в дальнейшем (т.е. на уровне выше) будет маппится к структуре, но не здесь)
            int8_t pin; // Если == -1, то значит, что запись пустая
        };
    }

    namespace data {

        // Количество пинов, которые можем шимовать
        const int8_t SIZE = mrx::hal::pwm::pinQuantity +1;

        // Если ничего не работает - значит не хватает времени на обработку функции прерывания - необходимо увеличить период ниже
        const uint16_t PERIOD = mrx::hal::pwm::period;

        // Шим тикает от [0 до MAX_LEVEL]
        const uint16_t MAX_LEVEL = 100;

        // clock rate of timer [Hz] for pwm management
        // Частота у таймера = частота кристала / значение регистра arr (PERIOD записывается в arr)
        // Также могут быть дополнительные делители частоты
        const uint32_t pwmRate = mrx::env::clkRate /PERIOD /mrx::env::pwmTimPSC /MAX_LEVEL;

        // Рекомендуемая частота ШИМ, устанавливаемая по умолчанию
        const uint32_t defaultFrequency = pwmRate;

        detail::bss::PWMEntity buffer[detail::data::SIZE];

        // Эта функция дергается из прерывания, поэтому лучше сделать все предпосылки для возможности ее inline
        const connector::actFuncType callbackAction = mrx::hal::pwm::managePin;
    }

    namespace code {

        using namespace detail::bss;
        using namespace detail::data;
        
        __attribute__((always_inline)) inline void removePWMEntity(const int8_t pin) {

            // forget pin
            buffer[pin].pin = -1;

            // Теперь, когда функция-прерывание не дернет этот пин, мы можем сбросить состояние на нем
            // off pin
            detail::data::callbackAction(pin, false);
        }

        void addPWMEntity(const int8_t pin, const uint16_t triggerLevel) {

            // remove old record about entity for this pin (if exist)
            removePWMEntity(pin);

            // fill fields of entity
            buffer[pin].triggerLevel = triggerLevel;
            buffer[pin].currentLevel = detail::data::MAX_LEVEL;
            
            // init a new pwm entity
            // Пин устанавливается последним, так как в любой момент может вызваться функция-прерывание
            // И если пин будет установлен, а остальное не до конца, то функция-прерывание будет думать, что это корректная запись о шим-пине
            // И мы можем попасть в UB
            // Для функции remoteEntity выше логика такая-же
            // Только там сначала затираем пин, делая запись неактивной, а потом уже затираем остальные поля
            buffer[pin].pin = pin;  // pin == id
        }
        
        void setFrequency(const uint32_t frequency) {
            
            auto frequencyPSC__ = pwmRate /frequency;
            // check range possible values for frequencyPSC [1..]
            if (frequencyPSC__ < 1)
                frequencyPSC__ = 1;

            frequencyPSC = frequencyPSC__;
            frequencyPSC_CNT = frequencyPSC;
        }

        uint8_t getLevel(const uint8_t pin) {

            if (buffer[pin].pin == -1)
                return 0;

            return buffer[pin].triggerLevel;
        }
    }

    namespace hal {

        // Инициализируем буфер (в начале работы шим на всех пинах выключен)
        void initPWM() {

            for (int i = 0; i < detail::data::SIZE; ++i) {
                detail::data::buffer[i].pin = -1;   // pwm-entity is free
            }
            detail::bss::frequencyPSC = 2;
            detail::bss::frequencyPSC_CNT = 1;
        }

        namespace api {

            using namespace detail::data;
            using detail::bss::frequencyPSC_CNT;
            using detail::bss::frequencyPSC;

            // Функция-прерывание, срабатывает каждый тик
            void PwmHandler(void) {

                // Обработка пинов: 2 этапа

                // 1 этап: Инкремент уровня пина + соблюдение диапазона уровня
                // Сначала обработаем прескейлер
                // Из-за декремента его инициализирующее значение не может быть меньше 1
                --frequencyPSC_CNT;

                // Если == 0, то срабатывает изменение уровня, иначе ничего
                if (frequencyPSC_CNT == 0) {

                    // Идем по всем записям о ШИМ
                    for (int i = 0; i < SIZE; ++i) {

                        // Если запись пустая - пропускаем ее
                        if (buffer[i].pin == -1)
                            continue;

                        // Дергать функцию будем только при надобности (изменение текущего уровня относительно уровня срабатывания)
                        bool needChanged = false;

                        // up level
                        ++buffer[i].currentLevel;

                        // check range for level
                        if (buffer[i].currentLevel > detail::data::MAX_LEVEL) {

                            buffer[i].currentLevel = 0;
                            needChanged = true;
                        }
                        else if (buffer[i].currentLevel == buffer[i].triggerLevel) {

                            needChanged = true;
                        }

                        if (needChanged) {
                            
                            // 2 этап: Активация или деактивация
                            // Допустим уровень срабатывания (СКВАЖНОСТЬ) - 70, а максимальный - 100. Тогда 70 импульсов мы активны
                            bool isActive = buffer[i].currentLevel < buffer[i].triggerLevel;
                            detail::code::callbackAction(buffer[i].pin, isActive);
                        }
                    }

                    // reset psc
                    frequencyPSC_CNT = frequencyPSC;
                }
            }
        }
    }
}