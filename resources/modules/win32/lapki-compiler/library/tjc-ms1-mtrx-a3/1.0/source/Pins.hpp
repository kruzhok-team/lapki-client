#pragma once

#define ON 1
#define OFF 2
#define TOGGLE 3
#define READ 4

/*Инициализация пина в IO с открытым стоком
 */
__attribute__((always_inline))
static inline
void initPin_OD
( GPIO_TypeDef *port, uint8_t number )
{
  port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
  port -> MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
  port -> MODER |= ( 0b01 <<
    ( GPIO_MODER_MODE0_Pos + number * 2U ));
  port -> OTYPER |= ( GPIO_OTYPER_OT0 << number );
  port -> BSRR |= ( GPIO_BSRR_BS0 << number );
}

/*Инициализация пина в IO с тяни-толкаем
 */
__attribute__((always_inline))
static inline
void initPin_PP
( GPIO_TypeDef *port, uint8_t number )
{
  port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
  port -> MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
  port -> MODER |= ( 0b01 <<
    ( GPIO_MODER_MODE0_Pos + number * 2U ));
  port -> OTYPER &= ~( GPIO_OTYPER_OT0 << number );
  port -> BSRR |= ( GPIO_BSRR_BS0 << number );
}

/*Инициализация пина на чтение уровня
 */
__attribute__((always_inline))
static inline
void initPin_InputF
( GPIO_TypeDef *port, uint8_t number )
{
  port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
  port -> MODER &= ~ ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
  port -> BSRR |= ( GPIO_BSRR_BS0 << number );
}

__attribute__((always_inline))
static inline
void initPin_Analog
( GPIO_TypeDef *port, uint8_t number )
{
  port -> PUPDR &= ~ ( 0b11 << ( GPIO_PUPDR_PUPD0_Pos + number * 2U ));
  port -> MODER |= ( 0b11 << ( GPIO_MODER_MODE0_Pos + number * 2U ));
}

/*Инициализация пина на периферию, тяни-толкаем
 */
__attribute__((always_inline))
static inline
void initPin_AF_PP
( GPIO_TypeDef *port, uint8_t number, uint8_t af )
{
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

/*Чтение уровня на пине
 * ? Что, если пин не настроен на вход?
 * Возвращает только 0 или 1
 */
__attribute__((always_inline))
static inline
uint8_t readPin
( GPIO_TypeDef *port, uint8_t number )
{
  return ((( port -> IDR ) & ( 0b1 << ( GPIO_IDR_ID0_Pos + number * 1U ))) != 0);
}

/* Установление уровня пина в режиме открытого стока
 * Отличается от тяни-толкая инверсией значения
 * Это для светодиодиков :/
 *
 * ON — низкий
 * OFF — плавающий
 * TOGGLE — изменить состояние
 * READ — прочитать установленное значение
 */
__attribute__((always_inline)) 
static inline
uint8_t setPin_OD
( GPIO_TypeDef *port, uint8_t number, uint8_t x )
{
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

/* Установление уровня пина в режиме тяни-толкай
 *
 * ON — высокий
 * OFF — низкий
 * TOGGLE — изменить состояние
 * READ — прочитать установленное значение
 */
__attribute__((always_inline)) 
static inline
uint8_t setPin_PP
( GPIO_TypeDef *port, uint8_t number, uint8_t x )
{
  switch (x) {
    case ON:
      port -> BSRR |= ( GPIO_BSRR_BS0 << number );
      return ON;
    case OFF:
      port -> BSRR |= ( GPIO_BSRR_BR0 << number );
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

/*Инициализация пина на периферию, открытый сток
 */
__attribute__((always_inline))
static inline
void initPin_AF_OD
( GPIO_TypeDef *port, uint8_t number, uint8_t af )
{
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