import { FileSystemNode } from './types';

// export const SWALANG_API_URL = 'https://swalang-sandbox.onrender.com';
export const SWALANG_API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export const initialFileSystem: FileSystemNode[] = [
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
          { id: '3', name: 'Button.tsx', type: 'file', content: 'export const Button = () => <button>Click me</button>;' },
          { id: '4', name: 'Input.tsx', type: 'file', content: 'export const Input = () => <input type="text" />;' },
        ],
      },
      { id: '5', name: 'App.tsx', type: 'file', content: 'import React from "react";\n\nfunction App() {\n  return <h1>Welcome to the Editor!</h1>;\n}\n\nexport default App;' },
      { id: '6', name: 'index.tsx', type: 'file', content: 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));' },
    ],
  },
  {
    id: '7',
    name: 'public',
    type: 'folder',
    children: [
      { id: '8', name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>' },
    ],
  },
  { id: '9', name: 'package.json', type: 'file', content: '{\n  "name": "my-app",\n  "version": "0.1.0",\n  "private": true\n}' },
  { id: '10', name: 'README.md', type: 'file', content: '# My React App\n\nThis is a sample project.' },
  { id: '11', name: 'styles.css', type: 'file', content: 'body {\n  font-family: sans-serif;\n}' },
  { id: '12', name: 'main.sw', type: 'file', content: 'print("Hello, Swalang!")' },
];