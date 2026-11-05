type Gender = 'male' | 'female';

const UNCHANGED_ENDINGS = ['ко', 'о', 'е', 'у', 'ю', 'их', 'ых'];
const MALE_FEMININE_LOOKING_NAMES = new Set([
  'никита', 'илья', 'лука', 'фома', 'савва', 'кузьма', 'данила', 'никола', 'гаврила', 'сава',
]);

const endsWithAny = (word: string, endings: string[]) => endings.some((ending) => word.endsWith(ending));

const detectGender = (surname: string, firstName: string, patronymic: string): Gender => {
  const patronymicLower = patronymic.toLowerCase();
  if (patronymicLower) {
    if (endsWithAny(patronymicLower, ['вна', 'чна'])) return 'female';
    if (endsWithAny(patronymicLower, ['вич', 'ич'])) return 'male';
  }

  const firstLower = firstName.toLowerCase();
  if (firstLower && !MALE_FEMININE_LOOKING_NAMES.has(firstLower) && endsWithAny(firstLower, ['а', 'я'])) {
    return 'female';
  }
  if (firstLower) return 'male';

  return endsWithAny(surname.toLowerCase(), ['а', 'я']) ? 'female' : 'male';
};

const declineSurname = (word: string, gender: Gender): string => {
  const lower = word.toLowerCase();
  if (endsWithAny(lower, UNCHANGED_ENDINGS)) return word;

  if (gender === 'female') {
    if (lower.endsWith('ая')) return `${word.slice(0, -2)}ой`;
    if (lower.endsWith('а')) return `${word.slice(0, -1)}ой`;
    if (lower.endsWith('я')) return `${word.slice(0, -1)}ей`;
    if (lower.endsWith('ь')) return `${word.slice(0, -1)}и`;
    return word;
  }

  if (endsWithAny(lower, ['ий', 'ый', 'ой'])) return `${word.slice(0, -2)}ого`;
  if (lower.endsWith('ь')) return `${word.slice(0, -1)}я`;
  if (endsWithAny(lower, ['а', 'я'])) return word;
  return `${word}а`;
};

const IRREGULAR_MALE_FIRST_NAMES: Record<string, string> = { лев: 'льва' };

const declineFirstName = (word: string, gender: Gender): string => {
  const lower = word.toLowerCase();
  const irregular = gender === 'male' ? IRREGULAR_MALE_FIRST_NAMES[lower] : undefined;
  if (irregular) return word[0] === lower[0] ? irregular : irregular.charAt(0).toUpperCase() + irregular.slice(1);

  if (gender === 'female') {
    if (lower.endsWith('а')) return `${word.slice(0, -1)}ы`;
    if (lower.endsWith('я') || lower.endsWith('ь')) return `${word.slice(0, -1)}и`;
    return word;
  }

  if (lower.endsWith('ий')) return `${word.slice(0, -2)}ия`;
  if (lower.endsWith('ей') || lower.endsWith('ь') || lower.endsWith('й')) return `${word.slice(0, -1)}я`;
  if (lower.endsWith('а')) return `${word.slice(0, -1)}ы`;
  if (lower.endsWith('я')) return `${word.slice(0, -1)}и`;
  if (endsWithAny(lower, UNCHANGED_ENDINGS)) return word;
  return `${word}а`;
};

const declinePatronymic = (word: string, gender: Gender): string => {
  const lower = word.toLowerCase();
  if (gender === 'female') {
    return lower.endsWith('а') ? `${word.slice(0, -1)}ы` : word;
  }
  if (endsWithAny(lower, UNCHANGED_ENDINGS)) return word;
  return `${word}а`;
};

export const toGenitiveFullName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  const [surname, firstName = '', patronymic = ''] = parts;
  const gender = detectGender(surname, firstName, patronymic);

  return [
    declineSurname(surname, gender),
    firstName ? declineFirstName(firstName, gender) : '',
    patronymic ? declinePatronymic(patronymic, gender) : '',
  ]
    .filter(Boolean)
    .join(' ');
};
