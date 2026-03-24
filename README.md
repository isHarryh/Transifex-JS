# Transifex-JS

My Tampermonkey Script for Transifex  
Transifex 平台自用油猴脚本

## Introduction

This Tampermonkey user script is designed to enhance the user experience on the [Transifex](https://app.transifex.com) web platform. It provides some functionalities to simplify some specific translation workflow.

### Features

Adds an "Edit" button to every glossary item you see in the "Glossary" side tab, providing quick access to:

- Delete a glossary item
- Delete the source note of a glossary item
- Delete the translation note of a glossary item

|                       Edit Button Demo                       |                       Edit Dialog Demo                       |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
| ![Edit Button Demo](docs/imgs/demo-glossary-edit-button.png) | ![Edit Dialog Demo](docs/imgs/demo-glossary-edit-dialog.png) |

### Changelog

View the [CHANGELOG.md](./CHANGELOG.md) file for a detailed list of changes and updates to this project.

## Getting Started

To install and use this script, follow these steps:

1. Add the [Tampermonkey](https://www.tampermonkey.net/) extension to your browser.
2. Open the file [dist/transifex-js.user.js](./dist/transifex-js.user.js) in this repository.
3. There're two ways to install the script:
   - Click the "Raw" button (in GitHub file page) to view the raw  code, then wait for Tampermonkey to prompt you to install the script.
   - Alternatively, you can copy the entire content of that code file and paste it into a new script in the Tampermonkey dashboard.
4. Enable "Developer Mode" in your browser's extension settings.
5. Navigate to any Transifex editor page and enjoy it!

## Development

### Setup

You should have [Node.js](https://nodejs.org/) installed on your machine and `pnpm` (or `npm`) available.

Then, run the following command in this repository's root directory to install the dependencies:

```bash
pnpm install
```

### Debug with hot-reload

You should have Tampermonkey installed in your browser and enable "Developer Mode" in the extension settings.

Then, run the following command to start the development server with hot-reload:

```bash
pnpm dev
```

### Build

To generate the distributable script file, run the following command:

```bash
pnpm build
```

## Licensing

This project is licensed under the MIT License. See the [License](https://github.com/isHarryh/Transifex-JS/blob/main/LICENSE) file for more details.
