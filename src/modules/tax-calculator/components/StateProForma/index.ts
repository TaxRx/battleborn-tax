import { caConfig } from './ca';
import { akConfig } from './ak';
import { azConfig } from './az';
import { ctConfig } from './ct';
import { nyConfig } from './ny';
import { txConfig } from './tx';
import { ilConfig } from './il';
import { paConfig } from './pa';
import { ohConfig } from './oh';
import { gaConfig } from './ga';
import { vaConfig } from './va';
import { coConfig } from './co';
import { ncConfig } from './nc';
import { mdConfig } from './md';
import { maConfig } from './ma';
import { miConfig } from './mi';
import { njConfig } from './nj';
import { flConfig } from './fl';
import { waConfig } from './wa';
import { orConfig } from './or';
import { laConfig } from './la';
import { kyConfig } from './ky';
import { arConfig } from './ar';
import { msConfig } from './ms';
import { nmConfig } from './nm';
import { okConfig } from './ok';
import { utConfig } from './ut';
import { idConfig } from './id';
import { meConfig } from './me';
import { vtConfig } from './vt';
import { riConfig } from './ri';
import { deConfig } from './de';
import { hiConfig } from './hi';

export interface StateConfig {
  code: string;
  name: string;
  formName: string;
  forms: Record<string, { name: string; method: string; lines: any[] }>;
  hasAlternativeMethod: boolean;
}

export const STATE_CONFIGS: Record<string, StateConfig> = {
  CA: {
    code: 'CA',
    name: 'California',
    formName: 'Form 3523',
    forms: caConfig.forms,
    hasAlternativeMethod: true,
  },
  AK: {
    code: 'AK',
    name: 'Alaska',
    formName: 'Form 6390',
    forms: akConfig.forms,
    hasAlternativeMethod: false,
  },
  AZ: {
    code: 'AZ',
    name: 'Arizona',
    formName: 'Form 308',
    forms: azConfig.forms,
    hasAlternativeMethod: false,
  },
  CT: {
    code: 'CT',
    name: 'Connecticut',
    formName: 'Form 1120 RDC',
    forms: ctConfig.forms,
    hasAlternativeMethod: true,
  },
  NY: {
    code: 'NY',
    name: 'New York',
    formName: 'Form CT-3',
    forms: nyConfig.forms,
    hasAlternativeMethod: false,
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    formName: 'Form 05-163',
    forms: txConfig.forms,
    hasAlternativeMethod: false,
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    formName: 'Form IL-1120',
    forms: ilConfig.forms,
    hasAlternativeMethod: false,
  },
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    formName: 'Form RCT-101',
    forms: paConfig.forms,
    hasAlternativeMethod: false,
  },
  OH: {
    code: 'OH',
    name: 'Ohio',
    formName: 'Form IT 1140',
    forms: ohConfig.forms,
    hasAlternativeMethod: false,
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    formName: 'Form IT-RD',
    forms: gaConfig.forms,
    hasAlternativeMethod: false,
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    formName: 'Form 500',
    forms: vaConfig.forms,
    hasAlternativeMethod: false,
  },
  CO: {
    code: 'CO',
    name: 'Colorado',
    formName: 'Form DR 0097',
    forms: coConfig.forms,
    hasAlternativeMethod: false,
  },
  NC: {
    code: 'NC',
    name: 'North Carolina',
    formName: 'Form CD-401',
    forms: ncConfig.forms,
    hasAlternativeMethod: false,
  },
  MD: {
    code: 'MD',
    name: 'Maryland',
    formName: 'Form 500CR',
    forms: mdConfig.forms,
    hasAlternativeMethod: false,
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    formName: 'Form 355M',
    forms: maConfig.forms,
    hasAlternativeMethod: false,
  },
  MI: {
    code: 'MI',
    name: 'Michigan',
    formName: 'Form 4300',
    forms: miConfig.forms,
    hasAlternativeMethod: false,
  },
  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    formName: 'Form CBT-100',
    forms: njConfig.forms,
    hasAlternativeMethod: false,
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    formName: 'Form F-1120',
    forms: flConfig.forms,
    hasAlternativeMethod: false,
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    formName: 'Form 40',
    forms: waConfig.forms,
    hasAlternativeMethod: false,
  },
  OR: {
    code: 'OR',
    name: 'Oregon',
    formName: 'Form 20',
    forms: orConfig.forms,
    hasAlternativeMethod: false,
  },
  LA: {
    code: 'LA',
    name: 'Louisiana',
    formName: 'Form CIFT-620',
    forms: laConfig.forms,
    hasAlternativeMethod: false,
  },
  KY: {
    code: 'KY',
    name: 'Kentucky',
    formName: 'Form 720',
    forms: kyConfig.forms,
    hasAlternativeMethod: false,
  },
  AR: {
    code: 'AR',
    name: 'Arkansas',
    formName: 'Form AR1100CT',
    forms: arConfig.forms,
    hasAlternativeMethod: false,
  },
  MS: {
    code: 'MS',
    name: 'Mississippi',
    formName: 'Form 83-105',
    forms: msConfig.forms,
    hasAlternativeMethod: false,
  },
  NM: {
    code: 'NM',
    name: 'New Mexico',
    formName: 'Form CIT-1',
    forms: nmConfig.forms,
    hasAlternativeMethod: false,
  },
  OK: {
    code: 'OK',
    name: 'Oklahoma',
    formName: 'Form 512',
    forms: okConfig.forms,
    hasAlternativeMethod: false,
  },
  UT: {
    code: 'UT',
    name: 'Utah',
    formName: 'Form TC-20',
    forms: utConfig.forms,
    hasAlternativeMethod: false,
  },
  ID: {
    code: 'ID',
    name: 'Idaho',
    formName: 'Form 41',
    forms: idConfig.forms,
    hasAlternativeMethod: false,
  },
  ME: {
    code: 'ME',
    name: 'Maine',
    formName: 'Form 1120ME',
    forms: meConfig.forms,
    hasAlternativeMethod: false,
  },
  VT: {
    code: 'VT',
    name: 'Vermont',
    formName: 'Form CO-411',
    forms: vtConfig.forms,
    hasAlternativeMethod: false,
  },
  RI: {
    code: 'RI',
    name: 'Rhode Island',
    formName: 'Form RI-1120C',
    forms: riConfig.forms,
    hasAlternativeMethod: false,
  },
  DE: {
    code: 'DE',
    name: 'Delaware',
    formName: 'Form 1100',
    forms: deConfig.forms,
    hasAlternativeMethod: false,
  },
  HI: {
    code: 'HI',
    name: 'Hawaii',
    formName: 'Form N-11',
    forms: hiConfig.forms,
    hasAlternativeMethod: false,
  },
};

export function getAvailableStates(): StateConfig[] {
  return Object.values(STATE_CONFIGS);
}

export function getStateConfig(stateCode: string): StateConfig | undefined {
  return STATE_CONFIGS[stateCode];
} 