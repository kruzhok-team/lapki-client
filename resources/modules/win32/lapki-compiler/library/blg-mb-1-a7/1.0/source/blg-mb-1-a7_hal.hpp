#pragma once

#define BLG_MB_1_A7

#include "stm32g431xx.h"  // CMSIS
#include "system.hpp"
#include "Pins.hpp"
#include "RGBController.hpp"
#include "SoundController.hpp"
#include "ADC.hpp"
#include "commonEars.hpp"
#include "Pattern.hpp"

namespace mrx {

    namespace env {
        
        // Тактовая частота кристала микроконтроллера
        const uint32_t clkRate = 144'000'000;

        // Делитель для таймера на ШИМ, тут он равен 4.
        // Константу узнал опытным путем (при помощи счетчика срабатывания для функции прерывания)
        // TODO: pwm need perfomance
        const uint8_t pwmTimPSC = 4;
    }

    namespace hal {

        namespace button {

            const uint8_t minPin = 1;
            const uint8_t maxPin = 6;

            struct ButtonPort {

                GPIO_TypeDef* port;
                uint8_t num;
            };

            ButtonPort buttons[maxPin -minPin + 1] = {

                {GPIOC, 2},
                {GPIOB, 13},
                {GPIOA, 0},
                {GPIOD, 9},
                {GPIOF, 2},
                {GPIOD, 10},
            };

            // Это действие сркыто от компонента (LED, PWM, Button)
            const auto&& mapPin = [](const uint8_t pin) {

                // Возвращаем структуру, где содержиться порт и пин светодиода
                // -1 для конвертации в индексы
                return buttons[pin -1];
            };

            const auto&& initPin = [](const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);

                // GPIO enabled in system init file

