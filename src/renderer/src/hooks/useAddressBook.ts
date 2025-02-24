import { useEffect, useState } from 'react';

import { ManagerMS } from '@renderer/components/Modules/ManagerMS';
import { AddressData } from '@renderer/types/FlasherTypes';

import { useSettings } from './useSettings';

export type addressBookReturn = {
  addressBookSetting: AddressData[] | null;
  selectedAddress: () => string;
  selectedAddressIndex: number | null;
  onAdd: (data: AddressData) => void;
  onRemove: (index: number) => void;
  onEdit: (data: AddressData, index: number) => void;
  onSwapEntries: (index1: number, index2: number) => void;
  getID: (index: number) => number | null;
  getIndex: (id: number) => number | undefined;
  getEntryById: (id: number) => AddressData | undefined;
  displayEntry: (index: number) => string | null;
  idCounter: number;
};

export const useAddressBook = (): addressBookReturn => {
  const [addressBookSetting, setAddressBookSetting] = useSettings('addressBookMS');

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);

  const [indexToId, setIndexToId] = useState<number[]>([]);
  const [idToIndex, setIdToIndex] = useState<Map<number, number>>(new Map());
  const [idCounter, setIdCounter] = useState<number>(0);

  useEffect(() => {
    if (addressBookSetting === null || indexToId.length >= addressBookSetting.length) return;
    let id = idCounter;
    const newIndexToId: number[] = [];
    const newIdToIndex = new Map(idToIndex);
    for (let i = indexToId.length; i < addressBookSetting.length; i++) {
      newIdToIndex.set(id, i);
      newIndexToId.push(id);
      id++;
    }
    setIndexToId(indexToId.concat(newIndexToId));
    setIdToIndex(newIdToIndex);
    setIdCounter(id);
  }, [addressBookSetting]);

  /**
   * Эта функция позволяет получить ID элмента по его индексу.
   * @param index - индекс адресной книги
   * @returns ID, соответствующий элементу адресной книги, либо null, если индекс некорректный или адресная книга отсутствует (равняется null)
   */
  const getID = (index: number) => {
    if (addressBookSetting === null || index >= indexToId.length) {
      return null;
    }
    return indexToId[index];
  };
  /**
   * Позволяет найти индекс адресной книги по ID соответствующей записи
   * @param ID запси адресной книги
   * @returns индекс адресной книги, соответствующий ID элемента, либо null, если его не удалось найти
   */
  const getIndex = (ID: number) => {
    if (addressBookSetting === null) {
      return undefined;
    }
    return idToIndex.get(ID);
  };
  const getEntryById = (ID: number) => {
    const index = getIndex(ID);
    if (index === undefined || addressBookSetting === null) {
      return undefined;
    }
    return addressBookSetting[index];
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
    if (selectedAddressIndex === index) {
      setSelectedAddressIndex(null);
    }
    setIdToIndex((oldMap) => {
      const newMap = new Map(oldMap);
      newMap.delete(indexToId[index]);
      oldMap.forEach((v, k) => {
        if (v > index) {
          newMap.set(k, v - 1);
        }
      });
      return newMap;
    });
    setIndexToId(indexToId.toSpliced(index, 1));
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
    const newIdToIndex = new Map(idToIndex);
    newIdToIndex.set(indexToId[index1], index2);
    newIdToIndex.set(indexToId[index2], index1);
    const newIndexToId = indexToId.map((v, i) => {
      if (i === index1) {
        return indexToId[index2];
      }
      if (i === index2) {
        return indexToId[index1];
      }
      return v;
    });
    if (index1 === selectedAddressIndex) {
      setSelectedAddressIndex(index2);
    } else if (index2 === selectedAddressIndex) {
      setSelectedAddressIndex(index1);
    }
    setAddressBookSetting(newBook);
    setIdToIndex(newIdToIndex);
    setIndexToId(newIndexToId);
  };

  const selectedAddress = () => {
    if (
      addressBookSetting === null ||
      selectedAddressIndex === null ||
      selectedAddressIndex >= addressBookSetting.length ||
      selectedAddressIndex < 0
    )
      return '';
    return addressBookSetting[selectedAddressIndex].address;
  };

  // const addToAddressBook = (address: string) => {
  //   if (addressBookSetting === null) return;
  //   const index = addressBookSetting.findIndex((v) => {
  //     return v.address === address;
  //   });
  //   if (index === -1) {
  //     onAdd({ name: '', address: address, type: '', meta: undefined });
  //   }
  // };

  // const setSelectedAddress = (address: string) => {
  //   if (addressBookSetting === null) return;
  //   const index = addressBookSetting.findIndex((v) => {
  //     return v.address === address;
  //   });
  //   if (index === -1) {
  //     onAdd({ name: '', address: address, type: '', meta: undefined });
  //     setSelectedAddressIndex(addressBookSetting.length);
  //   } else {
  //     setSelectedAddressIndex(index);
  //   }
  // };

  const displayEntry = (index: number) => {
    if (
      addressBookSetting === null ||
      selectedAddressIndex === null ||
      index < 0 ||
      index >= addressBookSetting.length
    )
      return null;
    return ManagerMS.displayAddressInfo(addressBookSetting[index]);
  };

  return {
    addressBookSetting,
    selectedAddress,
    selectedAddressIndex,
    //setSelectedAddress,
    onAdd,
    onRemove,
    onEdit,
    onSwapEntries,
    getID,
    getIndex,
    getEntryById,
    displayEntry,
    idCounter, // TODO: костыль!
  };
};
