import { Practice } from './types';

// Seed practices - a few for each node to start
export const practices: Practice[] = [
  // METTA - SELF
  {
    id: 'metta-self-theravada-1',
    title: 'Classical Metta for Self',
    brahmavihara: 'metta',
    object: 'self',
    type: 'formal',
    tradition: 'theravada',
    source: 'Based on Visuddhimagga',
    duration: 10,
    instructions: `Sit comfortably. Allow your body to settle.

Bring attention to the center of your chest — the heart space.

Call to mind your own being. You might visualize yourself sitting here, or simply rest in the felt sense of "I am."

Begin to offer yourself these phrases, slowly, feeling their meaning:

May I be free from danger.
May I be free from mental suffering.
May I be free from physical suffering.
May I live with ease.

Repeat these phrases gently. Let them sink below the words into actual well-wishing for yourself.

When the mind wanders, return. When resistance arises, note it and continue. You are learning to wish yourself well.`,
    reflectionPrompts: [
      'What arose as you offered yourself loving-kindness?',
      'Where did you feel this practice in your body, if anywhere?',
      'What resistance, if any, did you notice?',
    ],
  },
  {
    id: 'metta-self-micro-1',
    title: 'Self-Kindness in Difficulty',
    brahmavihara: 'metta',
    object: 'self',
    type: 'micro',
    tradition: 'nonsectarian',
    instructions: `The next time you notice yourself struggling or suffering today — even slightly — pause.

Place a hand on your heart if it feels natural.

Silently say: "This is hard. May I be kind to myself in this moment."

Then continue with your day.`,
    reflectionPrompts: [
      'Were you able to catch a moment of difficulty today?',
      'What happened when you offered yourself kindness?',
      'Did anything shift, even slightly?',
    ],
  },

  // METTA - BENEFACTOR
  {
    id: 'metta-benefactor-theravada-1',
    title: 'Metta for Benefactor',
    brahmavihara: 'metta',
    object: 'benefactor',
    type: 'formal',
    tradition: 'theravada',
    duration: 10,
    instructions: `Settle into your seat. Take a few breaths to arrive.

Call to mind someone who has been genuinely kind to you. A teacher, mentor, friend, or family member who wished you well without complication. Choose someone for whom gratitude arises easily.

See them in your mind's eye. Feel their presence.

Now offer them these phrases:

May you be free from danger.
May you be free from mental suffering.
May you be free from physical suffering.
May you live with ease.

Let the warmth you feel for this person fill your heart. Let the phrases carry that warmth.`,
    reflectionPrompts: [
      'Who did you choose as your benefactor?',
      'What did it feel like to wish them well?',
      'How did this compare to metta for yourself?',
    ],
  },

  // METTA - FRIEND (placeholder)
  {
    id: 'metta-friend-theravada-1',
    title: 'Metta for Dear Friend',
    brahmavihara: 'metta',
    object: 'friend',
    type: 'formal',
    tradition: 'theravada',
    duration: 10,
    instructions: `Settle into your seat. Take a few breaths to arrive.

Call to mind a dear friend — someone you care about without romantic attachment or complicated history. Someone whose happiness you genuinely wish for.

See them clearly. Feel your connection.

Offer them these phrases:

May you be free from danger.
May you be free from mental suffering.
May you be free from physical suffering.
May you live with ease.

Notice if attachment arises — wanting them to like you, wanting something from them. Simply return to pure well-wishing.`,
    reflectionPrompts: [
      'Who did you choose as your dear friend?',
      'Did any attachment or wanting arise?',
      'What is it like to wish someone well without wanting anything in return?',
    ],
  },

  // More practices would be added here for neutral, difficult, all beings
  // and for karuna, mudita, upekkha tracks
];

// Opening aspirations (bodhicitta)
export const aspirations = [
  {
    id: 'aspiration-traditional',
    text: `For the benefit of all sentient beings, I engage in this practice.
May this practice awaken my heart and serve the liberation of all.`,
    source: 'Traditional',
  },
  {
    id: 'aspiration-shantideva',
    text: `Just as all the previous sugatas
Gave birth to the awakened mind,
And just as they followed step by step
The training of a bodhisattva,
In the same way, for the benefit of beings,
I too will give birth to the awakened mind,
And in the same way I too will train
Step by step in the bodhisattva path.`,
    source: 'Shantideva, Bodhicaryavatara',
  },
  {
    id: 'aspiration-simple',
    text: `May this practice benefit all beings.`,
    source: 'Simple aspiration',
  },
];

// Dedications of merit
export const dedications = [
  {
    id: 'dedication-traditional',
    text: `By this merit, may all beings be free from suffering.
May all beings know peace.
May all beings awaken.`,
    source: 'Traditional',
  },
  {
    id: 'dedication-shantideva',
    text: `May all beings everywhere,
Plagued by sufferings of body and mind,
Obtain an ocean of happiness and joy
By virtue of my merits.`,
    source: 'Shantideva',
  },
];

// Get practices for a specific node
export function getPracticesForNode(node: string): Practice[] {
  const [brahmavihara, object] = node.split('-');
  return practices.filter(
    (p) => p.brahmavihara === brahmavihara && p.object === object
  );
}

// Get a random practice for a node
export function getRandomPractice(node: string): Practice | null {
  const nodePractices = getPracticesForNode(node);
  if (nodePractices.length === 0) return null;
  return nodePractices[Math.floor(Math.random() * nodePractices.length)];
}
