#pragma once

namespace stm32g431 {

    namespace adc {

        static inline void enableADC(ADC_TypeDef *adc)  {

            adc->ISR |= ADC_ISR_EOC;
            adc->ISR |= ADC_ISR_ADRDY; // Сброс флага готовности
            adc->CR |= ADC_CR_ADEN;    // Запуск АЦП
            while ((adc->ISR & ADC_ISR_ADRDY) == 0)
                ;                      // Ждём окончания инициализации АЦП
            adc->ISR |= ADC_ISR_ADRDY; // Сброс флага готовности
        }

        inline void disableADC(ADC_TypeDef *adc) {

            adc->CR |= ADC_CR_ADSTP; // Останавливаем идущие измерения
            while ((adc->CR) & ADC_CR_ADSTP)
                ;
            adc->CR |= ADC_CR_ADDIS; // Запускаем отключение АЦП
            while ((adc->CR) & ADC_CR_ADEN)
                ; // Ждём, пока не отключится
        }

        void calibrateADC(ADC_TypeDef *adc) {

            disableADC(adc);
            adc->CR |= ADC_CR_ADCAL; // Запускаем процедуру калибровки
            while ((adc->CR) & ADC_CR_ADCAL)
                ; // Ждём окончания процедуры калибровки
        }

        inline static void confADCpins(void) {

            RCC->AHB2ENR |= RCC_AHB2ENR_GPIOAEN;
            RCC->AHB2ENR |= RCC_AHB2ENR_GPIOBEN;
            // initPin_Analog(GPIOB,0); //L+
            // initPin_Analog(GPIOB,2); //L-
            // initPin_Analog(GPIOA,6); //R-
        }

        void
        initADC_Common(void) {

            RCC->AHB2ENR |= RCC_AHB2ENR_ADC12EN; // Затактовать АЦП
            RCC->CCIPR |= (0b11 << RCC_CCIPR_ADC12SEL_Pos);
            ADC12_COMMON->CCR |= (0b1000 << ADC_CCR_PRESC_Pos);
            ADC12_COMMON->CCR |= (0b01 << ADC_CCR_CKMODE_Pos);
            confADCpins();
        }
    }
}