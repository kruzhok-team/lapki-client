import { useState } from 'react';

import { AddressData } from '@renderer/types/FlasherTypes';

import { useSettings } from './useSettings';

export const useAddressBook = () => {
  const [addressBookSetting, setAddressBookSetting] = useSettings('addressBookMS');

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);

  const [idStorage, setIdStorage] = useState<number[]>([]);
  const [idCounter, setIdCounter] = useState<number>(0);
  /**
   * Эта функция позволяет получить ID элмента по его индексу.
   * Она динамически генерирует ID, если они отсутствуют.
   * @param index - индекс адресной книги
   * @returns ID, соответствующий элементу адресной книги, либо null, если индекс некорректный или адресная книга отсутствует (равняется null)
   */
  const getID = (index: number) => {
    // эта функция динамически генерирует ID, если они отсутствуют

    if (addressBookSetting === null || index >= addressBookSetting.length) {
      return null;
    }
    if (index < idStorage.length) {
      return idStorage[index];
    }
    let id = idCounter;
    const storage: number[] = [id];
    for (let i = idCounter + 1; i < index; i++) {
      storage.push(i);
      id = i;
    }
    setIdStorage(idStorage.concat(storage));
    setIdCounter(id + 1);
    return id;
  };
  /**
   * Позволяет найти индекс адресной книги по ID соответствующей записи, не работает,
   * если ID для этой записи не сгенерирован.
   * @param ID запси адресной книги
   * @returns индекс адресной книги, соответствующий ID элемента, либо null, если его не удалось найти
   */
  const getIndex = (ID: number) => {
    if (addressBookSetting === null) {
      return null;
    }
    for (let index = 0; index < idStorage.length; index++) {
      if (idStorage[index] === ID) {
        return index;
      }
    }
    return null;
  };
  /**
   * Добавление новой записи в адресную книгу
   * @param data запись, которую следует добавить
   */
  const onAdd = (data: AddressData) => {
    if (addressBookSetting === null) return;
    setAddressBookSetting([...addressBookSetting, data]);
  };
  const onEdit = (data: AddressData, index: number) => {
    if (addressBookSetting === null) return;
    const newBook = addressBookSetting.map((v, i) => {
      if (i === index) {
        return data;
      } else {
        return v;
      }
    });
    setAddressBookSetting(newBook);
  };
  const onRemove = (index: number) => {
    if (addressBookSetting === null) return;
    setIdStorage(idStorage.toSpliced(index, 1));
    setAddressBookSetting(addressBookSetting.toSpliced(index, 1));
  };
  const onSwapEntries = (index1: number, index2: number) => {
    if (addressBookSetting === null) {
      return;
    }
    const firstEntry = addressBookSetting[index1];
    const secondEntry = addressBookSetting[index2];
    const newBook = addressBookSetting.map((v, i) => {
      if (i === index1) {
        return secondEntry;
      }
      if (i === index2) {
        return firstEntry;
      }
      return v;
    });
    const newIdStorage = idStorage.map((v, i) => {
      if (i === index1) {
        return idStorage[index2];
      }
      if (i === index2) {
        return idStorage[index1];
      }
      return v;
    });
    if (index1 === selectedAddressIndex) {
      setSelectedAddressIndex(index2);
    } else if (index2 === selectedAddressIndex) {
      setSelectedAddressIndex(index1);
    }
    setAddressBookSetting(newBook);
    setIdStorage(newIdStorage);
  };
  /**
   * Проверка на наличие адреса в адресной книге
   * @param address адрес МС-ТЮК
   * @returns истина, если адрес уже встречается в адресной книге; null, если адресная книга не загрузилась (если она является null)
   */
  const isDuplicateAddress = (address: string): boolean | null => {
    if (addressBookSetting === null) return null;
    return (
      addressBookSetting.find((v) => {
        return v.address === address;
      }) !== undefined
    );
  };
  /**
   * Проверка на наличие имени в адресной книге
   * @param name имя МС-ТЮК
   * @returns истина, если имя уже встречается в адресной книге; null, если адресная книга не загрузилась (если она является null)
   */
  const isDuplicateName = (name: string): boolean | null => {
    if (addressBookSetting === null) return null;
    return (
      addressBookSetting.find((v) => {
        return v.name === name;
      }) !== undefined
    );
  };

  const selectedAddress = () => {
    if (addressBookSetting === null || selectedAddressIndex === null) return '';
    return addressBookSetting[selectedAddressIndex].address;
  };

  const setSelectedAddress = (address: string) => {
    if (addressBookSetting === null) return;
    const index = addressBookSetting.findIndex((v) => {
      return v.address === address;
    });
    if (index === -1) {
      setSelectedAddressIndex(addressBookSetting.length);
      onAdd({ name: '', address: address, type: '', meta: undefined });
    } else {
      setSelectedAddressIndex(index);
    }
  };
  return {
    addressBookSetting,
    selectedAddress,
    selectedAddressIndex,
    setSelectedAddress,
    onAdd,
    onRemove,
    onEdit,
    onSwapEntries,
    getID,
    getIndex,
    isDuplicateAddress,
    isDuplicateName,
  };
};
