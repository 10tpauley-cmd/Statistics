import type { Source } from '../engine/types';

export interface Dataset {
  id: string;
  title: string;
  description: string;
  variable: string;
  unit?: string;
  data: number[];
  source: Source;
}

export interface BivariateDataset {
  id: string;
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  x: number[];
  y: number[];
  source: Source;
  note?: string;
}

/** One-variable datasets printed in the course PDF. */
export const DATASETS: Dataset[] = [
  { id: 'chips', title: 'Air in chip bags', description: 'Percent of air in 14 popular brands of chips (Kitchen Cabinet Kings).', variable: 'Air', unit: '%', data: [46, 59, 48, 19, 47, 41, 39, 45, 28, 50, 50, 41, 49, 34], source: { pages: [22, 52, 59], section: '2.1–2.2, 2.7 Practice' } },
  { id: 'oj', title: 'Orange juice prices', description: 'Price of a 60 fl. oz. carton at 18 randomly selected Baltimore grocery stores.', variable: 'Price', unit: '$', data: [3.98, 3.59, 3.89, 4.49, 3.59, 2.99, 3.19, 5.99, 4.0, 3.69, 4.59, 3.99, 3.79, 4.19, 3.5, 4.89, 4.29, 3.99], source: { pages: [20, 52, 56], section: '2.4, 2.6 & 2.7 Practice' } },
  { id: 'paint-a', title: 'Paint Brand A', description: 'Months before fading for 6 cans of Brand A outdoor paint.', variable: 'Months', unit: 'months', data: [10, 60, 55, 22, 48, 15], source: { pages: [50], section: '2.7 Example 1' } },
  { id: 'paint-b', title: 'Paint Brand B', description: 'Months before fading for 6 cans of Brand B outdoor paint.', variable: 'Months', unit: 'months', data: [35, 45, 30, 35, 40, 25], source: { pages: [50], section: '2.7 Example 1' } },
  { id: 'mcd', title: "McDonald's beef sandwich fat", description: 'Fat (grams) in twelve McDonald\'s beef sandwiches (the 54 g Big Tasty was omitted).', variable: 'Fat', unit: 'g', data: [27, 11, 22, 21, 40, 8, 17, 15, 29, 31, 27, 26], source: { pages: [51], section: '2.7 Example 2' } },
  { id: 'payroll-2002', title: 'MLB payroll 2002', description: 'Total payroll of all 30 MLB teams in 2002 (millions of dollars).', variable: 'Payroll', unit: '$ millions', data: [126, 108, 106, 103, 95, 95, 93, 80, 79, 78, 77, 76, 75, 63, 62, 60, 58, 57, 57, 55, 50, 47, 45, 42, 42, 41, 40, 40, 39, 34], source: { pages: [57], section: '2.1–2.2 Example 1 (Moneyball)' } },
  { id: 'payroll-2003', title: 'MLB payroll 2003', description: 'Total payroll of all 30 MLB teams in 2003 (millions of dollars), from the side-by-side stem plot.', variable: 'Payroll', unit: '$ millions', data: [20, 41, 41, 48, 49, 49, 49, 50, 51, 51, 52, 55, 56, 59, 67, 71, 71, 74, 79, 80, 81, 83, 83, 87, 100, 103, 106, 106, 117, 153], source: { pages: [57, 58], section: '2.1–2.2 Example 1–2' } },
  { id: 'actors', title: 'Best Actor ages', description: 'Ages of 29 Academy Award winning best actors.', variable: 'Age', unit: 'years', data: [18, 21, 22, 25, 26, 27, 29, 30, 31, 33, 36, 37, 41, 42, 47, 52, 55, 57, 58, 62, 64, 67, 69, 71, 72, 73, 74, 76, 77], source: { pages: [22, 59], section: '2.1–2.2 Practice #1' } },
  { id: 'speeds-north', title: 'Northbound speeds', description: 'Radar speeds (mph) of northbound cars in a 15-minute midday period.', variable: 'Speed', unit: 'mph', data: [60, 62, 62, 63, 63, 63, 64, 64, 64, 65, 65, 65, 65, 66, 66, 67, 68, 70, 83], source: { pages: [54], section: '2.4, 2.6 Example 2' } },
  { id: 'concerts-students', title: 'Concerts — students', description: 'Number of concerts attended by students in a PREP class at Linganore.', variable: 'Concerts', data: [0, 0, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 10, 10, 10, 10, 11, 11, 13, 13, 19, 20, 20, 31, 37], source: { pages: [48], section: '2.8 Example 1' } },
  { id: 'concerts-teachers', title: 'Concerts — teachers', description: 'Number of concerts attended by randomly selected teachers at Linganore.', variable: 'Concerts', data: [0, 6, 8, 9, 10, 10, 12, 14, 14, 15, 15, 15, 16, 17, 17, 18, 20, 22, 23, 24, 25, 29], source: { pages: [48], section: '2.8 Example 1' } },
  { id: 'hr-alone', title: 'Heart rate — alone', description: 'Heart rate (bpm) of women doing a stressful task alone.', variable: 'Heart rate', unit: 'bpm', data: [62.6, 70.9, 73.3, 75.5, 77.8, 80.4, 84.5, 84.7, 84.9, 87.2, 87.4, 87.8, 90.0, 91.8, 99.0], source: { pages: [15, 49], section: '2.8 Practice #2' } },
  { id: 'hr-friend', title: 'Heart rate — friend', description: 'Heart rate (bpm) of women doing a stressful task with a friend present.', variable: 'Heart rate', unit: 'bpm', data: [76.9, 80.3, 81.6, 83.4, 87.0, 88.0, 89.8, 91.4, 92.5, 97.0, 98.2, 99.7, 100.9, 101.1, 102.2], source: { pages: [15, 49], section: '2.8 Practice #2' } },
  { id: 'hr-pet', title: 'Heart rate — pet', description: 'Heart rate (bpm) of women doing a stressful task with their dog present.', variable: 'Heart rate', unit: 'bpm', data: [58.7, 64.2, 65.4, 68.9, 69.2, 69.2, 69.5, 70.1, 70.2, 72.3, 76.0, 79.7, 85.0, 86.4, 97.5], source: { pages: [15, 49], section: '2.8 Practice #2', note: 'The PDF key reports mean 73.213 / median 69.8; the printed data give 73.487 / 70.1.' } },
  { id: 'lyme-a', title: 'Lyme disease — Researcher A', description: 'Weeks of symptoms for 40 patients (Researcher A, people they knew personally).', variable: 'Duration', unit: 'weeks', data: [3, 4, 11, 15, 16, 17, 22, 44, 37, 16, 14, 24, 25, 15, 26, 27, 33, 29, 35, 44, 13, 21, 22, 10, 12, 8, 40, 32, 26, 27, 31, 34, 29, 17, 8, 24, 18, 47, 33, 34], source: { pages: [63], section: '1.3–1.4 Practice #1' } },
  { id: 'lyme-b', title: 'Lyme disease — Researcher B', description: 'Weeks of symptoms for 40 patients at a randomly selected state hospital (Researcher B).', variable: 'Duration', unit: 'weeks', data: [3, 14, 11, 5, 16, 17, 28, 41, 31, 18, 14, 14, 26, 25, 21, 22, 31, 2, 35, 44, 23, 21, 21, 16, 12, 18, 41, 22, 16, 25, 4, 34, 29, 13, 18, 24, 23, 42, 33, 29], source: { pages: [63], section: '1.3–1.4 Practice #1' } },
  { id: 'corporations', title: 'Corporation net worth', description: 'Net worth ($ billions) of 45 national corporations, rebuilt from histogram midpoints.', variable: 'Net worth', unit: '$ billions', data: [...Array(2).fill(15), ...Array(8).fill(25), ...Array(15).fill(45), ...Array(7).fill(55), ...Array(10).fill(65), ...Array(3).fill(75)], source: { pages: [2], section: 'Exam #1 Review #7' } },
  { id: 'ap-exam', title: 'AP Statistics scores', description: 'AP Statistics exam scores (1–5) for 20 Urbana High School students, from the histogram.', variable: 'Score', data: [1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5], source: { pages: [23, 59], section: '2.1–2.2 Practice #4' } },
];

