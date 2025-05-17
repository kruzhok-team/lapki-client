#define INLINE__ __attribute__((always_inline)) inline
using byte = uint8_t;

#define SYSCLOCK 64e6
#define HCLK 64e6
#define PCLK 16e6

/* m1.RegBlock [A] Здесь занимаемся настройкой тактовых частот контроллера
 * descr
   1  Начинаем с HSISYS (16 МГц)
      Ничего не делаем и идём дальше
   2  Настраиваем PLL
   3  Настраиваем делители частоты внутренних шин
   4  Переключаемся на PLL
 * links
   - s5.2 p121 RM0454
 */

/* m1.RegSet #pll
 * descr
     Частота PLL настраивается тремя параметрами: M, N и R
 * items
     1 Параметр M
     2 Параметр N
     3 Параметр R
     4 Источник частоты PLL
 * restr
     - In — входная частота
       В нашем конкретном случае это 8 МГц от HSE
     - In × N / M <= 344 МГц
     - PLLRCLK = In × N / M / R
     - PLLRCLK <= 64 МГц
     - Строго говоря, частота HSI тоже настраивается, но мы её не трогаем, она нас тоже
 * refs
     - t27 p129 RM0454
     - f8 p124 RM0454
 */

/* m1.RegSet #clk
 * descr
     Шины APB и AHB имеют свои ограничения по частоте
 * items
     1 Частота SYSCLK, см. #pll
     2 Делитель частоты шины APB
     3 Делитель частоты шины AHB
     4 Задержка чтения Flash
 //* restr
     - SYSCLK <= 64 МГц
     - HCLK > 48 MHz → Flash WS = 2
 * refs
     - f8 p124 RM0454
     - s5.2.6 p128 RM0454
     - s3.3.4 p56 RM00454
 */

void initClock(void) {
    
    // RCC -> IOPENR |= RCC_IOPENR_GPIOCEN;
    // initPin_AF_PP ( GPIOC, 15, 1 );
    RCC->CR |= RCC_CR_HSEBYP;
    RCC->CR |= RCC_CR_HSEON;
    // Зануляем наверняка делитель HSI
    // RCC -> CR &= ~ RCC_CR_HSIDIV_Msk;

    /* m1.Reg #pll.1 [A.2]
     * ext
         Устанавливаем параметр N модуля PLL
     * int
         PLLN: 0b1000 → 8
         s5.4.4 p140 RM0454
     * tek
         Замена секции регистра
     */
    RCC->PLLCFGR = ((RCC->PLLCFGR & ~RCC_PLLCFGR_PLLN_Msk) | (16 << RCC_PLLCFGR_PLLN_Pos));

    /* m1.Reg #pll.2 [A.2]
     * ext
         Устанавливем параметр M модуля PLL
     * int
         PLLM: 0b000 → 1
         s5.4.4 p140 RM0454
     * tek
         Замена секции регистра
     */
    RCC->PLLCFGR |= (0b000 << RCC_PLLCFGR_PLLM_Pos);

    /* m1.Reg #pll.3 ~2
     * ext
         Устанавливем параметр R модуля PLL
     * int
         PLLR: 0b001 → 2
         s5.4.4 p140 RM0454
     * tek
         Замена секции регистра
     */
    RCC->PLLCFGR |= (0b001 << RCC_PLLCFGR_PLLR_Pos);

    // RCC -> PLLCFGR |= (0b11111 << RCC_PLLCFGR_PLLP_Pos);

    /* m1.Reg #pll.4 [A.2]
     * ext
         Выбираем источником PLL генератор HSE
     * int
         s5.4.4 p142 RM0454
     * tek
         Поднятие дефолтно-нулевых битов маской из CMSIS
     */
    RCC->PLLCFGR |= RCC_PLLCFGR_PLLSRC_HSE;

    /* m1.Reg [A.2]
     * ext
         Включаем выход R модуля PLL
     * int
         Поднимаем бит PLLREN
     * tek
         Поднятие бита маской
     */
    RCC->PLLCFGR |= RCC_PLLCFGR_PLLREN;

    /* m1.Reg [A.2]
     * ext
         Включаем модуль PLL
     * int
         Поднимаем бит PLLON
     * tek
         Поднятие бита маской
     */
    RCC->CR |= RCC_CR_PLLON;

    /* m1.Reg [A.2]
     * ext
         Ждём, пока PLL стабилизируется
     * int
         Ждём флага PLLRDY
     * tek
         Ждём нужного бита в вечном цикле
     */
    while ((RCC->CR & RCC_CR_PLLRDY) == 0);

    /* m1.Reg #clk.2 [A.3]
     * ext
         Устанавливаем делитель частоты шины APB
         Мы здесь задаём частоту PCLK
     * int
         PPRE: 0b0xx → 1
         s5.4.3 p139 RM0454
     * tek
         Поднятие дефолтно-нулевых битов маской
     */
    RCC->CFGR |= (0b001 << RCC_CFGR_PPRE_Pos);

    /* m1.Reg #clk.3 [A.3]
     * ext
         Устанавливаем делитель частоты шины AHB
         Этим мы задаём частоту HCLK
     * int
         HPRE: 0b1001 → 4
     * tek
         Поднятие дефолтно-нулевых битов маской
     */
    RCC->CFGR |= (0b1001 << RCC_CFGR_HPRE_Pos);

    /* m1.Reg #clk.4 [A.3]
     * ext
         Устанавливаем задержку чтения Flash
         Она не может работать с той же скоростью, что и контроллер
     * int
         LATENCY: 0b010 → WS=2
     * tek
         Поднятие дефолтно-нулевых битов маской
     */
    FLASH->ACR |= (0b010 << FLASH_ACR_LATENCY_Pos);
    /* m1.Reg [A.3]
     * ext
         Ждём, пока установленная задержка чтения флэша вступит в силу
         Не уверен, что это нужно, но в пошаговой инструкции на p56 советуют
     * int
         Ждём прочтения ожидаемого значения
     * tek
         Ожидание нужной маски в вечном цикле
     */
    while ((FLASH->ACR & FLASH_ACR_LATENCY_Msk) != 0b010);

    /* m1.Reg #clk.1 [A.4]
     * ext
         Делаем PLL источником системной тактовой частоты
         Точнее, SYSCLK будет тактоваться от выхода R модуля PLL
     * int
         SW: 0b010 → PLLRCLK
     * tek
         Замена секции регистра
     */
    RCC->CFGR = ((RCC->CFGR & ~RCC_CFGR_SW_Msk) | (0b010 << RCC_CFGR_SW_Pos));
}

