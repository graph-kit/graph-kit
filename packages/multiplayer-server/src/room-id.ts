import { randomInt } from 'node:crypto';

import { RoomId } from '@multiplayer/protocol/room';

const ROOM_ID_LENGTH = 4;
const ROOM_ID_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// four letter entries of LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
// (CC BY 4.0), plus slurs and deliberate misspellings of that length it does not carry
const BLOCKED_ROOM_IDS: ReadonlySet<RoomId> = new Set([
  'abbo',
  'anal',
  'anus',
  'arse',
  'bdsm',
  'bewb',
  'bich',
  'boob',
  'butt',
  'cawk',
  'chug',
  'clit',
  'cnut',
  'cocc',
  'cock',
  'coon',
  'crap',
  'cuck',
  'cumm',
  'cums',
  'cunt',
  'dicc',
  'dick',
  'dike',
  'dikk',
  'dilf',
  'dvda',
  'dyke',
  'fags',
  'fagz',
  'fcuk',
  'fucc',
  'fuck',
  'fukc',
  'fukk',
  'fukn',
  'fuks',
  'gilf',
  'gimp',
  'gook',
  'guro',
  'heeb',
  'homo',
  'hoor',
  'japs',
  'jizm',
  'jizz',
  'kike',
  'kock',
  'koon',
  'kunt',
  'kyke',
  'loli',
  'mick',
  'milf',
  'mong',
  'nazi',
  'nazy',
  'nsfw',
  'nude',
  'orgy',
  'paki',
  'paky',
  'pedo',
  'phag',
  'phuc',
  'phuk',
  'piss',
  'poof',
  'poon',
  'porn',
  'pron',
  'pthc',
  'quim',
  'qunt',
  'raep',
  'rape',
  'scat',
  'sexo',
  'sexx',
  'sexy',
  'shit',
  'shiz',
  'shyt',
  'slut',
  'slvt',
  'smut',
  'spaz',
  'spic',
  'spik',
  'succ',
  'suck',
  'sukk',
  'tard',
  'tits',
  'titz',
  'turd',
  'twat',
  'wank',
  'whor',
  'wops',
  'yaoi',
]);

/** a code this short gets typed by hand, and nobody types the case */
export const normalizeRoomId = (roomId: string): RoomId => roomId.toLowerCase();

export const generateRoomId = (
  isTaken: (roomId: RoomId) => boolean,
): RoomId => {
  while (true) {
    let roomId = '';
    for (let i = 0; i < ROOM_ID_LENGTH; i++) {
      roomId += ROOM_ID_LETTERS[randomInt(ROOM_ID_LETTERS.length)];
    }
    if (!isTaken(roomId) && !BLOCKED_ROOM_IDS.has(normalizeRoomId(roomId))) {
      return roomId;
    }
  }
};