                mappedPin.port->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + mappedPin.num * 2U)); // no pull-up, no pull-down
                mappedPin.port->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + mappedPin.num * 2U)); // reset power mode
            };

            const auto&& buttonRead = [](const uint8_t pin){

                auto&& mappedPin = mapPin(pin);

                return ((mappedPin.port->IDR >> mappedPin.num) & 0x01);
            };
        }

        namespace led {

            const uint8_t minPin = 1;
            const uint8_t maxPin = 35;

            struct LedPort {

                GPIO_TypeDef* port;
                uint8_t num;
            };

            LedPort leds[maxPin -minPin + 1] = {

                {GPIOE, 1},
                {GPIOD, 4},
                {GPIOD, 1},
                {GPIOD, 0},
                {GPIOA, 10},

                {GPIOE, 0},
                {GPIOE, 2},
                {GPIOD, 3},
                {GPIOD, 2},
                {GPIOA, 9},

                {GPIOB, 9},
                {GPIOE, 3},
                {GPIOC, 12},
                {GPIOC, 11},
                {GPIOA, 8},

                {GPIOB, 5},
                {GPIOE, 4},
                {GPIOD, 7},
                {GPIOC, 10},
                {GPIOC, 9},

                {GPIOE, 6},
                {GPIOE, 5},
                {GPIOB, 3},
                {GPIOD, 5},
                {GPIOC, 8},

                {GPIOC, 13},
                {GPIOD, 6},
                {GPIOD, 12},
                {GPIOD, 13},
                {GPIOC, 7},

                {GPIOF, 10},
                {GPIOF, 9},
                {GPIOD, 11},
                {GPIOD, 15},
                {GPIOC, 6},
            };

            // Это действие сркыто от компонента (LED, PWM)
            const auto&& mapPin = [](const uint8_t pin) {

                // Возвращаем структуру, где содержиться порт и пин светодиода
                // -1 для конвертации в индексы
                return leds[pin -1];
            };

            const auto&& initPin = [](const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);

                // GPIO enabled in system init file

                mappedPin.port->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + mappedPin.num * 2U)); // reset pin mode
                mappedPin.port->MODER |= (0b01 << (GPIO_MODER_MODE0_Pos + mappedPin.num * 2U));  // set general purpose mode (GP output mode)
                mappedPin.port->OTYPER |= (0b01 << (GPIO_OTYPER_OT0_Pos + mappedPin.num));       // output mode pin (open drain)
                mappedPin.port->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + mappedPin.num * 2U)); // no pull-up, no pull-down
                mappedPin.port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + mappedPin.num));           // set bit on ODR
            };

            __attribute__((always_inline)) inline void onPin(const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);

                mappedPin.port->BSRR |= (0b01 << (GPIO_BSRR_BR0_Pos + mappedPin.num));
            }

            __attribute__((always_inline)) inline void offPin(const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);

                mappedPin.port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + mappedPin.num));
            }
        }

        namespace matrix {

            const uint8_t COL_COUNT = 5;
            const uint8_t ROW_COUNT = 7;
            const uint8_t LEDS_COUNT = COL_COUNT *ROW_COUNT;
        }

        namespace rgbLed {

            const uint8_t minPin = 1;
            const uint8_t maxPin = 2;

            const uint8_t rgbLedsCount = maxPin -minPin +1;

            struct RgbLedPort {

                mrx::hal::led::LedPort rgbLeds[3];   // red, green, blue
            };

            RgbLedPort leds[rgbLedsCount] = {

                { {{GPIOE, 9 }, {GPIOE, 10}, {GPIOE, 11}} },     // left eye
                { {{GPIOE, 13}, {GPIOE, 14}, {GPIOE, 15}} },     // right eye
            };

            // Это действие сркыто от компонента (RgbLed, PWM)
            const auto&& mapPin = [](const uint8_t pin) {

                // Возвращаем структуру, где содержиться порт и пин светодиода
                // -1 для конвертации в индексы
                return leds[pin -1];
            };

            const auto&& initPin = [](const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);

                // GPIO enabled in system init file

                for (int i(0); i < 3; ++i) {    // red, green, blue

                    mappedPin.rgbLeds[i].port->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + mappedPin.rgbLeds[i].num * 2U)); // reset pin mode
                    mappedPin.rgbLeds[i].port->MODER |= (0b01 << (GPIO_MODER_MODE0_Pos + mappedPin.rgbLeds[i].num * 2U));  // set general purpose mode (GP output mode)
                    mappedPin.rgbLeds[i].port->OTYPER |= (0b01 << (GPIO_OTYPER_OT0_Pos + mappedPin.rgbLeds[i].num));       // output mode pin (open drain)
                    mappedPin.rgbLeds[i].port->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + mappedPin.rgbLeds[i].num * 2U)); // no pull-up, no pull-down
                    mappedPin.rgbLeds[i].port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + mappedPin.rgbLeds[i].num));           // set bit on ODR
                }
            };

            detail::hal::RGBController rgbControllers[rgbLedsCount] = {};

            __attribute__((always_inline)) inline void onPin(const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);
                auto&& c = rgbControllers[pin-1];

                // Защита от бесконечного цикла при неправильно заданном цвете
                // TODO: Если таких цветов в системе не будет, или будет проверятся в месте, где это можно проверить единожды, то лучше вынести туда
                // if (!c.color->colorsValue[0] && !c.color->colorsValue[1] && !c.color->colorsValue[2] && !c.color->colorsValue[3]) {
                //     return;
                // }

                bool isChanged = false;

                // Если пора менять цвет
                while (c.value == c.color->colorsValue[c.currColor]) {

                    // Выключаем старый, если он был включён (+ скипаем выключение чёрного)
                    if (c.value > 0 && c.currColor < 3) {
                        mappedPin.rgbLeds[c.currColor].port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + mappedPin.rgbLeds[c.currColor].num));
                    }
                    c.value = 0;
                    c.currColor = c.currColor == 3 ? 0 : ++c.currColor;
                    isChanged =  true;
                }

                // activate need color if need
                if (isChanged) {

                    if (c.currColor < 3) {

                        mappedPin.rgbLeds[c.currColor].port->BSRR |= (0b01 << (GPIO_BSRR_BR0_Pos + mappedPin.rgbLeds[c.currColor].num));
                    }
                }

                ++c.value;
            }

            const auto&& offPin = [](const uint8_t pin) {

                auto&& mappedPin = mapPin(pin);
                auto&& c = rgbControllers[pin-1];

                // turn off rgb controller
                c.color = nullptr;
                
                // off last led (строго после выключения контроллера, потому что в любой момент может вызваться функция-прерывание)
                if (c.currColor < 3)
                    mappedPin.rgbLeds[c.currColor].port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + mappedPin.rgbLeds[c.currColor].num));

                // reset rgb controller
                c.currColor = 0;
                c.value = 0;
            };
            
            const auto&& registerPin = [](const uint8_t pin, detail::Color* color) {

                offPin(pin);

                rgbControllers[pin-1].color = color;
            };

            const auto&& unregisterPin = [](const uint8_t pin) {

                rgbControllers[pin-1].color = nullptr;
                offPin(pin);
            };
        
            __attribute__((always_inline)) inline void interruptFunc() {

                // handle rgb leds
                for (int i(0); i < rgbLedsCount; i++) {

                    auto& c = rgbControllers[i];

                    if (c.color != nullptr) {

                        onPin(i+1);
                    }
                }
            }

            // #include "RgbLed.hpp"
        }

        namespace photoDiode {

            GPIO_TypeDef* port = GPIOB;
            const uint8_t num = 14;

            namespace detail {

                void enableADC(ADC_TypeDef* adc) {

                    adc -> ISR |= ADC_ISR_EOC;
                    adc -> ISR |= ADC_ISR_ADRDY; //Сброс флага готовности
                    adc -> CR |= ADC_CR_ADEN; //Запуск АЦП
                    while (( adc -> ISR & ADC_ISR_ADRDY ) == 0); //Ждём окончания инициализации АЦП

                    adc -> ISR |= ADC_ISR_ADRDY; //Сброс флага готовности
                }

                void disableADC (ADC_TypeDef* adc) {

                    adc -> CR |= ADC_CR_ADSTP; //Останавливаем идущие измерения
                    while ((adc -> CR) & ADC_CR_ADSTP);
                    adc -> CR |= ADC_CR_ADDIS; //Запускаем отключение АЦП
                    while ((adc -> CR) & ADC_CR_ADEN); //Ждём, пока не отключится
                }

                void calibrateADC(ADC_TypeDef* adc) {

                    disableADC(adc);
                    adc -> CR |= ADC_CR_ADCAL; //Запускаем процедуру калибровки
                    while((adc -> CR ) & ADC_CR_ADCAL); //Ждём окончания процедуры калибровки
                }
            }

            const auto&& init = []() {
                
                // GPIO enabled in system init file

                // initADC_Common
                RCC -> AHB2ENR |= RCC_AHB2ENR_ADC12EN; //Затактовать АЦП
                RCC -> CCIPR |= ( 0b11 << RCC_CCIPR_ADC12SEL_Pos);
                ADC12_COMMON -> CCR |= ( 0b1000 << ADC_CCR_PRESC_Pos );
                ADC12_COMMON -> CCR |= ( 0b01 << ADC_CCR_CKMODE_Pos );

                // initPin
                stm32g431::periphery::initPin_Analog(port, num); // 1+

                // initADC1
                ADC1 -> CR |= ADC_CR_ADDIS;
                ADC1 -> CR &= ~ADC_CR_DEEPPWD;
                ADC1 -> CR |= ADC_CR_ADVREGEN;
                delay(3); //p277 s14.3.2 RM0454
                ADC1 -> CFGR |= ADC_CFGR_CONT; //Непрерывный режим. Не забыть ADSTART
                ADC1 -> SMPR1 = ( 0b101 << ADC_SMPR1_SMP3_Pos ); //Частота сэмплирования. Торопиться некуда. Около 17 микросекунд
                ADC1 -> CFGR &= ~ ADC_CFGR_RES_Msk; //Разрешение 12 бит.
                ADC1 -> CFGR &= ~ ADC_CFGR_ALIGN; //Выравнивание вправо, для 12 бит самое то.
                ADC1 -> CFGR |= ADC_CFGR_OVRMOD; //Перезаписывание непрочтённых данных
                //ADC1 -> DIFSEL |= ADC_DIFSEL_DIFSEL_1;
                ADC1 -> SQR1 = ( 0 << ADC_SQR1_L_Pos )
                            | ( 5 << ADC_SQR1_SQ1_Pos ) //RM0440 p392 t69
                            ;
                //Калибровка
                detail::calibrateADC(ADC1);
            };

            const auto&& start = []() {

                detail::enableADC(ADC1);
                ADC1 -> CR |= ADC_CR_ADSTART;
            };

            const auto&& stop = []() {

                detail::disableADC(ADC1);
                // TODO: ADC_CR_ADSTP ?
                // ADC1 -> CR |= ADC_CR_ADSTP;
            };

            const auto&& getSense = []() -> int16_t {

                return ADC1->DR;
            };
        }

        namespace pwm {

            // Устанавливается непосредствеено в PWM модуле
            void (*interruptFunc)() = nullptr;

            const uint8_t pinQuantity = 35;
            const uint16_t period = 1000;

            bool isInitTIM2 = false;

            // Preparation and launch of modules necessary for the pwm work
            void enablePWMTIM2() {

                if (!isInitTIM2) {

                    RCC -> APB1ENR1 |= RCC_APB1ENR1_TIM2EN;

                    TIM2 -> ARR = period;
                    TIM2 -> PSC = 0;   //  The counter clock frequency CK_CNT is equal to f (CK_PSC) / (PSC[15:0] + 1)
                    TIM2 -> DIER |= TIM_DIER_UIE;
                    TIM2 -> CR1 |= TIM_CR1_CEN;
                    NVIC_SetPriority(TIM2_IRQn, 0); // TODO: maybe set interrupt priorety == 90?
                    NVIC_EnableIRQ(TIM2_IRQn);

                    isInitTIM2 = true;
                }
            }

            // Инициализирует все пины, которые могут использоваться при работе ШИМ
            const auto&& initPWMPins = []() {
                
                for (uint8_t i(0); i < mrx::hal::led::maxPin; ++i) {

                    mrx::hal::led::initPin(i+1);
                }
            };

            // Смотрит на пин и перенаправляет на нужную функцию активации
            // Так как все светодиоды и активируются одинакого, то просто onPin / offPin вызываем
            __attribute__((always_inline)) inline void managePin(const uint8_t pin, const bool isActive) {

                if (isActive)
                    mrx::hal::led::onPin(pin);
                else
                    mrx::hal::led::offPin(pin);
            }
        }

        namespace microphone {

            uint32_t detectedLevel{};
            bool isActive{};

            namespace detail {

                void initDetector() {
                    
                    RCC -> APB2ENR |= RCC_APB2ENR_TIM15EN;
                    TIM15 -> CR1 &= ~TIM_CR1_CEN;
                    TIM15 -> CNT = 0 ;
                    TIM15 -> ARR = 5;
                    TIM15 -> PSC = 299;
                    TIM15 -> DIER |= TIM_DIER_UIE;
                    TIM15 -> CR1 |= TIM_CR1_CEN;

                    NVIC_EnableIRQ(TIM1_BRK_TIM15_IRQn);
                    //NVIC_SetPriority(TIM1_BRK_TIM15_IRQn,15); //Посчитать аккуратнее
                }
                
                void enableDetector(bool que) {

                    if ( que ) {
                        TIM15 -> CR1 |= TIM_CR1_CEN;
                        detectedLevel = 0;
                    }
                    else {
                        TIM15 -> CR1 &= ~TIM_CR1_CEN;
                    }
                }

                void resetDetector() {
                    detectedLevel = 0;
                }
            }

            namespace api {

                using namespace stm32g431::ears;
                
                void init() {
                        
                    auto gain = OP_GAIN_2;

                    initADC_Common();
                    initOPAMP2();
                    initOPAMP3();
                    hw_setGain(OPAMP2,gain);
                    hw_setGain(OPAMP3,gain);
                    initADC2();
                    initDMA();
                }

                uint16_t senseLeft() {

                    return stm32g431::ears::scanEarL();
                }

                uint16_t senseRight() {

                    return stm32g431::ears::scanEarR();
                }
            }
        }

        namespace matrixAnimation {

            // Устанавливается непосредствеено в MatrixAnimation модуле
            void (*interruptFunc)() = nullptr;
            
            const uint32_t matrixAnimPwm = 100; // 1000ms /100 вызовов = 10ms на вызов
            auto timeLevel = 1000 / matrixAnimPwm; // Сколько ms на 1 отрезок (вызов) (число выше)

            volatile uint16_t currLevel{};
            volatile uint16_t animLevel{1};
        }
        
        namespace speaker {

            GPIO_TypeDef* port = GPIOA;
            const uint8_t num = 4;

            const uint32_t speakerPwm = 40000;
            uint16_t currLevel{};
            uint16_t speakerLevel{1};

            volatile ::detail::hal::SoundController soundController{};

            namespace detail {

                __attribute__((always_inline)) inline void setDAC(uint16_t value) {

                    // ch1
                    DAC1 -> DHR12R1 = value;
                    DAC1 -> SWTRIGR |= DAC_SWTRIGR_SWTRIG1;
                }

                void initDAC(void) {

                    // power
                    // * GPIO enabled in system init file
                    RCC -> AHB2ENR |= RCC_AHB2ENR_DAC1EN;

                    // set-up DAC

                    // ch1
                    DAC1 -> CR |= DAC_CR_EN1;
                    while(( DAC1 -> SR & DAC_SR_DAC1RDY ) == 0 );

                    DAC1 -> CR &= ~DAC_CR_TSEL1;
                    DAC1 -> CR |= ( 0b000 << DAC_CR_TSEL1_Pos );

                    DAC1 -> MCR &= ~DAC_MCR_MODE1;
                    DAC1 -> MCR |= ( 0b001 << DAC_MCR_MODE1_Pos );

                    setDAC(2048);

                    // init pins
                    stm32g431::periphery::initPin_Analog(port, num);  // out 1
                }
            
                __attribute__((always_inline)) inline void resetSound() {

                    // Сначала сбрасываем указатель
                    soundController.sound = nullptr;

                    soundController.index = 0;

                    soundController.curr = 0;
                    soundController.total = 0;
                }
            
                // map duration (ms) to cycles
                uint32_t dur2Cycles(const uint32_t duration) {

                    // cycles in 1 ms
                    const uint32_t part = speakerPwm /1000;     // 1000 ms in 1 second

                    return duration *part;
                }
            }

            // init DAC (but not timer!)
            const auto&& init = []() {

                detail::initDAC();
            };

            const auto&& startSound = [](Sound* sound, const uint32_t duration) {
                
                detail::resetSound();

                uint32_t changedDuration = duration;
                if (sound->prescaler > 0)
                    changedDuration = duration /sound->prescaler;

                const auto&& cycles = detail::dur2Cycles(changedDuration);

                soundController.total = cycles;
                speakerLevel = sound->prescaler;
                // Устанавливаем указатель после того, как остальные поля заполнены
                soundController.sound = sound;
            };

            __attribute__((always_inline)) inline void stopSound() {

                detail::resetSound();
            }

            __attribute__((always_inline)) inline void interruptFunc() {

                // if playing
                if (soundController.sound != nullptr) {

                    // play
                    detail::setDAC(soundController.sound->sound[soundController.index]);

                    // inc progress
                    ++soundController.curr;
                    // is end?
                    if (soundController.curr >= soundController.total) {
                        stopSound();
                        return;
                    }

                    // inc index
                    ++soundController.index;
                    // Check range index
                    if (soundController.index >= soundController.sound->size) {

                        soundController.index = 0;
                    }
                }
            }


            namespace api {
                using namespace stm32g431::ears;
                void init() {
                    
                    auto gain = OP_GAIN_2;

                    initADC_Common();
                    initOPAMP2();
                    initOPAMP3();
                    hw_setGain(OPAMP2,gain);
                    hw_setGain(OPAMP3,gain);
                    initADC2();
                    initDMA();
                }

                uint16_t senseLeft() {

                    return ADC2->DR;
                }

                uint16_t senseRight() {

                    return ADC1->DR;
                }
            }
        }

        namespace random {

            //Не работает :(
            __attribute__((optimize("O0"))) uint32_t mkSeed(void) {

                RCC -> AHB2ENR |= RCC_AHB2ENR_RNGEN;
                RCC -> CCIPR &= ~RCC_CCIPR_CLK48SEL_Msk;
                RNG -> CR |= RNG_CR_RNGEN;
                RNG -> CR |= RNG_CR_CED;
                volatile uint32_t result;
                while (!(((volatile uint32_t)(RNG->SR)) & RNG_SR_DRDY ));
                result = RNG -> DR;
                if ( result == 0 )
                    return SysTick -> VAL;
                else
                    return result;
            }
        }

        namespace pwm {

            #include "CommonPWM.hpp"
        }

        namespace init {

            // init mcu (modules, etc)
            // Важно понимать, что эта функция может вызваться после конструирования компонентов!
            // Поэтому нужно смотреть - если компонент уже инициализировал какой-то модуль контроллера - его лучше не трогать!
            const auto&& init = []() {
            };
        }
    }
}