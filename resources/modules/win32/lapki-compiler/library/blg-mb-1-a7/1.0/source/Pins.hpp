#pragma once

// CHECK: changes pins functions

namespace stm32g431 {

    namespace periphery {
        
        #define ON 1
        #define OFF 2
        #define TOGGLE 3
        #define READ 4

        // Инициализация пина в IO с открытым стоком
        void initPin_OD(GPIO_TypeDef *port, const uint8_t number) {

            port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
            port -> MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
            port -> MODER |= ( 0b01 <<
                ( GPIO_MODER_MODE0_Pos + number * 2U ));
            port -> OTYPER |= ( GPIO_OTYPER_OT0 << number );
            port -> BSRR |= ( GPIO_BSRR_BS0 << number );
        }

        /*
            Установление уровня пина в режиме открытого стока
            Отличается от тяни-толкая инверсией значения
            Это для светодиодиков :/
                ON — низкий
                OFF — плавающий
                TOGGLE — изменить состояние
                READ — прочитать установленное значение
        */
        uint8_t setPin_OD(GPIO_TypeDef *port, const uint8_t number, const uint8_t x) {

            switch (x) {
                case ON:
                port -> BSRR |= ( GPIO_BSRR_BR0 << number );
                return ON;
                case OFF:
                port -> BSRR |= ( GPIO_BSRR_BS0 << number );
                return OFF;
                case TOGGLE:
                port -> ODR ^= ( GPIO_ODR_OD0 << number );
                return TOGGLE;
                case READ:
                return (port -> ODR & ( GPIO_ODR_OD0 << number )) > 0;
                return READ;
            };
            return READ;
        }

        // Инициализация пина на периферию, открытый сток
        void initPin_AF_OD(GPIO_TypeDef *port, const uint8_t number, const uint8_t af) {

            port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
            port -> OTYPER |= ( 0b1 << ( GPIO_OTYPER_OT0_Pos + number * 1U ));
            port -> MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
            port -> MODER |=   ( 0b10 << ( GPIO_MODER_MODE0_Pos + number * 2U ));

            if ( number < 8 ) {
                port -> AFR[0] &= ~ ( 0b1111 << ( GPIO_AFRL_AFSEL0_Pos + number * 4U ));
                port -> AFR[0] |=   ( ( af & 0b1111 ) << ( GPIO_AFRL_AFSEL0_Pos + number * 4U ));
            }
            else {
                port -> AFR[1] &= ~ ( 0b1111 << ( GPIO_AFRH_AFSEL8_Pos + number * 4U ));
                port -> AFR[1] |=   ( ( af & 0b1111 ) << ( GPIO_AFRH_AFSEL8_Pos + ( number-8 ) * 4U ));
            }
        }

        // Инициализация пина на периферию, тяни-толкаем
        void initPin_AF_PP(GPIO_TypeDef *port, const uint8_t number, const uint8_t af) {

            port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
            port -> OTYPER &= ~ ( 0b1 << ( GPIO_OTYPER_OT0_Pos + number * 1U ));
            port -> MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
            port -> MODER |=   ( 0b10 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
            
            if ( number < 8 ) {
                port -> AFR[0] &= ~ ( 0b1111 << ( GPIO_AFRL_AFSEL0_Pos + number * 4U ));
                port -> AFR[0] |=   ( ( af & 0b1111 ) << ( GPIO_AFRL_AFSEL0_Pos + number * 4U ));
            }
            else {
                port -> AFR[1] &= ~ ( 0b1111 << ( GPIO_AFRH_AFSEL8_Pos + number * 4U ));
                port -> AFR[1] |=   ( ( af & 0b1111 ) << ( GPIO_AFRH_AFSEL8_Pos + ( number-8 ) * 4U ));
            }
        }

        void initPin_Analog(GPIO_TypeDef* port, uint8_t number) {

            port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
            port -> MODER |= ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
        }

        void initPin_AnalogPD (GPIO_TypeDef* port, uint8_t number ) {

            port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
            port -> MODER |= ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
            port -> PUPDR |= ( 0b10 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
        }
    }
}