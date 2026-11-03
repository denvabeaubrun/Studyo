// defaultSubjects.js
//
// The starting data for a new visitor: five subjects, their classes, and two
// sample biology sets so there is something to study right away.
// A function (not a constant) so every call returns fresh objects, which keeps
// "Reset saved data" from sharing objects with data that was already changed.

function sampleBiologyCards1() {
  return [
    { id: 1001, front: 'Mitochondria', back: 'The powerhouse of the cell', mastered: true },
    { id: 1002, front: 'Cell membrane', back: 'Controls what enters and exits the cell', mastered: true },
    { id: 1003, front: 'Nucleus', back: 'Stores the cell\u2019s DNA and controls activity', mastered: false },
    { id: 1004, front: 'Ribosome', back: 'Builds proteins from amino acids', mastered: false },
  ];
}

function sampleBiologyCards2() {
  return [
    { id: 2001, front: 'Allele', back: 'A version of a gene', mastered: true },
    { id: 2002, front: 'Genotype', back: 'The genetic makeup of an organism', mastered: false },
    { id: 2003, front: 'Phenotype', back: 'The observable traits of an organism', mastered: false },
  ];
}

export function getDefaultSubjects() {
  return [
    {
      id: 1,
      name: 'Science',
      emoji: '🧬',
      color: '#7DD3A0',
      classes: [
        {
          id: 11, name: 'Biology', emoji: '🧬',
          sets: [
            { id: 111, title: 'Cell Bio Ch. 3', createdAt: '2026-09-10', cards: sampleBiologyCards1() },
            { id: 112, title: 'Genetics Ch. 5', createdAt: '2026-09-18', cards: sampleBiologyCards2() }
          ]
        },
        { id: 12, name: 'Chemistry', emoji: '🧪', color: '#5BC0EB', sets: [] },
        { id: 13, name: 'Physics', emoji: '⚛️', color: '#A78BFA', sets: [] },
        { id: 14, name: 'Astronomy', emoji: '🔭', color: '#475569', sets: [] }
      ]
    },
    {
      id: 2, name: 'Math', emoji: '🔢', color: '#5BC0EB',
      classes: [
        { id: 21, name: 'Geometry', emoji: '📐', sets: [] },
        { id: 22, name: 'Algebra', emoji: '🔢', sets: [] },
        { id: 23, name: 'Statistics', emoji: '📊', sets: [] },
        { id: 24, name: 'Calculus', emoji: '📈', sets: [] }
      ]
    },
    {
      id: 3, name: 'Social Studies', emoji: '📜', color: '#FBBF24',
      classes: [
        { id: 31, name: 'History', emoji: '🏛️', sets: [] },
        { id: 32, name: 'Geography', emoji: '🌍', sets: [] },
        { id: 33, name: 'Economics', emoji: '💰', sets: [] },
        { id: 34, name: 'Government', emoji: '🗳️', sets: [] }
      ]
    },
    {
      id: 4, name: 'English', emoji: '📖', color: '#bf2222',
      classes: [
        { id: 41, name: 'Literature', emoji: '📚', sets: [] },
        { id: 42, name: 'Writing', emoji: '✏️', sets: [] },
        { id: 43, name: 'Grammar', emoji: '🔤', sets: [] },
        { id: 44, name: 'Vocabulary', emoji: '📖', sets: [] }
      ]
    },
    {
      id: 5, name: 'Languages', emoji: '🌍', color: '#842570',
      classes: [
        { id: 51, name: 'Spanish', emoji: '🇪🇸', sets: [] },
        { id: 52, name: 'French', emoji: '🇫🇷', sets: [] },
        { id: 53, name: 'Mandarin', emoji: '🇨🇳', sets: [] },
        { id: 54, name: 'Japanese', emoji: '🇯🇵', sets: [] }
      ]
    }
  ];
}