export const BIVARIATE: BivariateDataset[] = [
  { id: 'scuba', title: 'SCUBA dive times', description: 'Depth vs. maximum dive time.', xLabel: 'Depth (ft)', yLabel: 'Max dive time (min)', x: [50, 60, 70, 80, 90, 100, 130], y: [80, 55, 45, 35, 25, 22, 10], source: { pages: [43, 44], section: '12.1 Example 1' } },
  { id: 'archaeopteryx', title: 'Archaeopteryx bones', description: 'Femur vs. humerus length for five fossil specimens.', xLabel: 'Femur (cm)', yLabel: 'Humerus (cm)', x: [38, 56, 59, 64, 74], y: [41, 63, 70, 72, 84], source: { pages: [10, 11, 46], section: '12.1 Practice #2' } },
  { id: 'coasters', title: 'Roller coasters', description: 'Height vs. maximum speed for seven roller coasters (rcdb.com).', xLabel: 'Height (ft)', yLabel: 'Max speed (mph)', x: [116.5, 51.8, 305.0, 72.2, 205.0, 195.0, 124.6], y: [47.0, 35.0, 90.0, 46.6, 71.0, 67.0, 43.5], source: { pages: [45], section: '12.1 Example 3' } },
  { id: 'spelling', title: 'Spelling Bee vs. spider bites', description: 'Letters in the winning Spelling Bee word vs. deaths by spider bite per year (11 years; two pairs repeat).', xLabel: 'Letters in winning word', yLabel: 'Spider-bite deaths', x: [9, 8, 11, 12, 11, 13, 12, 9, 9, 7, 9], y: [6, 5, 5, 10, 8, 14, 10, 4, 8, 5, 6], source: { pages: [2], section: 'Exam #1 Review #9' }, note: 'Reproduces the key exactly: ŷ = −5.4141 + 1.2778x, r = .806.' },
  { id: 'iphone', title: 'iPhone opening weekend sales', description: 'Years since 2007 vs. units sold (millions).', xLabel: 'Years since 2007', yLabel: 'Units sold (millions)', x: [0, 1, 2, 3, 4, 5, 6, 7, 8], y: [0.5, 1, 1, 1.7, 4, 5, 9, 10, 13], source: { pages: [13, 14], section: '12.5 Practice #6' } },
  { id: 'yogurt', title: 'Yogurt protein vs. calories', description: '10 brands of flavored yogurt (values read from the PDF scatterplot).', xLabel: 'Protein (g)', yLabel: 'Calories', x: [5, 6, 7, 8, 8, 9, 12, 13, 13, 14], y: [180, 150, 130, 160, 140, 310, 100, 130, 120, 80], source: { pages: [45], section: '12.1 Example 2', note: 'Approximate values read from the plot.' } },
];

