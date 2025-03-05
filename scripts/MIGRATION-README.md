# Mokku Data Migration Scripts

This repository contains scripts to help migrate Mokku mock data from old formats to the format expected by the new import/export functionality.

## Available Scripts

### 1. migrate-mokku-data.js

This script is specifically designed for migrating data from the Mokku Chrome extension's storage format to the format expected by the import process.

#### Usage:

1. **Extract your existing Mokku data**:
   - Open Chrome DevTools in the Mokku extension panel (right-click > Inspect)
   - Go to the "Application" tab
   - Under "Storage", expand "Local Storage"
   - Find the key `mokku.extension.main.db`
   - Copy the value (it's a JSON string)
   - Paste it into a file named `old.json`

2. **Run the migration script**:
   ```bash
   node migrate-mokku-data.js
   ```

3. **Import the migrated data**:
   - The script will generate a file named `migrated-mocks.json`
   - Use the new Import/Export feature in Mokku to import this file

### 2. migrate-mocks.js

This is a more general-purpose script for converting mock data to the format expected by Mokku's import process.

#### Usage:

1. Save your mock data as `old.json`
2. Run the script:
   ```bash
   node migrate-mocks.js
   ```
3. Import the generated `migrated-mocks.json` file into Mokku

## What the Scripts Do

The migration scripts:

1. Read the input file (`old.json`)
2. Parse the JSON data
3. Extract the mocks array
4. Transform each mock to ensure it has all required fields
5. Write the migrated mocks to an output file (`migrated-mocks.json`)
6. Create a backup of the original data (`mokku-store-backup.json`)

## Required Fields for Mokku Mocks

Each mock must have the following fields:

- `id`: A unique identifier
- `method`: HTTP method (GET, POST, etc.)
- `url`: The URL to mock
- `status`: HTTP status code
- `name`: A name for the mock
- `active`: Whether the mock is active
- `createdOn`: Timestamp when the mock was created
- `delay`: Delay in milliseconds before responding
- `dynamic`: Whether the URL contains dynamic segments
- `headers`: Array of header objects with `name` and `value` properties
- `response`: The response body

## Troubleshooting

If you encounter issues with the JSON format, the script will attempt to fix common problems like trailing commas. If that fails, you may need to manually fix the JSON format before running the script again.

If you have any questions or need assistance, please open an issue in the Mokku repository. 