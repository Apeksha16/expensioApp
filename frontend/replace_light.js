const fs = require('fs');
const path = require('path');

const dir = './src';

const replacements = {
  '#0B0D11': '#F8FAFC',
  '#0B0F14': '#F8FAFC',
  '#1A1D24': '#FFFFFF',
  '#19202A': '#FFFFFF',
  '#20242B': '#F1F5F9',
  '#1E2634': '#F1F5F9',
  'rgba(213, 168, 102, 0.2)': '#E2E8F0',
  '#242D3D': '#E2E8F0',
  '#2A3441': '#E2E8F0',
  '#D5A866': '#3B82F6',
  '#00D1B2': '#3B82F6',
  '#0D9488': '#3B82F6',
  '213, 168, 102': '59, 130, 246',
  '0, 209, 178': '59, 130, 246',
  '#A0A4AB': '#64748B',
  '#CBD5E1': '#64748B',
  '#FFFFFF': '#0F172A',
  '#F8FAFC': '#0F172A',
  'rgba(255, 255, 255, 0.05)': 'rgba(0, 0, 0, 0.05)',
  'rgba(255, 255, 255, 0.1)': 'rgba(0, 0, 0, 0.05)',
  'rgba(255, 255, 255, 0.08)': 'rgba(0, 0, 0, 0.03)',
  'rgba(255, 255, 255, 0.15)': 'rgba(0, 0, 0, 0.08)',
  'rgba(255, 255, 255, 0.2)': 'rgba(0, 0, 0, 0.1)',
  'rgba(15, 23, 42, 0.85)': '#F8FAFC',
  '#0F172A': '#FFFFFF', // Fix bottom sheet
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Create a regex to match ANY of the keys
  const keys = Object.keys(replacements);
  // Sort by length descending to match longest strings first (e.g. rgba over hex)
  keys.sort((a, b) => b.length - a.length);
  
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const pattern = new RegExp(keys.map(escapeRegExp).join('|'), 'gi');
  
  content = content.replace(pattern, (matched) => {
    // Find the replacement. We ignore case in matching but need exact case for lookup or just use lower
    const key = Object.keys(replacements).find(k => k.toLowerCase() === matched.toLowerCase());
    return replacements[key] || matched;
  });

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Replacements completed successfully.');
