import { Chapter } from '../../../../types/game';

export const day4Chapter: Chapter = {
  dayNumber: 4,
  title: 'The Purchase',
  intro: 'Thursday. A breakthrough.',
  storyText: `A deep dive into financial records has uncovered something disturbing.

Three days before the murder, someone made an unusual purchase from an online chemistry supplier. The order? A compound that matches the poison found in the victim's coffee.

The purchase was made through a throwaway account, but shipping records don't lie. The package was delivered to an address linked to one of our suspects.

The walls are closing in. But the killer is getting nervous - there have been reports of evidence tampering. Someone tried to delete files from the mod archive last night.

You're getting close to the truth. Stay vigilant.`,
  crimeSceneObjects: [
    {
      id: 'obj_receipt_d4',
      name: 'Purchase Receipt',
      x: 35,
      y: 35,
      width: 16,
      height: 14,
      description: 'A digital receipt for chemical compounds. The shipping address is partially visible.',
      clueId: 'clue_purchase',
    },
    {
      id: 'obj_deleted_d4',
      name: 'Deleted Files',
      x: 60,
      y: 50,
      width: 18,
      height: 14,
      description: 'Records of deleted files from the mod archive. Someone is covering their tracks.',
    },
  ],
  newClues: [
    {
      id: 'clue_purchase',
      name: 'Suspicious Purchase',
      description: 'TrustedHelper bought chemicals online 3 days before the murder',
      found: false,
      linkedTo: 'suspect_insider',
    },
  ],
  witnesses: [
    {
      id: 'witness_delivery',
      name: 'u/DeliveryBot',
      description: 'An automated delivery tracking system',
      availableOnDay: 4,
      dialogueOptions: [
        {
          id: 'delivery_q1',
          text: 'Can you trace the chemical shipment?',
          response: 'Package #XR-7742 was delivered to 127 Digital Lane at 14:32 on Friday.',
          nextOptions: ['delivery_q1_2'],
        },
        {
          id: 'delivery_q1_2',
          text: 'Whose address is that?',
          response: 'Records show that address is registered to user account: TrustedHelper.',
          isSuspicious: true,
          unlocksClue: 'clue_purchase',
        },
        {
          id: 'delivery_q2',
          text: 'Any other suspicious deliveries?',
          response: 'No other chemical deliveries to suspects in the past 30 days.',
        },
      ],
    },
  ],
  suspectsRevealed: [],
  isAccusationDay: false,
};
