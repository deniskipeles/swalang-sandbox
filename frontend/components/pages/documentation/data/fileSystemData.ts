export interface FileSystemNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  content?: string;
  children?: FileSystemNode[];
}

const initialFileSystem: FileSystemNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        children: [
          { 
            id: '3', 
            name: 'Button.md',
            type: 'file',
            content: `
# Button Component

This component renders a basic button element for user interaction within your React application.

## Usage

Import and use this component wherever a clickable button is required. You can easily extend it to handle events.

## Example

\`\`\`swalang
export const Button = () => <button>Click me</button>;
\`\`\`

## Notes

- The button currently lacks styling and event handling.
- To handle clicks, pass an \`onClick\` prop or add logic inside the component.
            `.trim()
          },
          { 
            id: '4', 
            name: 'Input.md',
            type: 'file',
            content: `
# Input Component

The Input component provides a controlled input field for text entry.

## Usage

Integrate this component into forms or UI elements where user text input is needed.

## Example

\`\`\`swalang
export const Input = () => <input type="text" />;
\`\`\`

## Notes

- The input lacks controlled value and event handlers.
- Customize type or placeholder as per your requirements.
            `.trim()
          },
        ],
      },
      { 
        id: '5', 
        name: 'App.md',
        type: 'file',
        content: `
# App Component

This is the root component of your React project. It serves as the main entry point and parent for your UI.

## Purpose

The App component sets up your application and initial interface for users.

## Example

\`\`\`swalang
import React from "react";

function App() {
  return <h1>Welcome to the Editor!</h1>;
}

export default App;
\`\`\`

## Notes

- Add routes, state management, or additional UI components here.
            `.trim()
      },
      { 
        id: '6', 
        name: 'index.md',
        type: 'file',
        content: `
# Entry Point (index.tsx)

This file serves as the entry point rendering your application into the browser DOM.

## Purpose

The index file bootstraps the React app and connects it to the root HTML div.

## Example

\`\`\`swalang
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

ReactDOM.render(<App />, document.getElementById("root"));
\`\`\`

## Notes

- Ensure the root div exists in your HTML.
- Common place to apply global providers.
            `.trim()
      },
    ],
  },
  {
    id: '7',
    name: 'public',
    type: 'folder',
    children: [
      { 
        id: '8', 
        name: 'index.md',
        type: 'file',
        content: `
# HTML Template (index.html)

This file provides the static structure into which your React application is injected.

## Structure

The HTML includes a root div and basic head metadata.

## Example

\`\`\`swalang
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
\`\`\`

## Notes

- The root div is essential for React rendering.
- Customize head for SEO and analytics as needed.
            `.trim()
      },
    ],
  },
  { 
    id: '9', 
    name: 'package.md', 
    type: 'file',
    content: `
# Project Configuration (package.json)

This file describes metadata and dependencies for your npm project.

## Fields

- \`name\`: The project name.
- \`version\`: Current version.
- \`private\`: Prevents accidental publication.

## Example

\`\`\`swalang
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true
}
\`\`\`

## Notes

- Add dependencies under \`dependencies\` or \`devDependencies\`.
            `.trim()
  },
  { 
    id: '10', 
    name: 'README.md', 
    type: 'file', 
    content: `
# My React App

Welcome! This project is a sample React application demonstrating a basic setup.

## Features

- Component-based architecture
- Simple structure and easy expansion

## Getting Started

Install dependencies:

\`\`\`swalang
npm install
\`\`\`

Run the app:

\`\`\`swalang
npm start
\`\`\`

## Structure

- \`src/components\`: UI components
- \`public\`: Static files
            `.trim()
  },
  { 
    id: '11', 
    name: 'styles.md', 
    type: 'file',
    content: `
# Global Styles

This file defines the base styling for your application.

## Example

\`\`\`swalang
body {
  font-family: sans-serif;
}
\`\`\`

## Notes

- Extend this file for additional global or component styles.
            `.trim()
  },
  { 
    id: '12', 
    name: 'main.md', 
    type: 'file',
    content: `
# Swalang Main Script

This file contains your Swalang scripting entry point.

## Example

\`\`\`swalang
print("Hello, Swalang!")
\`\`\`

## Notes

- Use this file to write and organize Swalang scripts.
            `.trim()
  },
];
export default initialFileSystem;
