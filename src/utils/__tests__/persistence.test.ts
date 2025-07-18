import {
  saveData,
  loadData,
  saveCharacter,
  loadCharacter,
} from '../persistence';
import type { Character } from '../../types/character';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Persistence Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveData and loadData', () => {
    it('should save and load an object correctly', () => {
      const testKey = 'test_key';
      const testData = { name: 'test', value: 123 };
      saveData(testKey, testData);
      const loadedData = loadData<{ name: string; value: number }>(testKey);
      expect(loadedData).toEqual(testData);
    });

    it('should return null if key does not exist', () => {
      const loadedData = loadData('non_existent_key');
      expect(loadedData).toBeNull();
    });

    it('should return null and log an error for invalid JSON', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testKey = 'invalid_json_key';
      localStorage.setItem(testKey, '{"name": "test", value: }'); // Invalid JSON
      const loadedData = loadData(testKey);
      expect(loadedData).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Character specific functions', () => {
    it('should save and load a character object correctly', () => {
      const character: Character = {
        id: 'char1',
        name: 'Test Character',
        level: 5,
        profession: 'Warrior',
        daysLived: 10,
        stats: {
          strength: 10,
          agility: 8,
          intelligence: 5,
          stamina: 9,
          gold: 0
        },
        equipment: {},
        inventory: [],
        relations: {},
        race: '',
        gender: ''
      };

      saveCharacter(character);
      const loadedCharacter = loadCharacter();
      expect(loadedCharacter).toEqual(character);
    });
  });
}); 