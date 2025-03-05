#!/usr/bin/env node

/**
 * Migration script to convert Mokku data from the old format to the format
 * expected by the import process.
 * 
 * This script is specifically designed for the format shown in the attached file,
 * which appears to be a JSON object with a 'mocks' array and additional properties
 * like 'theme' and 'totalMocksCreated'.
 * 
 * Usage:
 * 1. Save your old Mokku data as old.json
 * 2. Run: node migrate-mokku-data.js
 * 3. The script will generate migrated-mocks.json which can be imported into Mokku
 */

const fs = require('fs');
const path = require('path');

// Input and output file paths
const INPUT_FILE = 'old.json';
const OUTPUT_FILE = 'migrated-mocks.json';

try {
  // Read the input file
  console.log(`Reading data from ${INPUT_FILE}...`);
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  
  // Parse the JSON data
  let oldData;
  try {
    oldData = JSON.parse(rawData);
  } catch (e) {
    console.error('Error parsing JSON:', e.message);
    console.log('Attempting to fix JSON format...');
    
    // Try to fix common JSON issues
    const fixedJson = rawData
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays
    
    try {
      oldData = JSON.parse(fixedJson);
      console.log('Successfully fixed JSON format!');
    } catch (e2) {
      throw new Error('Could not parse JSON even after attempting fixes. Please check the file format.');
    }
  }
  
  // Check if the data has the expected structure
  if (!oldData.mocks || !Array.isArray(oldData.mocks)) {
    throw new Error('Input file does not contain a "mocks" array. Please check the file format.');
  }
  
  console.log(`Found ${oldData.mocks.length} mocks in the input file.`);
  
  // Extract and transform the mocks
  const migratedMocks = oldData.mocks.map(mock => {
    // Ensure all required fields are present
    if (!mock.id || !mock.url || !mock.method || mock.status === undefined) {
      console.warn(`Warning: Mock "${mock.name || 'unnamed'}" is missing required fields. It may not work correctly.`);
    }
    
    // Ensure the mock has the 'active' property
    if (mock.active === undefined) {
      mock.active = true;
    }
    
    // Ensure the mock has a name
    if (!mock.name) {
      mock.name = `${mock.method} ${mock.url}`;
    }
    
    // Ensure the mock has a description
    if (!mock.description) {
      mock.description = '';
    }
    
    // Ensure the mock has a createdOn timestamp
    if (!mock.createdOn) {
      mock.createdOn = Date.now();
    }
    
    // Return the transformed mock with only the fields needed for import
    return {
      id: mock.id,
      method: mock.method,
      url: mock.url,
      status: mock.status,
      name: mock.name,
      description: mock.description,
      active: mock.active,
      createdOn: mock.createdOn,
      delay: mock.delay || 0,
      dynamic: mock.dynamic || false,
      headers: Array.isArray(mock.headers) ? mock.headers : [],
      response: mock.response || ''
    };
  });
  
  // Write the migrated data to the output file
  console.log(`Writing ${migratedMocks.length} migrated mocks to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(migratedMocks, null, 2), 'utf8');
  
  // Also create a backup of the full store data
  const BACKUP_FILE = 'mokku-store-backup.json';
  console.log(`Creating a full backup of the store data to ${BACKUP_FILE}...`);
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(oldData, null, 2), 'utf8');
  
  console.log('Migration completed successfully!');
  console.log(`You can now import ${OUTPUT_FILE} into Mokku.`);
  console.log(`A full backup of your store data has been saved to ${BACKUP_FILE}.`);
  
} catch (error) {
  console.error('Error during migration:', error.message);
  process.exit(1);
} 