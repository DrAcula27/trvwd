import type { MeetingConfig } from './lib/meetings';

// ---- Everything the utility might need changed lives in this file. ----

export const site = {
  name: 'Tahuya River Valley Water District',
  tagline: 'Clean water and reliable service for our community.',
  phone: '360-275-0279',
  emergencyPhone: '',
  email: 'trvwdistrict@outlook.com',
  mailingAddress: 'P.O. Box 849, Belfair, WA 98528',
  location: '1665 NE Tahuya River Dr, Tahuya, WA 98588',
  hours: 'by appointment only, please call or email to schedule.',

  // IANA time zone. Meeting date/time math happens in this zone,
  // no matter where the visitor is.
  timeZone: 'America/Los_Angeles',

  // Google Sheet > File > Share > Publish to web > pick the "Alerts" tab > CSV.
  // Paste the resulting URL here. Leave '' to disable alerts.
  alertsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtUBwIyLtVa7FIjoi5KAjxllZsVy4vOILDOx0r-CIxtUs3M1vgqMdmb84vL1KU3XXNlwhwxCXsf1Un/pub?gid=0&single=true&output=csv',

  // Folder IDs: the long string at the end of a Drive folder's URL.
  // Each folder must be shared as "Anyone with the link: Viewer".
  driveFolders: {
    minutes: '1k-0UT1H1CezAI21zMrnWsRCzIW_41P-F',
    notices: '199qcoVf0nlcMlWwyz4NAfs3MHn4UaLZw',
    reports: '1dLj7wv6u4E37MOJhNXSptqEAWl2DI3_I',
    resolutions: '1uXDrMzW-VttOMECMgOeZ-7sbYmIAtgc9',
  },

  // Free key from web3forms.com (sends contact-form submissions to email).
  web3formsKey: '',
};

export const meeting: MeetingConfig = {
  weekday: 2, // 0 = Sunday ... 2 = Tuesday
  nth: 4, // fourth occurrence in the month
  time: '18:00', // 24-hour, utility's local time
  durationHours: 1, // meeting counts as "upcoming" until this long after start
  schedule: 'Fourth Tuesday of every month',
  location:
    'Tahuya River Valley Community Club, 1665 NE Tahuya River Dr, Tahuya, WA 98588',
  // Cancelled or rescheduled meetings. `date` is the REGULAR date affected.
  exceptions: [
    // { date: '2026-12-22', status: 'moved', newDate: '2026-12-15', note: 'Moved for the holidays.' },
    // { date: '2027-01-26', status: 'cancelled', note: 'No quorum expected.' },
  ],
};
