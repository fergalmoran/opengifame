import {faker} from '@faker-js/faker';

const ANIMALS = [
  'Bear', 'Cat', 'Crow', 'Deer', 'Dog', 'Duck', 'Eagle', 'Elephant',
  'Fox', 'Frog', 'Giraffe', 'Goat', 'Gorilla', 'Hawk', 'Hedgehog',
  'Horse', 'Lemur', 'Lion', 'Lizard', 'Lynx', 'Narwhal', 'Otter',
  'Owl', 'Panda', 'Parrot', 'Penguin', 'Platypus', 'Rabbit', 'Raccoon',
  'Raven', 'Shark', 'Sloth', 'Snake', 'Tiger', 'Turtle', 'Wolf', 'Zebra',
];

/**
 * Generate a fun, human-readable random title for an untitled upload,
 * e.g. "Funky Sleepy Penguin" or "Sparkly Confused Otter".
 */
export function generateRandomTitle(): string {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const words = [
    faker.word.adjective(),
    faker.word.adjective(),
    animal,
  ];

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
