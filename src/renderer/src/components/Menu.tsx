export function Menu() {
    return (
        <section className="flex flex-col items-center bg-[#4391BF] bg-opacity-50 w-[16vw]">
            <div className="h-[100vh] bg-[#FFFFFF] bg-opacity-50 w-[16vw] text-center">
                <p className="mt-[10px] mb-[10px] font-Fira text-[calc(4.5vh/2)]">
                    Меню
                </p>
                <button className="bg-[#4391BF] bg-opacity-50  h-[7vh] w-[16vw]">
                Открыть файл
                </button>
                <button className="bg-[#4391BF] h-[7vh] w-[16vw]">
                Сохранить файл
                </button>
                <button className="bg-[#4391BF] bg-opacity-50 h-[7vh] w-[16vw]">
                Сохранить файл как...
                </button>
                <button className="bg-[#4391BF] h-[7vh] w-[16vw]">
                Примеры
                </button>
                <button className="bg-[#4391BF] bg-opacity-50 h-[7vh] w-[16vw]">
                Закрыть программу
                </button>
            </div>
        </section>
    );
}