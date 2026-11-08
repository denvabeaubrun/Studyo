// noteFacts.test.js
//
// Tests for turning notes written as ongoing sentences into question cards.
//
// Run with: npm test

import { describe, it, expect } from 'vitest';
import { generateCards } from './generateCards';
import { baseForm, splitSentences, factFromSentence, keyFact } from './noteFacts';

const pairs = (cards) => cards.map((c) => [c.front, c.back]);
const fact = (sentence, previous = null) => factFromSentence(sentence, previous)?.pair ?? null;

describe('notes written as sentences', () => {
  it('turns ongoing history notes into when/why/who questions', () => {
    const notes =
      'the american revolution was during 1775 to 1783 and it started because of taxes like the stamp act.\n' +
      'The Declaration of Independence was written by Thomas Jefferson. It was signed in 1776.';

    expect(pairs(generateCards(notes))).toEqual([
      ['When was the american revolution?', 'During 1775 to 1783'],
      ['Why did the american revolution start?', 'Because of taxes like the stamp act'],
      ['Who wrote the Declaration of Independence?', 'Thomas Jefferson'],
      ['When was the Declaration of Independence signed?', 'In 1776'],
    ]);
  });

  it('reads "it" as the subject of the line before, even with no periods', () => {
    const notes = [
      'world war 1 started in 1914',
      'it was caused by the assassination of archduke franz ferdinand',
      'the war ended in 1918',
    ].join('\n');

    expect(pairs(generateCards(notes))).toEqual([
      ['When did world war 1 start?', 'In 1914'],
      ['What caused world war 1?', 'The assassination of archduke franz ferdinand'],
      ['When did the war end?', 'In 1918'],
    ]);
  });

  it('does not join typed note lines together as if they wrapped', () => {
    const notes = [
      'the treaty of versailles was signed in 1919 and it blamed germany for the war',
      'trench warfare was used because machine guns made attacks across open ground deadly',
      'the war ended in 1918',
    ].join('\n');
    const fronts = generateCards(notes).map((c) => c.front);
    expect(fronts).toContain('When was the treaty of versailles signed?');
    expect(fronts).toContain('Why was trench warfare used?');
    expect(fronts).toContain('When did the war end?');
  });

  it('still makes term cards from "X is ..." sentences next to fact questions', () => {
    const notes = 'Photosynthesis is how plants turn sunlight into food. it happens in the chloroplast.';
    expect(pairs(generateCards(notes))).toEqual([
      ['Photosynthesis', 'How plants turn sunlight into food.'],
      ['Where does Photosynthesis happen?', 'In the chloroplast'],
    ]);
  });

  it('hides the key fact (a date, number or name) when no pattern fits', () => {
    const notes = 'Water boils at 100 degrees Celsius at sea level.';
    expect(pairs(generateCards(notes))).toEqual([
      ['Water boils at _____ degrees Celsius at sea level.', '100'],
    ]);
  });

  it('works alongside term/definition lines', () => {
    const notes = [
      'Cell: the basic unit of life',
      'Nucleus - holds the DNA',
      'Robert Hooke discovered cells in 1665.',
    ].join('\n');
    expect(pairs(generateCards(notes))).toEqual([
      ['Cell', 'the basic unit of life'],
      ['Nucleus', 'holds the DNA'],
      ['Who discovered cells in 1665?', 'Robert Hooke'],
    ]);
  });
});

describe('fact patterns', () => {
  it('asks what caused something, and what something led to', () => {
    expect(fact('The war was caused by tension between Britain and the colonies.'))
      .toEqual(['What caused the war?', 'Tension between Britain and the colonies']);
    expect(fact('The Boston Tea Party led to the Intolerable Acts.'))
      .toEqual(['What did the Boston Tea Party lead to?', 'The Intolerable Acts']);
  });

  it('asks why, in the past and present tense', () => {
    expect(fact('cells divide because they need to grow'))
      .toEqual(['Why do cells divide?', 'Because they need to grow']);
    expect(fact('Gatsby throws huge parties because he wants to impress Daisy.'))
      .toEqual(['Why does Gatsby throw huge parties?', 'Because he wants to impress Daisy']);
    expect(fact('The colonists protested the taxes because they had no vote.'))
      .toEqual(['Why did the colonists protest the taxes?', 'Because they had no vote']);
  });

  it('asks where, and who did something', () => {
    expect(fact('The first battles were fought in Massachusetts.'))
      .toEqual(['Where were the first battles fought?', 'Massachusetts']);
    expect(fact('George Washington led the Continental Army.'))
      .toEqual(['Who led the Continental Army?', 'George Washington']);
  });

  it('asks when, including present tense for stories', () => {
    expect(fact('the story takes place in the 1920s on Long Island'))
      .toEqual(['When does the story take place?', 'In the 1920s on Long Island']);
  });

  it('skips a sentence starting with "it" when there is nothing before it', () => {
    expect(fact('it started because of taxes')).toBeNull();
    expect(fact('it started because of taxes', 'the revolution'))
      .toEqual(['Why did the revolution start?', 'Because of taxes']);
  });

  it('makes no question from a sentence with no clear fact', () => {
    expect(fact('We talked about this a lot in class today.')).toBeNull();
    expect(fact('Is this on the test?')).toBeNull();
  });
});

describe('helpers', () => {
  it('turns past-tense verbs into their base form', () => {
    expect(['started', 'ended', 'declined', 'stopped', 'tried', 'began', 'fought', 'invaded', 'used'].map(baseForm))
      .toEqual(['start', 'end', 'decline', 'stop', 'try', 'begin', 'fight', 'invade', 'use']);
  });

  it('splits run-on notes at "and it", but not inside lists or after initials', () => {
    expect(splitSentences('the war began in 1914 and it ended in 1918'))
      .toEqual(['the war began in 1914', 'it ended in 1918']);
    expect(splitSentences('tension between Britain and the colonies grew'))
      .toEqual(['tension between Britain and the colonies grew']);
    expect(splitSentences('The Great Gatsby was written by F. Scott Fitzgerald. It is set in New York.'))
      .toEqual(['The Great Gatsby was written by F. Scott Fitzgerald.', 'It is set in New York.']);
  });

  it('finds the key fact to hide: a date first, then a number, then a name', () => {
    expect(keyFact('The Treaty of Paris ended the war in 1783')).toBe('1783');
    expect(keyFact('About 60 percent of the body is water')).toBe('60 percent');
    expect(keyFact('The theory of evolution came from Charles Darwin')).toBe('Charles Darwin');
    expect(keyFact('plants need water and light to grow')).toBeNull();
  });
});
