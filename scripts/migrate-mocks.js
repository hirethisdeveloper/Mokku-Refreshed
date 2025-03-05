#!/usr/bin/env node

/**
 * Migration script to convert old Mokku mock data format to the new format
 * expected by the import process.
 * 
 * Usage:
 * 1. Save your old mock data as old.json
 * 2. Run: node migrate-mocks.js
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
  const oldData = JSON.parse(rawData);
  
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
    
    // Return the transformed mock
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
  
  console.log('Migration completed successfully!');
  console.log(`You can now import ${OUTPUT_FILE} into Mokku.`);
  
} catch (error) {
  console.error('Error during migration:', error.message);
  process.exit(1);
} 