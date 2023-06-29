export function Menu() {
  return (
    <section className="flex w-[16vw] flex-col items-center bg-[#4391BF] bg-opacity-50">
      <div className="h-[100vh] w-[16vw] bg-[#FFFFFF] bg-opacity-50 text-center">
        <p className="mb-[10px] mt-[10px] font-Fira text-[calc(4.5vh/2)]">Меню</p>
        <button className="h-[7vh] w-[16vw]  bg-[#4391BF] bg-opacity-50">Открыть файл</button>
        <button className="h-[7vh] w-[16vw] bg-[#4391BF]">Сохранить файл</button>
        <button className="h-[7vh] w-[16vw] bg-[#4391BF] bg-opacity-50">
          Сохранить файл как...
        </button>
        <button className="h-[7vh] w-[16vw] bg-[#4391BF]">Примеры</button>
        <button className="h-[7vh] w-[16vw] bg-[#4391BF] bg-opacity-50">Закрыть программу</button>
      </div>
    </section>
  );
}
