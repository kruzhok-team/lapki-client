#pragma once

//Длина буфера АЦП для ушей
//Полезно для поиска максимумов
#define EAR_SEQUENCE_LEN 1

#include "Pins.hpp"
#include "ADC.hpp"

namespace stm32g431 {

  namespace ears {

    using namespace stm32g431::adc;
    using namespace stm32g431::periphery;

      //MicR
      void
      initOPAMP2
      ( void )
      {
        //TODO OPAHSM (s25.3.3 p782 RM0440)
        RCC -> AHB2ENR |= RCC_AHB2ENR_GPIOAEN;
        initPin_AnalogPD(GPIOA,7); //R+
        initPin_Analog(GPIOA,5); //R-
        RCC -> APB2ENR |= RCC_APB2ENR_SYSCFGEN;
        OPAMP2 -> CSR |= (0b10 << OPAMP_CSR_VMSEL_Pos); //VINM0; PA5
        OPAMP2 -> CSR |= ( 0b01000 << OPAMP_CSR_PGGAIN_Pos );
        OPAMP2 -> CSR |= OPAMP_CSR_OPAMPINTEN;
        OPAMP2 -> CSR |= (0b00 << OPAMP_CSR_VPSEL_Pos); //VINP0; PA7
        OPAMP2 -> CSR |= OPAMP_CSR_OPAMPxEN;
      }

      void
      initOPAMP3
      ( void )
      {
        //TODO OPAHSM (s25.3.3 p782 RM0440)
        RCC -> AHB2ENR |= RCC_AHB2ENR_GPIOBEN;
        initPin_AnalogPD(GPIOB,0); //R+
        initPin_Analog(GPIOB,2); //R-
        RCC -> APB2ENR |= RCC_APB2ENR_SYSCFGEN;
        OPAMP3 -> CSR |= (0b10 << OPAMP_CSR_VMSEL_Pos);
        OPAMP3 -> CSR |= ( 0b01000 << OPAMP_CSR_PGGAIN_Pos );
        OPAMP3 -> CSR |= OPAMP_CSR_OPAMPINTEN;
        OPAMP3 -> CSR |= (0b00 << OPAMP_CSR_VPSEL_Pos);
        OPAMP3 -> CSR |= OPAMP_CSR_OPAMPxEN;
      }

      #define OP_GAIN_2 0
      #define OP_GAIN_4 1
      #define OP_GAIN_8 2
      #define OP_GAIN_16 3
      #define OP_GAIN_32 4
      #define OP_GAIN_64 5

      //Защита от стрельбы в ногу
      bool
      hw_setGain
      ( OPAMP_TypeDef * op, uint8_t gain )
      {
        bool result = true;
        const auto&& mkGain = [&result, &gain]( void )  -> uint8_t {
          switch ( gain ) {
            case OP_GAIN_2:  return 0b01000;
            case OP_GAIN_4:  return 0b01001;
            case OP_GAIN_8:  return 0b01010;
            case OP_GAIN_16: return 0b01011;
            case OP_GAIN_32: return 0b01100;
            case OP_GAIN_64: return 0b01101;
            default:
              result = false;
              return 0b01000;
          }
        };
        op -> CSR &= ~OPAMP_CSR_OPAMPxEN;
        op -> CSR &= ~OPAMP_CSR_PGGAIN_Msk;
        op -> CSR |= ( mkGain() << OPAMP_CSR_PGGAIN_Pos );
        op -> CSR |= OPAMP_CSR_OPAMPxEN;
        return result;
      }

      //Эта АЦП управляет ушами
      void
      initADC2
      ( void )
      {
        ADC2 -> CR |= ADC_CR_ADDIS;
        ADC2 -> CR &= ~ADC_CR_DEEPPWD;
        ADC2 -> CR |= ADC_CR_ADVREGEN;
        delay(3); //p277 s14.3.2 RM0454
        ADC2 -> CFGR |= ADC_CFGR_CONT; //Непрерывный режим. Не забыть ADSTART
        ADC2 -> SMPR1 = ( 0b101 << ADC_SMPR1_SMP3_Pos ); //Частота сэмплирования. Торопиться некуда. Около 17 микросекунд
        ADC2 -> CFGR &= ~ ADC_CFGR_RES_Msk; //Разрешение 12 бит.
        ADC2 -> CFGR &= ~ ADC_CFGR_ALIGN; //Выравнивание вправо, для 12 бит самое то.
        ADC2 -> CFGR |= ADC_CFGR_OVRMOD; //Перезаписывание непрочтённых данных
        //ADC2 -> DIFSEL |= ADC_DIFSEL_DIFSEL_3;
        ADC2 -> SQR1 = ((2-1) << ADC_SQR1_L_Pos )
                    | ( 16 << ADC_SQR1_SQ1_Pos ) //earRight RM0440 p392 t69
                    | ( 18 << ADC_SQR1_SQ2_Pos ) //earLeft RM0440 p392 t69
                    ;
        //Калибровка
        ADC2 -> CFGR |= ADC_CFGR_DMACFG;
        ADC2 -> CFGR |= ADC_CFGR_DMAEN;
        calibrateADC(ADC2);
        enableADC(ADC2);
        ADC2 -> CR |= ADC_CR_ADSTART;
      }

      uint32_t adcArray[2*EAR_SEQUENCE_LEN];

      void
      initDMA
      ( void )
      {
        RCC -> AHB1ENR |= RCC_AHB1ENR_DMA1EN;
        RCC -> AHB1ENR |= RCC_AHB1ENR_DMAMUX1EN;
        DMA1_Channel1 -> CPAR = (uint32_t)(&(ADC2->DR));
        DMA1_Channel1 -> CMAR = (uint32_t)(&adcArray);
        DMA1_Channel1 -> CNDTR = 2*EAR_SEQUENCE_LEN;
        DMA1_Channel1 -> CCR |= DMA_CCR_MINC
                            | ( 0b10 << DMA_CCR_MSIZE_Pos )
                            | ( 0b10 << DMA_CCR_PSIZE_Pos )
                            | DMA_CCR_CIRC
                            ;
        DMA1_Channel1 -> CCR |= DMA_CCR_EN;
        DMAMUX1_Channel0 -> CCR |= ( 36 << DMAMUX_CxCR_DMAREQ_ID_Pos );
      }


      void
      initEars
      ( uint8_t gain )
      {
        initADC_Common();
        initOPAMP2();
        initOPAMP3();
        hw_setGain(OPAMP2,gain);
        hw_setGain(OPAMP3,gain);
        initADC2();
        initDMA();
      }

      //По нечётным адресам лежат данные правого уха
      //Правое со стороны мишки
      uint16_t
      scanEarR
      ( void )
      {
        return adcArray[0];
        uint16_t result = 0;
        for ( uint8_t i=0; i<EAR_SEQUENCE_LEN; i++) {
          if ( adcArray[2*i] > result ) result = adcArray[i];
        }
        return result;
      }

      //По чётным адресам лежат данные правого уха
      //Правое со стороны мишки
      uint16_t
      scanEarL
      ( void )
      {
        return adcArray[1];
        uint16_t result = 0;
        for ( uint8_t i=0; i<EAR_SEQUENCE_LEN; i++) {
          if ( adcArray[2*i+1] > result ) result = adcArray[i];
        }
        return result;
      }

  }
}