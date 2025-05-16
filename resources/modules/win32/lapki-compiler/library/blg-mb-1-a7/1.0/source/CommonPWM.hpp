#pragma once

// Обособленная часть hal файла

// Здесь определена функция-прерывание для ШИМ

#ifdef __cplusplus
extern "C" {
#endif

volatile uint32_t pwmCounter = 0;

// interrupt function for TIM2
void TIM2_IRQHandler(void) {

    TIM2 -> SR &= ~TIM_SR_UIF;  // Снимаем флаг прерывания
    
    ++pwmCounter;
    
    // TIM2 -> CR1 &= ~TIM_CR1_CEN;    // Счет запрещён

    // leds
    if (mrx::hal::pwm::interruptFunc != nullptr)
        mrx::hal::pwm::interruptFunc();

    // rgb leds
    mrx::hal::rgbLed::interruptFunc();
    
    // Speaker
    // Speaker has a unique frequency
    // if ((++mrx::hal::speaker::currLevel) >= mrx::hal::speaker::level) {
    
    // every 2 steps (speakerLevel вычисляется, как 40'000 /X = нужная частота спикера. Например, для рыка нужно 10'000, значит speakerLevel равен 4)
    if ((++mrx::hal::speaker::currLevel) >= mrx::hal::speaker::speakerLevel) {
        mrx::hal::speaker::interruptFunc();
        mrx::hal::speaker::currLevel = 0;

        ++pwmCounter;
        if (pwmCounter > 8000) {
            pwmCounter = 0;
            
            // GPIOE->ODR ^= ( GPIO_ODR_OD0 << 1);
        }
    }

    // matrix animation
    if (mrx::hal::matrixAnimation::interruptFunc != nullptr) {
        
        // 100 times in 1 sec
        // 40'000 / 100 = 400
        // if (pwmCounter >= 400) {
        if (++mrx::hal::matrixAnimation::currLevel >= mrx::hal::matrixAnimation::animLevel) {

            mrx::hal::matrixAnimation::interruptFunc();
            mrx::hal::matrixAnimation::currLevel = 0;
        }
    }

    // TIM2 -> CR1 |= TIM_CR1_CEN;  // Счет разрешен
}

// timer for microphone
// interrupt function for TIM15
void TIM1_BRK_TIM15_IRQHandler(void) {

    TIM15 -> SR &= ~TIM_SR_UIF;

    const auto left = mrx::hal::microphone::api::scanEarL();
    const auto right = mrx::hal::microphone::api::scanEarR();

    if (left > mrx::hal::microphone::detectedLevel) {

        mrx::hal::microphone::detectedLevel = left;
    }

    if (right > mrx::hal::microphone::detectedLevel) {

        mrx::hal::microphone::detectedLevel = right;
    }
}

#ifdef __cplusplus
}
#endif