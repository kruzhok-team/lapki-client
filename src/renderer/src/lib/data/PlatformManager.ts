import { Platform } from '@renderer/types/platform';

export class PlatformManager {
  platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }
}

/*
@privateRemarks

Менеджер платформы: 
выдача списка компонентов
синглтон ли компонент?
выдача списка событий для компонента
выдача списка действий для компонента
выдача списка параметров для компонента
выдача списка переменных для компонента

Привязать Picto для отрисовки значков

*/