#ifdef __cplusplus
extern "C" {
#endif

    void SystemInit(void) {

        // init modules        
        // GPIO (A, B, C, D, F)
        // A
        RCC->IOPRSTR |= RCC_IOPRSTR_GPIOARST_Msk;
        RCC->IOPRSTR &= ~RCC_IOPRSTR_GPIOARST_Msk;

        // B
        RCC->IOPRSTR |= RCC_IOPRSTR_GPIOBRST_Msk;
        RCC->IOPRSTR &= ~RCC_IOPRSTR_GPIOBRST_Msk;

        // C
        RCC->IOPRSTR |= RCC_IOPRSTR_GPIOCRST_Msk;
        RCC->IOPRSTR &= ~RCC_IOPRSTR_GPIOCRST_Msk;

        // D
        RCC->IOPRSTR |= RCC_IOPRSTR_GPIODRST_Msk;
        RCC->IOPRSTR &= ~RCC_IOPRSTR_GPIODRST_Msk;

        // F
        RCC->IOPRSTR |= RCC_IOPRSTR_GPIOFRST_Msk;
        RCC->IOPRSTR &= ~RCC_IOPRSTR_GPIOFRST_Msk;

        // USART2
        RCC->APBRSTR1 |= RCC_APBRSTR1_USART2RST_Msk;
        RCC->APBRSTR1 &= ~RCC_APBRSTR1_USART2RST_Msk;

        // DMA
        RCC->AHBRSTR |= RCC_AHBRSTR_DMA1RST_Msk;
        RCC->AHBRSTR &= ~RCC_AHBRSTR_DMA1RST_Msk;

        #define FLASH_BASE_ADDR 0x08003800
        SCB->VTOR = FLASH_BASE_ADDR;  //установка VECT_TAB_OFFSET
        __enable_irq();  //включаем все прерывания TODO

        initClock();
        SysTick_Config((uint32_t)(HCLK /4 /1000)); // Почему оно в 2 раза быстрее? o_O //Работает, константы HPRE,PPRE верны, и славно
    }

    volatile uint32_t waiter = 0;
    volatile uint32_t counter = 0;

    __attribute__((optimize("O0")))
    void delay(uint32_t wait) {
        waiter = wait;
        while (waiter) {}
    }

    __attribute__((optimize("O0")))
    uint32_t millis() {
        return counter;
    }

    void SysTick_Handler(void) {
        if (waiter > 0)
            --waiter;
        ++counter;
    }

#ifdef __cplusplus
}
#endif