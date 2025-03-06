# Mokku Refreshed

## Features added in V3.0.0

### Projects

Users can now create and manage different projects in the app. This will keep the user focused with mocks that are only relevant to the given project.
- Create, rename, delete projects inside new Projects view
- Filter mocks by project with new project select box in app nav bar
- Create and add project names to mocks in add/update mock view
  
### Import / Export

Users can now import and export their mocks database for sharing. This will help keep team members in sync with mocks.
- New Import/Export icon button added to app nav bar
- New Import/Export view screen added
- Can import json mocks db from disk or from remote url
- Can export mocks db to json file on disk

### Tagging
Users can now attatch multiple tags to mocks. This will assist in dialing in on what mocks are relevant to the user's workflow at the moment. 
- New multi-select tags field added to add/update mock views
- New Tags column added to main mocks dashboard table, tags appear as display pills

### Visual enhancements
Several new visual improvements have been added as well:
- New button in app nav bar that allows the user to toggle the view of all mocks or only non-200 status mocks
- Search box now allows for specificity. The search box, by default, searches through many fields to produce a global search. Users can now use syntax to specify what field to search to find 
  - name:api - Search for mocks with "api" in their name
  - url:users - Search for mocks with "users" in their URL
  - tags:dashboard - Search for mocks with the "dashboard" tag
  - status:404 - Search for mocks with status code 404
  - delay:1000 - Search for mocks with a delay of 1000ms
  - method:GET - Search for GET mocks
- Mocks dashboard table headers are now sortable (ascending/descending)

  

---
## Past info, maintained for posterity


### About

Mokku helps user by mocking API and changing their response, response time and status, user can try all test case scenario like long loading time, error states, or any missing or incorrect data.

Mokku adds itself as a tab in dev tools as a panel. In the tab user can see network logs and mocks. Any network call from the logs can be mocked by simply clicking mock button then response can be edited. User can also search logs. Mock can also be created from scratch from create mock button.

All URL's are accessible but Mokku doesn't inject scripts into any pages apart from which are served locally and accessed using 'http://localhost\*' until enabled from the Panel.

Collections & Dynamic mock generators coming soon!

You can submit issues, bugs or feature request at https://github.com/mukuljainx/mokku/issues

This extension is development phase, might not work in some kind of response like md files.

### Features

1. Mock API call, specify JSON body, status, time delay and even headers 🙌.
2. **Wild Card:** add `(.*)` as wild card in url which will match anything, for example: `some-domain/user/(.*)/messages`. This will match `some-domain/user/u1/messages` and `some-domain/user/u2/messages` too.

### GraphQL

Mokku doesn't support GraphQL as of now.

### Privacy policy

Mokku does not collect or ask for any personal information, though it will store the mocks the chrome local store & all the hosts name where it has been enabled once to provide better experience to user.

## Dev Guide

### Prerequisites

- [node + npm](https://nodejs.org/) (Current Version)

### Project Structure

- dist: Chrome Extension directory
- dist/js: Generated JavaScript files

### Setup

`npm install`

### Dev

`npm run watch`

### Build

`npm run build`

### Load extension to chrome

Load `dist` directory. All the files are refreshed without extension reload except content script. Reload the extension to see the changes.

### Built on

[Chitbat Chrome extension starter kit](https://github.com/chibat/chrome-extension-typescript-starter)
