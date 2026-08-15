import { randomInt } from 'node:crypto';

import { RoomId } from '@multiplayer/protocol/room';

const ROOM_ID_LENGTH = 4;
const ROOM_ID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// four letter entries of LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
// (CC BY 4.0), plus slurs and deliberate misspellings of that length it does not carry
const BLOCKED_ROOM_IDS: ReadonlySet<RoomId> = new Set([
  'ABBO',
  'ANAL',
  'ANUS',
  'ARSE',
  'BDSM',
  'BEWB',
  'BICH',
  'BOOB',
  'BUTT',
  'CAWK',
  'CHUG',
  'CLIT',
  'CNUT',
  'COCC',
  'COCK',
  'COON',
  'CRAP',
  'CUCK',
  'CUMM',
  'CUMS',
  'CUNT',
  'DICC',
  'DICK',
  'DIKE',
  'DIKK',
  'DILF',
  'DVDA',
  'DYKE',
  'FAGS',
  'FAGZ',
  'FCUK',
  'FUCC',
  'FUCK',
  'FUKC',
  'FUKK',
  'FUKN',
  'FUKS',
  'GILF',
  'GIMP',
  'GOOK',
  'GURO',
  'HEEB',
  'HOMO',
  'HOOR',
  'JAPS',
  'JIZM',
  'JIZZ',
  'KIKE',
  'KOCK',
  'KOON',
  'KUNT',
  'KYKE',
  'LOLI',
  'MICK',
  'MILF',
  'MONG',
  'NAZI',
  'NAZY',
  'NSFW',
  'NUDE',
  'ORGY',
  'PAKI',
  'PAKY',
  'PEDO',
  'PHAG',
  'PHUC',
  'PHUK',
  'PISS',
  'POOF',
  'POON',
  'PORN',
  'PRON',
  'PTHC',
  'QUIM',
  'QUNT',
  'RAEP',
  'RAPE',
  'SCAT',
  'SEXO',
  'SEXX',
  'SEXY',
  'SHIT',
  'SHIZ',
  'SHYT',
  'SLUT',
  'SLVT',
  'SMUT',
  'SPAZ',
  'SPIC',
  'SPIK',
  'SUCC',
  'SUCK',
  'SUKK',
  'TARD',
  'TITS',
  'TITZ',
  'TURD',
  'TWAT',
  'WANK',
  'WHOR',
  'WOPS',
  'YAOI',
]);

export const generateRoomId = (
  isTaken: (roomId: RoomId) => boolean,
): RoomId => {
  while (true) {
    let roomId = '';
    for (let i = 0; i < ROOM_ID_LENGTH; i++) {
      roomId += ROOM_ID_LETTERS[randomInt(ROOM_ID_LETTERS.length)];
    }
    if (!isTaken(roomId) && !BLOCKED_ROOM_IDS.has(roomId)) return roomId;
  }
};

/** a code this short gets typed by hand, so a lowercase one still has to resolve */
export const normalizeRoomId = (roomId: string): RoomId => roomId.toUpperCase();
