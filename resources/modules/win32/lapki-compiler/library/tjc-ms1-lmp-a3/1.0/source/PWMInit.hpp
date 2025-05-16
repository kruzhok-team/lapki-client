#pragma once

namespace detail {

    namespace bss {

        // Класс, позволяющий описать информацию о пине, на который подается сигнал ШИМ
        struct PWMEntity {

            // Частота ШИМ, должна быть <= частоты таймера и делиться на нее нацело (желательно)
            // uint16_t frequency;

            // Вспомогательная переменная, помогает следить за нужной частотой для пина
            // Действие похоже на то, что наблюдается у прескейлера у таймера
            uint16_t frequencyPSC;
            uint16_t frequencyPSC_CNT;  // Теневой регистр, изменяемый в прерывании

            // Уровень, до которого пин активен, а после которого - неактивен (pwm duty cycle (скважность))
            uint16_t triggerLevel;

            // Текущий уровень относительно максимального (ака итератор скважности шим)
            uint16_t currentLevel;

            // Номер пина (в дальнейшем (т.е. на уровне выше) будет маппится к структуре, но не здесь)
            int8_t pin; // Если == -1, то значит, что запись пустая

            // userCallback - call every tick for pwm. Arg: bool - pwm signal high or low
            void (*callbackAction)(bool);
        };
    }

    namespace data {

        // Количество пинов, которые можем шимовать
        const int8_t SIZEPWM = 3;

        // Если ничего не работает - значит не хватает времени на обработку функции прерывания - необходимо увеличить период ниже
        const uint16_t PERIOD = 1000;

        // Шим тикает от [0 до MAX_LEVEL]
        const uint16_t MAX_LEVEL = 100;

        // clock rate of timer [Hz]
        // Частота у таймера = частота кристала / значение регистра arr
        const uint32_t clkRate = 64'000'000 /PERIOD;

        // Рекомендуемая частота ШИМ, устанавливаемая по умолчанию
        const uint32_t defaultFrequency = clkRate;

        detail::bss::PWMEntity buffer[detail::data::SIZEPWM];
    }

    namespace code {

        using namespace detail::bss;
        using namespace detail::data;

        using callbackPtr = void(*)(bool);
        
        void removePWMEntity(const int8_t pin) {
            
            for (int i = 0; i < SIZEPWM; ++i) {

                if (buffer[i].pin == pin) {
                    buffer[i].callbackAction(false);
                    buffer[i].pin = -1;
                    break;
                }
            }
        }

        void addPWMEntity(const int8_t pin, const uint16_t triggerLevel, callbackPtr ptr, const uint32_t frequency) {

            // remove old record about entity for this pin (if exist)
            removePWMEntity(pin);

            // find free entity
            int8_t entityI = -1;

            for (int i = 0; i < SIZEPWM; ++i) {

                if (buffer[i].pin == -1) {
                    entityI = i;
                    break;
                }
            }

            if (entityI == -1)
                return; // no more free entities

            buffer[entityI].frequencyPSC = clkRate /frequency;
            // check range possible values for frequencyPSC [1..]
            if (buffer[entityI].frequencyPSC < 1)
                buffer[entityI].frequencyPSC = 1;
            buffer[entityI].frequencyPSC_CNT = buffer[entityI].frequencyPSC;   // Когда 0 - срабатывает инкремент уровня (эмуляуция PSC в кристаллах)

            buffer[entityI].triggerLevel = triggerLevel;
            buffer[entityI].currentLevel = 0;

            buffer[entityI].callbackAction = ptr;

            // init a new pwm entity
            buffer[entityI].pin = pin;  // pin == id
        }

        // void addPWMEntity(const int8_t pin, const uint16_t triggerLevel, callbackPtr ptr) {

        //     addPWMEntity(pin, triggerLevel, ptr, defaultFrequency);
        // }
    }

    namespace hal {

        // Preparation and launch of modules necessary for the pwm work
        void initPWM() {

            RCC -> APBENR2 |= RCC_APBENR2_TIM14EN;
            TIM14 -> ARR = detail::data::PERIOD;
            TIM14 -> PSC = 0;   //  The counter clock frequency CK_CNT is equal to f (CK_PSC) / (PSC[15:0] + 1)
            TIM14 -> DIER |= TIM_DIER_UIE;
            TIM14 -> CR1 |= TIM_CR1_CEN;
            NVIC_SetPriority(TIM14_IRQn, 90);
            NVIC_EnableIRQ(TIM14_IRQn);

            for (int i = 0; i < detail::data::SIZEPWM; ++i) {
                detail::data::buffer[i].pin = -1;   // pwm-entity is free
            }
        }

        namespace api {

            using namespace detail::data;

            // Функция-прерывание, срабатывает каждый тик
            void TIM14_IRQHandlerMRX(void) {

                TIM14 -> SR &= ~TIM_SR_UIF;

                // Идем по всем записям о ШИМ
                for (int i = 0; i < SIZEPWM; ++i) {

                    // if entity is free - skip it
                    if (buffer[i].pin == -1)
                        continue;

                    // Обработка пинов: 2 этапа

                    // 1 этап: Активация или деактивация
                    // Допустим уровень срабатывания (СКВАЖНОСТЬ) - 70, а максимальный - 100. Тогда 70 импульсов мы активны
                    bool isActive = buffer[i].currentLevel < buffer[i].triggerLevel;
                    buffer[i].callbackAction(isActive);

                    // 2 этап: Инкремент уровня пина + соблюдение диапазона уровня
                    // Сначала обработаем прескейлер
                    // Из-за декремента его инициализирующее значение не может быть меньше 1
                    --buffer[i].frequencyPSC_CNT;

                    // Если == 0, то срабатывает изменение уровня, иначе ничего
                    if (buffer[i].frequencyPSC_CNT == 0) {

                        // reset psc
                        buffer[i].frequencyPSC_CNT = buffer[i].frequencyPSC;

                        // up level
                        ++buffer[i].currentLevel;

                        // check range for level
                        if (buffer[i].currentLevel > detail::data::MAX_LEVEL)
                            buffer[i].currentLevel = 0;
                    }
                }
            }
        }
    }
}

#ifdef __cplusplus
extern "C" {
#endif

// interrupt function for TIM14
void TIM14_IRQHandler(void) {

    detail::hal::api::TIM14_IRQHandlerMRX();
}

#ifdef __cplusplus
}
#endif