export function datasetById(id: string) {
  return DATASETS.find((d) => d.id === id);
}
export function bivariateById(id: string) {
  return BIVARIATE.find((d) => d.id === id);
}

/** Two-way tables printed in the PDF (used by conditional-probability lessons and questions). */
export interface TwoWayTable {
  id: string;
  title: string;
  rowVar: string;
  colVar: string;
  rows: string[];
  cols: string[];
  counts: number[][];
  source: Source;
}

export const TABLES: TwoWayTable[] = [
  { id: 'subjects', title: 'Favorite subject (Mr. Halter\'s classes)', rowVar: 'Subject', colVar: 'Class', rows: ['English', 'Math', 'Science', 'Soc. Studies'], cols: ['Seniors', 'Non-Seniors'], counts: [[13, 5], [8, 11], [15, 2], [14, 7]], source: { pages: [32, 37], section: '3.1–3.5 Example 3' } },
  { id: 'superheroes', title: 'Favorite superhero by grade', rowVar: 'Grade', colVar: 'Superhero', rows: ['9th', '10th', '11th', '12th'], cols: ['Spiderman', 'Iron Man', 'Capt. America'], counts: [[11, 8, 6], [8, 6, 8], [4, 10, 8], [7, 5, 3]], source: { pages: [35, 40], section: '3.1–3.5 Example 8' } },
  { id: 'medals', title: '2004 Olympic medals (top 24 countries)', rowVar: 'Country', colVar: 'Medal', rows: ['United States', 'China', 'Japan', 'Great Britain', 'ROC (Russia)', 'Australia', 'Netherlands', 'Others'], cols: ['Gold', 'Silver', 'Bronze'], counts: [[39, 41, 33], [38, 32, 18], [27, 14, 17], [22, 21, 22], [20, 28, 23], [17, 7, 22], [10, 12, 14], [167, 183, 253]], source: { pages: [5, 41], section: '3.1–3.5 Practice #2' } },
  { id: 'procrastination', title: 'AP class vs. procrastination', rowVar: 'Procrastinate often?', colVar: 'Taking AP class?', rows: ['Yes', 'No'], cols: ['AP: Yes', 'AP: No'], counts: [[58, 24], [12, 22]], source: { pages: [7, 8, 42], section: '3.1–3.5 Practice #11', note: 'The PDF key computes P(Y) = 0.7069 where P(Y′) was asked; P(Y′) = 34/116 ≈ 0.2931.' } },
  { id: 'mothers', title: 'Pew Research: number of children', rowVar: 'Number of children', colVar: 'Year surveyed', rows: ['1 child', '2 children', '3 children', '4+ children'], cols: ['1976', '1994', '2014'], counts: [[11, 21, 22], [24, 43, 41], [25, 23, 24], [40, 13, 13]], source: { pages: [8, 9, 42], section: '3.1–3.5 Practice #13' } },
];

export function tableById(id: string) {
  return TABLES.find((t) => t.id === id)!;
}
